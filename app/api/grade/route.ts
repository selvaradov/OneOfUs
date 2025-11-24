import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { GradeRequest, GradingResult } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const GRADING_PROMPT = `You are grading an Ideological Turing Test submission. A player has attempted to write from a specific political perspective.

**Scenario:** {scenario}

**Position they're claiming to embody:** {position}

**Their response:**
{userResponse}

---

Your task is to determine if they truly understand this ideology, or if they're just mimicking surface-level language.

**Critical distinction:** Don't be fooled by someone who just uses the right buzzwords or tone. Focus on whether they demonstrate genuine understanding of:
- The underlying values and priorities of this position
- The actual reasoning patterns and trade-offs people with this view consider
- The real concerns and motivations (not stereotypes or caricatures)

Someone can write in a casual, informal style and still demonstrate deep understanding. Conversely, someone can use all the right jargon but reveal they don't actually grasp the ideology.

**Scoring criteria (total 100 points):**
1. Authenticity of voice (20 points): Do they sound genuinely committed to this position?
2. Shibboleths/in-group language (20 points): Right terminology and framing?
3. Steelmanning (20 points): Strong version of the argument, not caricature?
4. Tone appropriateness (20 points): Matches both the position and medium?
5. Coherence (20 points): Logically consistent and factually reasonable?

Generally, 70+ means undetected, below 70 means detected (but use your judgment).

**Important:** Address the user directly in second person ("you", "your") not third person ("they", "the player").

**Output TWO things as JSON:**

1. Your grading:
{
  "detected": boolean,
  "score": number,
  "rubricScores": {
    "authenticity": number,
    "shibboleths": number,
    "steelmanning": number,
    "tone": number,
    "coherence": number
  },
  "feedback": "One paragraph (3-5 sentences) addressing the user directly. Use 'you' and 'your'. Be playful and direct, not lecture-y. If detected, tell them what gave them away. If undetected, acknowledge what they got right."
}

2. An AI-generated response from the same position:
{
  "aiResponse": "Write YOUR OWN response to the same scenario from the same position, showing how someone genuinely holding this view might write it. Match the length and format of what was requested."
}

Return as:
{
  "grading": { ... },
  "aiComparison": { "aiResponse": "..." }
}`;

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
