import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { GradeRequest, GradingResult } from '@/lib/types';
import { GRADING_PROMPT } from '@/data/graderPrompt';
import { saveGameSession, checkDatabaseConnection } from '@/lib/db';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenario, position, userResponse, promptId, promptCategory, userId, durationSeconds } = body;

    if (!scenario || !position || !userResponse) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prepare the grading prompt
    const filledPrompt = GRADING_PROMPT
      .replace('{scenario}', scenario)
      .replace('{position}', position)
      .replace('{userResponse}', userResponse);

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
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
      throw new Error('Could not parse response from Claude');
    }

    const parsedData = JSON.parse(jsonMatch[0].replace(/```json\n/, '').replace(/\n```/, ''));

    const result: GradingResult = {
      detected: parsedData.grading.detected,
      score: parsedData.grading.score,
      feedback: parsedData.grading.feedback,
      rubricScores: parsedData.grading.rubricScores,
      timestamp: new Date().toISOString(),
    };

    // Add AI comparison response to the result
    const aiResponse = parsedData.aiComparison?.aiResponse || null;

    // Save to database if user ID is provided
    if (userId) {
      try {
        const isConnected = await checkDatabaseConnection();

        if (isConnected) {
          // Get IP address and user agent from request
          const ipAddress = request.headers.get('x-forwarded-for') ||
                           request.headers.get('x-real-ip') ||
                           'unknown';
          const userAgent = request.headers.get('user-agent') || 'unknown';

          await saveGameSession({
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
