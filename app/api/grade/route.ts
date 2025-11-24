import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { GradeRequest, GradeResponse, GradingResult } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const GRADING_PROMPT = `You are grading an Ideological Turing Test submission. A player has attempted to write from a specific political perspective.

Your task is to evaluate whether their response is authentic and convincing.

**Scenario:** {scenario}

**Position they're claiming to embody:** {position}

**Their response:**
{userResponse}

---

Evaluate this response on the following criteria (well-calibrated, not too harsh or too lenient):

1. **Authenticity of voice** (20 points): Does this sound like someone genuinely holding this position?
2. **Use of shibboleths/in-group language** (20 points): Do they use the right terminology, references, and framing?
3. **Steelmanning the position** (20 points): Is this a strong version of the argument, not a caricature?
4. **Tone appropriateness** (20 points): Does the tone match both the position and the medium/scenario?
5. **Coherence and logic** (20 points): Are the claims factually reasonable and logically consistent?

**Output format:**
Provide your response as JSON with this exact structure:
{
  "detected": boolean,  // true if you think they're pretending, false if they could be genuine
  "score": number,      // total score out of 100
  "feedback": string,   // 2-3 paragraphs of playful, insightful feedback explaining your decision
  "rubricScores": {
    "authenticity": number,
    "shibboleths": number,
    "steelmanning": number,
    "tone": number,
    "coherence": number
  }
}

Make the feedback engaging and constructive. If they're detected, explain what gave them away. If they pass, acknowledge what they did well.`;

export async function POST(request: NextRequest) {
  try {
    const body: GradeRequest = await request.json();
    const { scenario, position, userResponse } = body;

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
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
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

    const gradingData = JSON.parse(jsonMatch[0].replace(/```json\n/, '').replace(/\n```/, ''));

    const result: GradingResult = {
      detected: gradingData.detected,
      score: gradingData.score,
      feedback: gradingData.feedback,
      rubricScores: gradingData.rubricScores,
      timestamp: new Date().toISOString(),
    };

    const response: GradeResponse = {
      success: true,
      result,
    };

    return NextResponse.json(response);
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
