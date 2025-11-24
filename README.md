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

### Implementation Phases - ALL COMPLETE ✓

**Phase 1: Basic UI/UX**
- ✅ Next.js project setup with TypeScript + Tailwind
- ✅ Landing page with game rules
- ✅ Random prompt assignment (no selection screen)
- ✅ Text input interface with character counter
- ✅ Results display page with rubric visualization
- ✅ Routing: home → game → results → history

**Phase 2: Prompt System**
- ✅ Created `/data/scenarios.json` with 10 UK-focused scenarios
- ✅ Includes: tweets, reddit, news comments, WhatsApp, pub conversations
- ✅ Each prompt: scenario text, political positions, character limits, metadata
- ✅ Random prompt selection with position assignment

**Phase 3: LLM Integration**
- ✅ Anthropic API client configured
- ✅ Grading system prompt with 3-part rubric (Understanding 65pts, Authenticity 20pts, Execution 15pts)
- ✅ Grader extracted to `/data/graderPrompt.ts` for maintainability
- ✅ API call returns structured feedback + AI comparison response
- ✅ Error handling for API failures

**Phase 4: User Experience Polish**
- ✅ Playful loading indicator (darting HatGlasses with shimmer effect)
- ✅ Onboarding modal with 5-point slider for political alignment
- ✅ localStorage for sessions and alignment
- ✅ History page showing all previous attempts
- ✅ Navigation bar with Home/Play/History links
- ✅ Responsive design for mobile

**Phase 5: Testing & Refinement**
- ✅ Tested with real users and iterated on feedback
- ✅ Grading prompt refined: less lecture-y, focus on ideology not etiquette
- ✅ UI refined: orange theme, icons instead of emojis, visual progress bars
- ⏩ Ongoing: Add more scenarios, expand prompt library

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

### MVP Status: COMPLETE ✓

**Completed Steps:**
- ✅ Project setup with Next.js, TypeScript, Tailwind, Anthropic SDK
- ✅ Type definitions and data models (database-ready)
- ✅ 7 initial UK-focused prompts
- ✅ Landing page with game explanation
- ✅ Onboarding modal (3 questions with backdrop blur)
- ✅ Game page UI with prompt display, position selector, text input
- ✅ Claude API integration for grading
- ✅ Results page with score and feedback
- ✅ localStorage persistence

### Post-MVP Refinements - COMPLETED ✓

**UX/Flow Improvements:**
- ✅ **Position assignment**: Random assignment implemented
- ✅ **Reduce engagement barrier**: Shortened prompts (single tweets, shorter character limits)
- ✅ **Loading state**: Added darting HatGlasses loader with playful messages
- ✅ **Simplify feedback**: Grading prompt refined to avoid lecture-y tone
- ✅ **AI comparison**: Side-by-side AI response comparison implemented
- ✅ **Onboarding UX**: Replaced dropdowns with slider (5-point scale)
- ✅ **Color scheme**: Changed from purple to orange (#f97316)
- ✅ **Visual indicators**: Rubric with icons (Brain, Sparkles, Target) and progress bars
- ✅ **History page**: View all previous games with scores
- ✅ **Navigation**: Navbar with Home/Play/History links
- ✅ **Position descriptions**: More natural phrasing (e.g., "traditional conservative" vs "Right")
- ✅ **Grading improvements**: Focus on ideology, not social etiquette
- ✅ **Code organization**: Separated grader prompt into data/ directory

### Remaining Tasks

**High Priority:**
- [ ] **Backend database infrastructure**
  - [ ] Set up database for logging user sessions
  - [ ] Track: user IDs, profiles, IPs, timestamps, queries, grader outputs
  - [ ] Migrate from localStorage to database persistence
  - [ ] Consider: Vercel Postgres or Supabase

**Medium Priority:**
- [ ] **UI theme refresh**: More unique, quirky, internet-era feeling (not B2B SaaS)
  - Current orange theme is better than purple but could be more distinctive
- [ ] **Add more UK prompts**: Expand from 10 to 20-30 scenarios
- [ ] **Prompt difficulty system**: Tag scenarios by difficulty level

**Low Priority - Future Features:**
- [ ] **Recent news access**: Model awareness of current UK politics (e.g., Reform UK)
- [ ] **Aggregate statistics**: Show global stats across all users
- [ ] **Progressive difficulty**: Unlock harder prompts after success

---

## Backend Database Infrastructure Plan

### Database Choice: Vercel Postgres (recommended)
- Native Vercel integration with zero config
- PostgreSQL-compatible (standard SQL, robust querying)
- Generous free tier (60 hours compute time, 256MB storage)
- Automatic connection pooling via `@vercel/postgres`
- Alternative: Supabase (if need more features like auth, realtime, storage)

### Database Schema Design

**Tables:**

**1. `users` table**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  political_alignment INTEGER, -- 1-5 scale from onboarding
  age_range TEXT,
  country TEXT DEFAULT 'UK',
  total_games INTEGER DEFAULT 0,
  avg_score DECIMAL(5,2)
);
```

**2. `game_sessions` table**
```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Request data
  prompt_id TEXT NOT NULL,
  prompt_scenario TEXT NOT NULL,
  prompt_category TEXT NOT NULL,
  position_assigned TEXT NOT NULL,
  user_response TEXT NOT NULL,
  char_count INTEGER,

  -- Grading results
  detected BOOLEAN,
  score INTEGER,
  feedback TEXT,
  rubric_understanding INTEGER,
  rubric_authenticity INTEGER,
  rubric_execution INTEGER,
  ai_comparison_response TEXT,

  -- Metadata
  ip_address INET,
  user_agent TEXT,
  duration_seconds INTEGER,

  INDEX idx_user_sessions (user_id, created_at DESC),
  INDEX idx_prompt_performance (prompt_id, score),
  INDEX idx_position_performance (position_assigned, detected)
);
```

**3. `prompts_analytics` table** (optional - for tracking prompt difficulty)
```sql
CREATE TABLE prompts_analytics (
  prompt_id TEXT PRIMARY KEY,
  total_attempts INTEGER DEFAULT 0,
  avg_score DECIMAL(5,2),
  detection_rate DECIMAL(5,2), -- % detected
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Implementation Steps

**Phase 1: Database Setup & Schema**
- [ ] Create Vercel Postgres database in project
- [ ] Run schema migrations to create tables
- [ ] Set up connection pooling via `@vercel/postgres`
- [ ] Create database utility functions in `/lib/db.ts`
- [ ] Add database URL to environment variables

**Phase 2: User Management**
- [ ] Create `/app/api/user/route.ts` for user operations
- [ ] Modify onboarding to create user record on first visit
- [ ] Generate UUID for user, store in localStorage + database
- [ ] Migrate existing localStorage alignment data to database
- [ ] Update user stats after each game (total_games, avg_score)

**Phase 3: Game Session Persistence**
- [ ] Modify `/app/api/grade/route.ts` to save sessions to database
- [ ] Capture IP address and user agent from request headers
- [ ] Track session duration (submit time - page load time)
- [ ] Store full grading result including rubric breakdown
- [ ] Keep localStorage as fallback for offline/client-side access

**Phase 4: History & Analytics Queries**
- [ ] Update history page to fetch from database instead of localStorage
- [ ] Add pagination for user history (limit 20 per page)
- [ ] Create analytics queries:
  - User stats: total games, avg score, detection rate by position
  - Prompt difficulty: average scores per prompt
  - Position performance: which positions are easiest/hardest
- [ ] Optional: Create `/app/api/stats` endpoint for aggregate data

**Phase 5: Migration & Fallback**
- [ ] Create migration script to import existing localStorage sessions
- [ ] Add error handling: if DB unavailable, fall back to localStorage
- [ ] Test with existing users who have localStorage data
- [ ] Graceful degradation for DB connection failures

**Phase 6: Privacy & Compliance**
- [ ] Add privacy notice on landing page about data collection
- [ ] Implement data retention policy (e.g., delete sessions after 6 months)
- [ ] Optional: Allow users to export/delete their data
- [ ] Hash IP addresses for privacy (store hash, not raw IP)
- [ ] GDPR considerations: consent for data storage

### Database Utility Functions

**`/lib/db.ts`** - Core database operations:
- `createUser(alignment, ageRange, country)` → returns user UUID
- `saveGameSession(sessionData)` → saves game to DB
- `getUserHistory(userId, limit, offset)` → paginated history
- `getUserStats(userId)` → aggregate user performance
- `updateUserStats(userId)` → recalculate avg_score, total_games
- `getPromptAnalytics(promptId)` → prompt difficulty stats
- `getAllPromptsAnalytics()` → global prompt performance

### Data Flow After Implementation

1. **First Visit:**
   - User completes onboarding → creates `users` record
   - UUID stored in localStorage for subsequent visits

2. **Game Session:**
   - User plays game → grading happens via API
   - API saves to `game_sessions` table
   - Also saved to localStorage for offline access

3. **History Page:**
   - Fetches from database (primary source)
   - Falls back to localStorage if DB unavailable
   - Shows paginated results with filtering options

4. **Analytics (Future):**
   - Aggregate queries for global stats
   - Track which positions/prompts are hardest
   - Monitor detection rates over time

## Favicon prompt
```
A minimalist icon design for a favicon (512x512px). The icon should represent an "Ideological Turing Test" game. Design ideas: two overlapping speech bubbles or thought bubbles in contrasting colors (orange and gray), or a chameleon silhouette, or a simple mask icon, or two mirrored profile silhouettes facing each other. Flat design, modern, playful but not childish. High contrast for small sizes. Simple geometric shapes. Orange (#f97316) as the primary color with gray/black accents. Clean, minimal, recognizable at 16x16 pixels.
```