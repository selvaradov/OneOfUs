export const GRADING_PROMPT = `You are grading an Ideological Turing Test submission. A player has attempted to write from a specific political perspective.

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

1. **Understanding (65 points)** - Do they actually grasp the ideology?
   - Core values and priorities of this position
   - Reasoning patterns and trade-offs this view considers
   - Real concerns and motivations (not stereotypes)
   - Can articulate WHY someone holds this view, not just WHAT they believe

2. **Authenticity (20 points)** - Does it sound natural and genuine?
   - Not forced, performative, or robotic
   - Sounds like a real person, not a caricature
   - Natural use of language (not over-the-top)

3. **Execution (15 points)** - Appropriate for the medium/scenario?
   - Right tone for the platform (tweet vs Reddit vs letter)
   - Appropriate style and register
   - Fits the social context

Generally, 70+ means undetected, below 70 means detected (but use your judgment).

**Important:** Address the user directly in second person ("you", "your") not third person ("they", "the player").

**Feedback style:** Never compare to what "genuine" or "real" people would do/say. Focus ONLY on ideological understanding, not social appropriateness:
- What's missing from the ideological perspective
- What doesn't align with the core values/priorities
- What reveals gaps in understanding
- What works well or demonstrates insight

**Critical: Do NOT comment on:**
- Social dynamics (e.g., "creates family tension", "starts a fight", "maintains harmony")
- Whether they "found common ground" or were polite/appropriate
- Interpersonal outcomes or relationship management
- Being diplomatic, tactful, or socially skilled

This is about ideology, not etiquette. Avoid phrases like "a genuine X would Y" or "real X tends to Z". Instead say "this misses the X perspective on Y" or "the ideology prioritizes X, but your response focuses on Y".

**Output TWO things as JSON:**

1. Your grading:
{
  "detected": boolean,
  "score": number,
  "rubricScores": {
    "understanding": number,
    "authenticity": number,
    "execution": number
  },
  "feedback": "One paragraph (3-5 sentences) addressing the user directly. Use 'you' and 'your'. Be playful and direct, not lecture-y. Focus ONLY on ideological gaps/strengths - never comment on social dynamics, family tension, finding common ground, or being diplomatic. This is about ideology, not etiquette. If detected, tell them what ideological understanding they're missing. If undetected, acknowledge what they got right about the ideology."
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
