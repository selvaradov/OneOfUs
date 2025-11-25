# Ideological Turing Test game ("OneOfUs")

## Development Workflow & Environments

**Quick Reference:**

| Environment | URL | Database | Use For | How to Deploy |
|-------------|-----|----------|---------|---------------|
| **Development** | `localhost:3000` | Local Neon DB | Daily coding, debugging | `npm run dev` |
| **Preview** | `git-branch-xxx.vercel.app` | Production DB | Testing features, PRs | Auto-deploy on git push |
| **Production** | `oneofus.vercel.app` | Production Neon DB | Live site | `vercel --prod` or merge to main |

### Local Development Setup

1. **Database:** Separate local Neon database (rename to `oneofus-local` in Neon dashboard for clarity)
2. **Environment variables:** Stored in `.env.local` (gitignored)
3. **Initialize local database:** `curl -X POST http://localhost:3000/api/init-db` (no auth required)
4. **Run dev server:** `npm run dev`

### Production Deployment

1. **Database:** Separate production Neon database (auto-created by Vercel, rename to `oneofus-prod` for clarity)
2. **Environment variables:** Stored in Vercel dashboard → Settings → Environment Variables
3. **Initialize production database:** Requires `INIT_DB_SECRET` for security:
   ```bash
   curl -X POST https://oneofus.vercel.app/api/init-db \
     -H "Authorization: Bearer YOUR_INIT_DB_SECRET"
   ```
4. **Deploy:** Push to main branch or run `vercel --prod`

### Preview Deployments

- **Auto-created** for every branch push and Pull Request
- Get unique URLs like `https://one-of-us-git-feature-xyz.vercel.app`
- Use production database (safe - just read operations typically)
- Perfect for testing before merging to main

### Typical Development Workflow

```bash
# 1. Create feature branch
git checkout -b add-new-feature

# 2. Develop locally
npm run dev                      # Uses local database
# Make changes, test at localhost:3000

# 3. Run quality checks
./scripts/check-types.sh         # TypeScript validation
./scripts/test-database.sh       # Database integration tests

# 4. Commit and push
git add .
git commit -m "Add new feature"
git push origin add-new-feature  # Vercel auto-creates preview

# 5. Test preview deployment
# Visit https://one-of-us-git-add-new-feature.vercel.app
# Run: BASE_URL=https://preview-url.vercel.app ./scripts/test-database.sh

# 6. Merge to main (deploys to production)
git checkout main
git merge add-new-feature
git push origin main             # Auto-deploys to production
```

### Environment Variables by Environment

**Local (`.env.local` file):**
- `ANTHROPIC_API_KEY` - Your API key
- `POSTGRES_URL` and related - Points to local Neon database
- `INIT_DB_SECRET` - Optional (not checked in development mode)

**Vercel (dashboard → Environment Variables):**
- `ANTHROPIC_API_KEY` - Same API key (All environments)
- `INIT_DB_SECRET` - Generated secret (Production, Preview)
- `POSTGRES_*` - Auto-populated by Vercel (All environments)

See [Production Deployment Checklist](#production-deployment-checklist) below for detailed deployment steps.

---

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

### Backend Database Infrastructure - COMPLETE ✓

**✅ All Phases Completed:**
- ✅ **Phase 1-5**: Database setup, user management, session persistence, history/analytics, graceful fallback
- ✅ **Analytics Features**: Prompt analytics table auto-populates, user timing tracked (duration_seconds)
- ✅ **Privacy Policy**: Honest, transparent policy at /privacy with footer links across all pages
- ✅ **Quality Assurance**: TypeScript type checking scripts and pre-commit hooks
- ✅ **Testing Suite**: Automated database integration tests with 8 test cases

**See:** [Backend Database Infrastructure Plan](#backend-database-infrastructure-plan) below for full details.

---

### Remaining Tasks Before Production Deployment

**Critical (Must Do Before Deploy):**
- [ ] Set `INIT_DB_SECRET` in Vercel environment variables
- [ ] Initialize production database with secure endpoint call
- [ ] Verify all Postgres environment variables populated in Vercel
- [ ] Run `./scripts/test-database.sh` against preview deployment

**Recommended (Should Do Soon):**
- [x] Enable Vercel monitoring/logs for production
- [x] Verify Neon automatic backups enabled
- [x] Test full user flow on preview deployment
- [ ] Add rate limiting to `/api/grade` endpoint (recommended)
- [ ] Migrate production database schema (add avg_understanding, avg_authenticity, avg_execution columns)

**Future Enhancements:**
- [ ] **UI theme refresh**: More unique, quirky, internet-era feeling (not B2B SaaS)
- [ ] **Add more UK prompts**: Expand from 10 to 20-30 scenarios
- [ ] **Prompt difficulty system**: Tag scenarios by difficulty level
- [ ] **Recent news access**: Model awareness of current UK politics (e.g., Reform UK)
- [ ] **Progressive difficulty**: Unlock harder prompts after success
- [ ] **Data retention policy**: Auto-delete old sessions after 6 months
- [ ] **GDPR features**: User data export/deletion on request

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

**Phase 1: Database Setup & Schema - COMPLETE ✓**
- ✅ Create Vercel Postgres database (Neon) in project
- ✅ Run schema migrations to create tables
- ✅ Set up connection pooling via `@vercel/postgres`
- ✅ Create database utility functions in `/lib/db.ts`
- ✅ Add database URL to environment variables

**Phase 2: User Management - COMPLETE ✓**
- ✅ Create `/app/api/user/route.ts` for user operations
- ✅ Modify onboarding to create user record on first visit
- ✅ Generate UUID for user, store in localStorage + database
- ✅ Update user stats after each game (total_games, avg_score)
- ⏸️ Migrate existing localStorage alignment data (manual migration not needed)

**Phase 3: Game Session Persistence - COMPLETE ✓**
- ✅ Modify `/app/api/grade/route.ts` to save sessions to database
- ✅ Capture IP address and user agent from request headers
- ✅ Store full grading result including rubric breakdown
- ✅ Keep localStorage as fallback for offline/client-side access
- ✅ Track session duration (client-side timer implemented)

**Phase 4: History & Analytics Queries - COMPLETE ✓**
- ✅ Update history page to fetch from database instead of localStorage
- ✅ Add pagination for user history (limit 50 per request)
- ✅ Create `/app/api/history/route.ts` endpoint
- ✅ Create `/app/api/stats` endpoint for aggregate data
- ✅ Populate `prompts_analytics` table (auto-updates after each game session)
- ✅ User timing analytics (duration_seconds tracked per session)

**Phase 5: Migration & Fallback - COMPLETE ✓**
- ✅ Add error handling: if DB unavailable, fall back to localStorage
- ✅ Graceful degradation for DB connection failures (all API routes check connection)
- ⏸️ Migration script for existing localStorage sessions (not needed - fresh start)

**Phase 6: Privacy & Compliance - PARTIALLY COMPLETE ✓**
- ✅ Add privacy policy page (/privacy) with honest, transparent disclosures
- ✅ Footer component with privacy link on all pages
- ✅ Disclosed: Collecting raw IPs (not hashed), indefinite retention, no deletion features yet
- ⏸️ Implement data retention policy (future enhancement)
- ⏸️ Allow users to export/delete their data (future enhancement)
- ⏸️ Hash IP addresses for privacy (decided against for MVP - research value)
- ⏸️ GDPR full compliance features (future enhancement)

### Production Deployment Checklist

**✅ Completed (Ready for Production):**
- ✅ Database infrastructure fully implemented (Phases 1-6)
- ✅ Prompt analytics auto-populating, user timing tracked
- ✅ Privacy policy page with honest disclosures
- ✅ Quality assurance scripts (type checking, database tests)
- ✅ Secure `/api/init-db` endpoint with INIT_DB_SECRET
- ✅ Graceful fallback to localStorage if database unavailable
- ✅ Footer with privacy/GitHub links on all pages

**⚠️ Critical Steps Before Deploying:**

1. **Generate and set INIT_DB_SECRET in Vercel:**
   ```bash
   openssl rand -base64 32
   ```
   Add to Vercel environment variables

2. **Deploy to Vercel and get preview URL**

3. **Initialize production database:**
   ```bash
   curl -X POST https://your-domain.vercel.app/api/init-db \
     -H "Authorization: Bearer YOUR_INIT_DB_SECRET"
   ```

4. **Run tests against preview deployment:**
   ```bash
   BASE_URL=https://your-preview.vercel.app ./scripts/test-database.sh
   ```

5. **Manual testing:**
   - Complete onboarding flow
   - Play 2-3 games
   - Check history page loads from database
   - Verify browser console shows "saved to database" messages

6. **Verify in Neon dashboard:**
   - Check tables exist (users, game_sessions, prompts_analytics)
   - Run query: `SELECT COUNT(*) FROM game_sessions;`
   - Verify backups are enabled

7. **Enable Vercel monitoring:**
   - Go to Vercel project → Analytics
   - Enable error tracking and logs

**✅ Production Launch Checklist:**
- [ ] INIT_DB_SECRET set in Vercel ✓
- [ ] Production database initialized ✓
- [ ] Preview deployment tested ✓
- [ ] Manual user flow tested ✓
- [ ] Database verified in Neon ✓
- [ ] Monitoring enabled ✓
- [ ] Promote preview to production

**🔮 Post-Launch (Future Enhancements):**
- [ ] Monitor for gaming/abuse of stats API
- [ ] Add rate limiting to `/api/grade` (see Rate Limiting Plan below)
- [ ] Implement data retention policy (6-month auto-delete)
- [ ] Add GDPR data export/deletion features
- [ ] Consider IP hashing if privacy concerns arise

---

## Rate Limiting Implementation Plan

### Why Rate Limiting?

**Primary Concerns:**
1. **Cost control**: Claude API calls cost money (~$3 per 1M input tokens, ~$15 per 1M output tokens)
2. **Abuse prevention**: Bad actors automating requests to spam the service
3. **Fair usage**: Prevent individual users from monopolizing resources
4. **DoS protection**: Mitigate denial-of-service attacks

**Current Risk Assessment:**
- Each game costs ~$0.02-0.05 in API fees (estimate: 2-5K tokens total)
- Without rate limiting, a single user could play 100 games → $2-5 in costs
- Automated abuse could quickly drain budget

### Rate Limiting Strategy

**Recommended Limits:**

| Endpoint | Limit | Window | Reasoning |
|----------|-------|--------|-----------|
| `/api/grade` | 10 requests | 1 hour | Primary cost endpoint; prevents rapid-fire abuse |
| `/api/history` | 60 requests | 1 minute | Cheap query, but prevent scraping |
| `/api/session` | 60 requests | 1 minute | Cheap query, but prevent scraping |
| `/api/user` (POST) | 5 requests | 1 hour | Onboarding endpoint, rarely called |
| `/api/stats` | 30 requests | 1 minute | Future analytics endpoint |

**Identifier Strategy:**
- **Primary**: IP address (available in Vercel via request headers)
- **Secondary**: User ID from request body (if authenticated)
- **Fallback**: If both unavailable, apply global rate limit

### Implementation Options

#### Option 1: Vercel Edge Config + Upstash Redis (Recommended)

**Pros:**
- Industry standard for serverless rate limiting
- Persistent storage across invocations
- Low latency (~5-10ms)
- Free tier: 10K requests/day

**Setup:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Example Implementation:**
```typescript
// /lib/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create rate limiters for different endpoints
export const gradeLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
  prefix: 'ratelimit:grade',
});

export const historyLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
  prefix: 'ratelimit:history',
});

// Utility to get client IP from Vercel headers
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIP || 'unknown';
}
```

**Usage in API route:**
```typescript
// /app/api/grade/route.ts
import { gradeLimiter, getClientIP } from '@/lib/ratelimit';

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const { success, limit, remaining, reset } = await gradeLimiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((reset - Date.now()) / 1000), // seconds
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
        },
      }
    );
  }

  // Continue with normal grading logic...
}
```

**Environment Variables Needed:**
```bash
UPSTASH_REDIS_REST_URL=your-url-here
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

---

#### Option 2: Vercel KV (Native Alternative)

**Pros:**
- Native Vercel integration (no third party)
- Similar API to Upstash
- Included in Vercel Pro plan

**Cons:**
- Not available on Hobby tier (requires Pro: $20/month)
- No free tier for this specific feature

**Setup:**
```bash
npm install @vercel/kv
```

**Implementation:** Almost identical to Option 1, just swap `@upstash/redis` with `@vercel/kv`

---

#### Option 3: In-Memory Rate Limiting (Simple, No External Deps)

**Pros:**
- No external services needed
- Zero cost
- Simple implementation

**Cons:**
- Resets on cold starts (serverless limitations)
- Not shared across regions/instances
- Less effective against distributed attacks

**Implementation:**
```typescript
// /lib/ratelimit-simple.ts
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) rateLimitStore.delete(key);
    }
  }

  if (!record || record.resetTime < now) {
    // New window
    const resetTime = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}
```

**Limitations:** This approach has significant limitations in a serverless environment and is only suitable for very basic protection during initial launch.

---

### Recommended Approach

**For MVP/Launch:**
- **Option 1 (Upstash Redis)** - Best balance of reliability, cost, and ease
- Set up during deployment with Vercel integration
- Free tier sufficient for early usage

**Implementation Steps:**

1. **Create Upstash account** and Redis database (free tier)
2. **Add environment variables** to Vercel:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. **Install dependencies**: `npm install @upstash/ratelimit @upstash/redis`
4. **Create `/lib/ratelimit.ts`** with rate limiter configurations
5. **Update API routes** to check rate limits before processing
6. **Add user-facing error handling** in frontend for 429 responses
7. **Monitor** Upstash dashboard for rate limit hits

**User Experience:**
- When rate limited, show friendly message: "You're playing too fast! Take a break and try again in [X minutes]."
- Display rate limit headers in developer console for transparency
- Consider showing remaining requests on game page (optional)

**Monitoring:**
- Track rate limit hits in Vercel logs
- Monitor Upstash analytics dashboard
- Alert if abuse patterns detected (many 429s from same IP)

---

### Testing Rate Limits

**Local Testing:**
```bash
# Test grade endpoint rate limit (10 requests/hour)
for i in {1..12}; do
  curl -X POST http://localhost:3000/api/grade \
    -H "Content-Type: application/json" \
    -d '{"promptId":"test","scenario":"test","position":"left","userResponse":"test","userId":"test"}'
  echo "\nRequest $i"
  sleep 1
done
# Should see 429 error after 10 requests
```

**Production Testing:**
- Use `./scripts/test-database.sh` (add rate limit test case)
- Monitor Upstash dashboard during testing
- Test from different IPs to verify isolation

---

### Future Enhancements

**Adaptive Rate Limiting:**
- Increase limits for users with good history
- Decrease limits for users who previously hit limits
- Whitelist trusted IPs (e.g., your own for testing)

**Advanced Abuse Detection:**
- Track patterns: same response text, very short/long responses
- Flag suspicious behavior for manual review
- Implement CAPTCHA after multiple 429s

**Cost Monitoring:**
- Track daily/weekly API spend in separate database table
- Alert when approaching budget thresholds
- Implement emergency rate limit reduction if costs spike

### Database Utility Functions

**`/lib/db.ts`** - Core database operations:

**User Management:**
- `createUser(alignment, ageRange, country)` → returns user UUID
- `getUser(userId)` → fetch user record
- `updateUser(userId, alignment?, ageRange?, country?)` → update user info
- `updateUserStats(userId)` → recalculate avg_score, total_games

**Game Sessions:**
- `saveGameSession(sessionData)` → saves game to DB (auto-updates user stats + prompt analytics)
- `getUserHistory(userId, limit, offset)` → paginated history
- `getUserStats(userId)` → aggregate user performance with position breakdown

**Analytics (Auto-Populated):**
- `updatePromptAnalytics(promptId)` → update aggregate stats for a prompt (called automatically)
- `refreshAllPromptAnalytics()` → batch update all prompt stats
- `getPromptAnalytics(promptId)` → query live from game_sessions (real-time)
- `getAllPromptsAnalytics()` → query live global prompt performance
- `getCachedPromptAnalytics(promptId)` → query from prompts_analytics table (cached)
- `getAllCachedPromptsAnalytics()` → query all cached prompt analytics

**Utilities:**
- `checkDatabaseConnection()` → verify database is accessible
- `initializeDatabase()` → create tables and indexes (via /api/init-db)

### Data Storage Architecture (Current)

**Three-layer storage system:**

1. **Database (PostgreSQL) - Primary source of truth**
   - Stores all game sessions permanently
   - Stores user profiles (political alignment, age, country)
   - Used for analytics and history

2. **sessionStorage - Navigation cache**
   - Temporary cache for instant page loads
   - Populated by history page and after game completion
   - Clears when tab closes (intentional - ensures fresh data)
   - Eliminates loading flashes when navigating

3. **localStorage - User preferences only**
   - Stores user alignment (political position, age, country)
   - Also saves to database, but localStorage provides instant access
   - No longer used for game sessions (database is single source)

### Data Flow After Implementation

1. **First Visit:**
   - User completes onboarding → creates `users` record in database
   - User alignment saved to both localStorage (instant access) and database (backup)
   - UUID stored in localStorage for subsequent visits

2. **Game Session:**
   - User plays game → grading happens via API
   - API saves to `game_sessions` table (database only)
   - Session cached in sessionStorage before navigating to results
   - Results page loads instantly from sessionStorage cache

3. **History Page:**
   - Fetches from database (single source of truth)
   - Caches results in sessionStorage for instant navigation
   - On error: shows clear message "Couldn't load your game history—try refreshing"
   - No ambiguous empty states

4. **Results Page:**
   - Loads instantly from sessionStorage cache (if navigating from history or game)
   - Falls back to database fetch for direct navigation (bookmarks, shared links)
   - Database is authoritative source

5. **Analytics (Auto-Populated):**
   - Aggregate queries for global stats
   - Track which positions/prompts are hardest
   - Monitor detection rates over time
   - Rubric score breakdowns (understanding, authenticity, execution)

## Favicon prompt
```
A minimalist icon design for a favicon (512x512px). The icon should represent an "Ideological Turing Test" game. Design ideas: two overlapping speech bubbles or thought bubbles in contrasting colors (orange and gray), or a chameleon silhouette, or a simple mask icon, or two mirrored profile silhouettes facing each other. Flat design, modern, playful but not childish. High contrast for small sizes. Simple geometric shapes. Orange (#f97316) as the primary color with gray/black accents. Clean, minimal, recognizable at 16x16 pixels.
```