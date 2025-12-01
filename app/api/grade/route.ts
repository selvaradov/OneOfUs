import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { GradingResult, PoliticalPosition, VALID_POSITIONS } from '@/lib/types';
import { GRADING_PROMPT } from '@/data/graderPrompt';
import { saveGameSession, checkDatabaseConnection } from '@/lib/db';
import { getPromptById } from '@/lib/prompts';
import { getPositionDescription, getExampleFigures } from '@/lib/positionDescriptions';
import { gradeRateLimiter, getClientIp, checkRateLimit } from '@/lib/ratelimit';

const MODEL = 'claude-haiku-4-5';

function isValidPosition(position: string): position is PoliticalPosition {
  return VALID_POSITIONS.includes(position as PoliticalPosition);
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Validation helper for rubric scores
function validateAndClampRubricScores(scores: {
  understanding?: number;
  authenticity?: number;
  execution?: number;
}): {
  understanding: number;
  authenticity: number;
  execution: number;
} {
  const understanding = Math.max(0, Math.min(65, Number(scores.understanding) || 0));
  const authenticity = Math.max(0, Math.min(20, Number(scores.authenticity) || 0));
  const execution = Math.max(0, Math.min(15, Number(scores.execution) || 0));

  // Log warning if scores were out of range
  if (understanding !== Number(scores.understanding)) {
    console.warn(
      `Understanding score out of range: ${scores.understanding}, clamped to ${understanding}`
    );
  }
  if (authenticity !== Number(scores.authenticity)) {
    console.warn(
      `Authenticity score out of range: ${scores.authenticity}, clamped to ${authenticity}`
    );
  }
  if (execution !== Number(scores.execution)) {
    console.warn(`Execution score out of range: ${scores.execution}, clamped to ${execution}`);
  }

  return { understanding, authenticity, execution };
}

export async function POST(request: NextRequest) {
  try {
    // Extract IP address for rate limiting
    const clientIp = getClientIp(request);

    // Check hourly rate limit (20 requests/hour)
    const hourlyLimit = await checkRateLimit(gradeRateLimiter.hourly, clientIp, 'hourly');

    if (hourlyLimit && !hourlyLimit.success) {
      console.warn('[RATE_LIMIT] Hourly limit exceeded', {
        ip: clientIp,
        limit: hourlyLimit.limit,
        reset: new Date(hourlyLimit.reset).toISOString(),
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. You can make 20 requests per hour.',
          retryAfter: Math.ceil((hourlyLimit.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((hourlyLimit.reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(hourlyLimit.limit),
            'X-RateLimit-Remaining': String(hourlyLimit.remaining),
            'X-RateLimit-Reset': String(hourlyLimit.reset),
          },
        }
      );
    }

    // Check daily rate limit (50 requests/day)
    const dailyLimit = await checkRateLimit(gradeRateLimiter.daily, clientIp, 'daily');

    if (dailyLimit && !dailyLimit.success) {
      console.warn('[RATE_LIMIT] Daily limit exceeded', {
        ip: clientIp,
        limit: dailyLimit.limit,
        reset: new Date(dailyLimit.reset).toISOString(),
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Daily rate limit exceeded. You can make 50 requests per day.',
          retryAfter: Math.ceil((dailyLimit.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((dailyLimit.reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(dailyLimit.limit),
            'X-RateLimit-Remaining': String(dailyLimit.remaining),
            'X-RateLimit-Reset': String(dailyLimit.reset),
          },
        }
      );
    }

    const body = await request.json();
    const { position, userResponse, promptId, userId, durationSeconds } = body;

    // Input validation - required fields
    if (!position || !userResponse || !promptId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: promptId, position, userResponse' },
        { status: 400 }
      );
    }

    // Basic type validation
    if (
      typeof position !== 'string' ||
      typeof userResponse !== 'string' ||
      typeof promptId !== 'string'
    ) {
      return NextResponse.json({ success: false, error: 'Invalid field types' }, { status: 400 });
    }

    // Look up prompt by ID (single source of truth)
    const prompt = getPromptById(promptId);
    if (!prompt) {
      return NextResponse.json(
        { success: false, error: `Invalid promptId: ${promptId} not found` },
        { status: 404 }
      );
    }

    // Extract scenario and category from prompt (not from client)
    const scenario = prompt.scenario;
    const promptCategory = prompt.category;

    // Length validation - reject if too long (don't truncate)
    const MAX_LENGTH = 1000; // Safety cap (prompts have individual limits)
    if (userResponse.length > MAX_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Response exceeds ${MAX_LENGTH} character limit` },
        { status: 400 }
      );
    }

    // Empty/whitespace check
    if (userResponse.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Response cannot be empty or whitespace only' },
        { status: 400 }
      );
    }

    // Position validation
    if (!isValidPosition(position)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid position. Must be one of: ${VALID_POSITIONS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Prepare the grading prompt
    const positionDescription = getPositionDescription(position);
    const exampleFigures = getExampleFigures(position).join(', ');
    const charLimit = prompt.charLimit.toString();
    const filledPrompt = GRADING_PROMPT.replace('{scenario}', scenario)
      .replace(/{position}/g, positionDescription)
      .replace('{exampleFigures}', exampleFigures)
      .replace(/{charLimit}/g, charLimit)
      .replace('{userResponse}', userResponse);

    // Call Claude API
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: filledPrompt,
        },
      ],
    });

    // Parse the response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response (it might be wrapped in markdown code blocks)
    let jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      jsonMatch = responseText.match(/\{[\s\S]*\}/);
    }

    if (!jsonMatch) {
      console.error('Could not find JSON in Claude response:', responseText);
      throw new Error('Could not parse response from Claude - no JSON found');
    }

    let parsedData;
    try {
      const jsonString = jsonMatch[0].replace(/```json\n/, '').replace(/\n```/, '');
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Attempted to parse:', jsonMatch[0]);
      throw new Error('Could not parse response from Claude - invalid JSON');
    }

    // Validate required fields
    if (!parsedData.grading || !parsedData.grading.rubricScores) {
      console.error('Missing required fields in parsed data:', parsedData);
      throw new Error('Response missing required grading fields');
    }

    // Validate and clamp rubric scores to correct ranges
    const rubricScores = validateAndClampRubricScores(parsedData.grading.rubricScores);

    // Calculate total score from rubric scores (don't trust LLM to do this)
    const totalScore =
      rubricScores.understanding + rubricScores.authenticity + rubricScores.execution;

    const result: GradingResult = {
      detected: parsedData.grading.detected,
      score: totalScore, // Calculated from rubric scores, not from LLM
      feedback: parsedData.grading.feedback || 'No feedback provided',
      rubricScores,
      timestamp: new Date().toISOString(),
    };

    // Add AI comparison response to the result
    const aiResponse = parsedData.aiComparison?.aiResponse || null;

    // Save to database if user ID is provided
    let sessionId: string | null = null;
    if (userId) {
      try {
        const isConnected = await checkDatabaseConnection();

        if (isConnected) {
          // Get IP address and user agent from request
          const ipAddress =
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
          const userAgent = request.headers.get('user-agent') || 'unknown';

          sessionId = await saveGameSession({
            userId,
            promptId: promptId || 'unknown',
            promptScenario: scenario,
            promptCategory: promptCategory || 'other',
            positionAssigned: position,
            userResponse,
            charCount: userResponse.length,
            detected: result.detected,
            score: result.score,
            feedback: result.feedback,
            rubricUnderstanding: result.rubricScores?.understanding,
            rubricAuthenticity: result.rubricScores?.authenticity,
            rubricExecution: result.rubricScores?.execution,
            aiComparisonResponse: aiResponse,
            ipAddress,
            userAgent,
            durationSeconds: durationSeconds || undefined,
          });

          console.log('Game session saved to database for user:', userId);
        } else {
          console.warn('Database connection unavailable, session not saved to DB');
        }
      } catch (error) {
        // Don't fail the request if database save fails
        console.error('Error saving session to database:', error);
      }
    }

    return NextResponse.json({
      success: true,
      sessionId: sessionId,
      result,
      aiResponse,
    });
  } catch (error) {
    console.error('Error grading response:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
