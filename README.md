# Ideological Turing Test game ("OneOfUs")


## AI planning
- https://claude.ai/chat/574ff6bb-737a-4973-ad8f-4f225ae809f4
- https://gemini.google.com/app/7631690d434090cb
- https://chatgpt.com/c/6924aa6a-c87c-832d-a9cd-6f3c94d5cbc0


## Existing work
- www.ituringtest.com but you have to judge others' work, not submit your own responses. Also not very fun
  (no instant results, need to fill out info to get score, etc)
- www.debate-devil.com and deepgram.com/ai-apps/opinionate on debating side
- Anthropic putting Claude and other models through ITT: https://www.anthropic.com/news/political-even-handedness
- not-v-interesting-seeming but on the topic: https://arxiv.org/pdf/2506.14645 

## Plan
- We can have a singleplayer version where there's an LLM grader
- A multiplayer mode where you submit responses and other humans judge is further along the roadmap.
  - You need to rely on self-reports of political alignment
  - Would need LLM moderator to prevent profanity
  - User account management, etc

### Mechanics
- We should frame the task ina  more interesting way than "write a 200-word response from the position of P 
  about XYZ". 
  - Some Claude-generated ideas:
    - Tweet battle: "You're a \[conservative/progressive] account with 50k followers. Tweet thread (3 tweets) about \[issue]"
    - Letters to MPs/representatives: "Write to your MP as a concerned \[demographic] asking them to vote \[for/against] - \[specific bill]"
    - Reddit comment: "You're in r/\[relevant_sub]. Someone just posted \[provocative take]. Write a response defending \[opposite position]"
    - WhatsApp family group: "Your \[politically-opposite relative] just sent \[hot take] in the family group. Respond without starting a fight"
    - Dating profile political question: "Hinge asks: 'What's a political cause you care about?' Answer as someone who \[position]"
    - Pub argument: "You're at the pub. Someone says \[claim]. Make the case for why they're wrong, from a \[position] perspective"
    - Think-piece headline: "Write the opening paragraph of a Guardian/Telegraph opinion piece titled: '\[provocative headline]'"
    - Protest sign: "You're at a \[type] protest. Your sign needs to be punchy but authentic. What does it say? (+ one sentence explaining why)"
    - Comment under a news article: "You're commenting under \[recent news story]. Make the \[left/right] case in a way that gets upvoted"
    - Talk radio call-in: "You've got 30 seconds on \[host]'s show. Make your point about \[issue] from a \[position] view"
- Gemini had a nice idea that the user could be dropped into a chatroom with several other NPC LLMs from P position,
  and they need to be the "undercover agent" that doesn't get ratted out over an extended conversation i.e. 
  repeated game, rather than one-shot. I think this could be a lot of fun.
    - However, high inference costs? Also Gemini points out latency could make UX terrible.
    - Some similar Gemini suggestions:
      - You are in a #general Slack channel at a large tech company. The CEO posts a vague, "neutral" update about a controversial policy.
        The Task: You must signal support/dissent to your specific political faction without alerting HR or the "normies."
          - However, not necessarily very _political_
      - Family WhatsApp group with Misguided Uncle Dave
      - Dating app simulator (hmm, not sure how natural this one feels. But sth about men vs women divide would be interesting)
      - The Reply Guy (Twitter) -- You are a covert \[Liberal] trying to build clout in a \[Conservative] Twitter circle (or vice versa),
        replying to a viral tweet from a major figure. (this now stretches into "how well can you dryly parody people")
- ChatGPT ideas:
  - Diary entry in response to headline
  - Agony aunt column from a particular political orientation
- Various LLMs suggest "level up" mechanics, e.g. "you unlocked Liberal, now try XXX"

### Grading
- See the Anthropic paper for some thoughts.
  - Can I use their "paired prompt evals?"
  - Might be helpful to switch between different LLMs as grader. Although Claude is free for me and others not...
- Design a rubric and system prompt
  - Should consider whether it's a steelman, length of answer, tone, vocabulary & use of shibboleths/in-group language, 

## Notes
- Would be good to collect self-reports on political alignment etc from the start, since then you can use
  the v1 resposnes as training etc.

---

## MVP Development Plan

### Tech Stack
- **Frontend**: Next.js 14+ (App Router) with React, TypeScript, Tailwind CSS
- **Deployment**: Vercel (free tier, seamless Next.js integration)
- **LLM API**: Anthropic Claude API (Sonnet 4.5 for grading)
- **State Management**: React hooks (no additional library needed for MVP)
- **Data Persistence**: LocalStorage for MVP (no backend/auth needed initially)

### MVP Feature Set (Single-Player Mode)

**Core Flow**:
1. Landing page with game explanation
2. User self-reports their political alignment via onboarding modal (max 3 questions, blurred game behind)
3. Game presents a randomly selected prompt/scenario
4. User selects which political position they'll attempt to embody
5. User writes their response (with character/word count guidance)
6. Submit to Claude API for grading
7. Display results: playful feedback (detected vs. undetected)

**Future Roadmap (Post-MVP)**:
- **Immersive groupchat scenario**: User dropped into conversation with NPC LLMs representing a political position, must blend in without getting "detected" over extended multi-turn conversation (inspired by Gemini suggestion)
  - Consider inference costs and latency challenges
  - Could be "Family WhatsApp group," "Twitter replies," or "Slack channel" format
- Multiplayer mode with human judges
- Difficulty levels and progression system
- Aggregate statistics display

**Initial Prompt Categories** (start with 3-5):
- Tweet thread (3 tweets about a political issue)
- Reddit comment (responding to a provocative take)
- Letter to representative (about a specific issue)
- Comment under news article
- WhatsApp family group response

**Grading Criteria** (for system prompt):
- Authenticity of voice (20 points)
- Use of appropriate shibboleths/in-group language (20 points)
- Steelmanning the position (not caricature) (20 points)
- Tone appropriateness for the medium (20 points)
- Factual coherence and logical consistency (20 points)
- **Total: 100 points**

### Implementation Phases

**Phase 1: Basic UI/UX** (1-2 days)
- [ ] Next.js project setup with TypeScript + Tailwind
- [ ] Landing page with game rules
- [ ] Prompt selection screen
- [ ] Text input interface with character counter
- [ ] Results display page
- [ ] Basic routing between screens

**Phase 2: Prompt System** (1 day)
- [ ] Create JSON file with 5-10 initial prompts across different formats
- [ ] Each prompt includes: scenario text, political positions available, word/character limits
- [ ] Random prompt selection logic
- [ ] Prompt display with clear instructions

**Phase 3: LLM Integration** (1-2 days)
- [ ] Set up Anthropic API client
- [ ] Design grading system prompt with rubric
- [ ] Implement API call to grade user response
- [ ] Parse and display structured feedback
- [ ] Error handling for API failures

**Phase 4: User Experience Polish** (1 day)
- [ ] Loading states during grading
- [ ] Local storage for user's political alignment (optional)
- [ ] Score history in localStorage
- [ ] "Play Again" flow
- [ ] Responsive design for mobile

**Phase 5: Testing & Refinement** (ongoing)
- [ ] Test with real users
- [ ] Iterate on grading prompts based on results
- [ ] Refine UI based on feedback
- [ ] Add more prompt scenarios

### Decisions Made

**API & Infrastructure**:
- ✅ Anthropic API key available with $50 budget (sufficient for MVP experimentation)
- ✅ Data storage: Start with localStorage for iteration, design data models to easily migrate to database later
- ✅ Database will be added before deployment for metrics tracking (likely Vercel Postgres or Supabase)
- ✅ Use Next.js API routes from the start to establish backend structure

**Content & UX**:
- ✅ Prompts: Start with UK politics focus, but keep system region-agnostic where possible
- ✅ Feedback style: Playful and scenario-based (detected vs. undetected)
  - MVP: Simple feedback format (whatever's easiest to implement)
  - Future: Self-revealing scenarios where you either "pass" or "get caught"
- ✅ User alignment: YES - collect via brief onboarding (max 3 questions)
  - Show questions in modal with blurred game behind for motivation
  - Data stored for future analysis

- ✅ Scoring Philosophy: Well-calibrated grader (neither too easy nor too hard), prompt can be tuned later
- ⏸️ Questions 7-9: Deferred for post-MVP

### Detailed Implementation Checklist

**Step 1: Project Setup & Structure**
- [ ] Initialize Next.js 14+ project with TypeScript and App Router
- [ ] Configure Tailwind CSS with base styling setup
- [ ] Set up project folder structure:
  - [ ] `/app` - Next.js app router pages
  - [ ] `/components` - React components
  - [ ] `/lib` - Utilities, types, API clients
  - [ ] `/data` - JSON files for prompts
  - [ ] `/app/api` - API routes for Claude integration
- [ ] Create `.env.local` for Anthropic API key
- [ ] Add `.env.local` to `.gitignore`
- [ ] Install dependencies: `@anthropic-ai/sdk`

**Step 2: Type Definitions & Data Models**
- [ ] Create TypeScript interfaces:
  - [ ] `Prompt` type (id, category, scenario, positions, charLimit, etc.)
  - [ ] `UserAlignment` type (for onboarding data)
  - [ ] `GameSession` type (prompt, user response, position chosen, etc.)
  - [ ] `GradingResult` type (score, feedback, detected/undetected)
- [ ] Design data structure to be database-ready (add IDs, timestamps, etc.)

**Step 3: Initial Prompts Content**
- [ ] Create `/data/prompts.json` with 5-10 UK-focused prompts
- [ ] Include variety: Tweet threads, Reddit comments, Letters to MP, News comments, WhatsApp family
- [ ] Each prompt specifies: scenario text, available political positions, character limits
- [ ] Keep structure region-agnostic where possible

**Step 4: Landing Page & Layout**
- [ ] Create landing page (`/app/page.tsx`) with:
  - [ ] Game title and tagline
  - [ ] Brief explanation of Ideological Turing Test
  - [ ] "Start Playing" CTA button
  - [ ] Basic responsive layout with Tailwind
- [ ] Create base layout with consistent styling

**Step 5: Onboarding Modal**
- [ ] Create onboarding modal component (max 3 questions)
- [ ] Questions to collect:
  - [ ] Political alignment (e.g., 5-point scale or categorical)
  - [ ] Age range (optional)
  - [ ] Country/region (optional, default UK)
- [ ] Implement backdrop blur effect
- [ ] Store responses in localStorage
- [ ] Modal only shows on first visit (check localStorage)

**Step 6: Game Screen UI**
- [ ] Create game page (`/app/game/page.tsx`)
- [ ] Random prompt selection from prompts.json
- [ ] Display scenario with clear formatting
- [ ] Position selector (buttons/dropdown for available positions)
- [ ] Text area with character counter
- [ ] Visual feedback for character limit guidance
- [ ] Submit button (disabled until position selected + text entered)
- [ ] Loading state during API call

**Step 7: Claude API Integration**
- [ ] Create API route `/app/api/grade/route.ts`
- [ ] Set up Anthropic SDK client with API key from env
- [ ] Design grading system prompt with rubric
- [ ] Handle API request: receive user response, prompt context, position
- [ ] Call Claude API with grading prompt
- [ ] Parse response and return structured feedback
- [ ] Add error handling and rate limiting awareness

**Step 8: Results Screen**
- [ ] Create results page/component
- [ ] Display playful feedback (detected vs. undetected message)
- [ ] Show score if applicable
- [ ] Show Claude's specific feedback/reasoning
- [ ] "Play Again" button (returns to game with new prompt)
- [ ] Option to review original prompt and user's response

**Step 9: localStorage Persistence**
- [ ] Save game sessions to localStorage
- [ ] Store: timestamp, prompt ID, position chosen, user response, grading result
- [ ] Implement simple history view (optional for MVP)
- [ ] Ensure data model matches future database schema

**Step 10: Polish & Testing**
- [ ] Responsive design testing (mobile, tablet, desktop)
- [ ] Error states for API failures
- [ ] Loading states and transitions
- [ ] Basic accessibility (keyboard navigation, ARIA labels)
- [ ] Test with various prompt types
- [ ] Iterate on grading prompt based on results

**Step 11: Deployment Preparation**
- [ ] Test locally with API key
- [ ] Set up Vercel project
- [ ] Configure environment variables in Vercel
- [ ] Deploy preview build
- [ ] Verify API routes work in production
- [ ] (Database integration will come before public launch)