# One of Us

**The Ideological Turing Test Game**

Can you convincingly argue for a political position that isn't your own? Write responses to political scenarios, and see if an AI can detect whether you're genuine or playing a role.

This isn't about trolling or caricature—it's about truly understanding the strongest version of views different from your own.

## How It Works

1. **Quick onboarding** - Answer 3 questions about your political alignment
2. **Get a scenario** - Receive a random UK politics scenario (tweet, Reddit comment, WhatsApp message, etc.)
3. **Write as someone else** - You're assigned a political position to argue from
4. **Get graded** - Claude AI evaluates how convincingly you embodied that perspective
5. **Learn** - See detailed feedback and an AI-generated comparison response

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend**: Vercel Postgres (Neon), Upstash Redis (rate limiting)
- **AI**: Anthropic Claude API (Haiku 4.5 for grading)
- **Analytics**: Vercel Analytics
- **Deployment**: Vercel

_Code primarily written by [Claude](https://claude.ai/code)._

## Quick Start

```bash
# Clone and install
git clone https://github.com/selvaradov/OneOfUs.git
cd OneOfUs
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

See `.env.example` for the full list. Required:

- `ANTHROPIC_API_KEY` - For Claude API grading
- `POSTGRES_URL` - Database connection string (Vercel Postgres or Neon)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` - For rate limiting
- `ADMIN_DASHBOARD_PASSWORD` - Admin dashboard access (optional, for `/admin`)

> **Note:** While the application has localStorage fallback logic for graceful degradation, `POSTGRES_URL` is required at startup since `@vercel/postgres` validates the connection on initialization. For local development, you can use a free [Neon](https://neon.tech) database or connect to the Vercel-provisioned database via `vercel env pull`.

### Initialize Database

```bash
# Local (no auth required)
curl -X POST http://localhost:3000/api/init-db

# Production (requires INIT_DB_SECRET)
curl -X POST https://oneofus.vercel.app/api/init-db \
  -H "Authorization: Bearer YOUR_INIT_DB_SECRET"
```

## Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run linter

# Quality checks
./scripts/check-types.sh      # TypeScript validation
./scripts/test-database.sh    # Integration tests
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for technical details.

## Admin Dashboard

An admin dashboard is available at `/admin` for monitoring and data export.

**Features:**

- 📊 **Analytics**: Summary statistics, score distributions, position performance
- 💬 **Session Browser**: View all game sessions with filtering by position, question, date, and detection status
- 📥 **Data Export**: Export users, sessions, analytics, or full data dump as JSON
- 🔍 **Question Analysis**: Performance metrics for each prompt (min. 2 attempts)
- 👥 **Demographics**: User breakdown by political alignment, country, and age

**Setup:**

1. Set the `ADMIN_DASHBOARD_PASSWORD` environment variable
2. Navigate to `/admin` and log in with your password
3. Use multi-select filters (react-select powered) to find specific sessions
4. Export data as JSON for analysis or backup

**Rate Limits:**

- Login: 10 attempts per minute per IP
- Operations: 100 requests per minute per IP

**Technical Implementation:**

- **Client-side sorting**: Table sorting happens in-browser without re-fetching from the API, improving performance for paginated views
- **Filtering scope**: Filters (position, question, date, detection status) apply only to the session table display and pagination. Exports always include all records to ensure complete data backup
- **Pagination**: Sessions table loads 50 records per page with offset-based pagination

**Known Limitations & TODOs:**

- **Export filtering**: Currently, exports do not respect table filters and always return all records. Implementing filtered exports is complicated because:
  - Analytics are pre-aggregated in the database for performance (via SQL `AVG()`, `COUNT()`, etc.)
  - Filtering would require either (1) real-time recalculation of analytics on filtered datasets (slow, expensive), or (2) storing separate analytics per filter combination (storage-intensive, complex)
  - For now, use post-processing on exported JSON if filtered analytics are needed
- **Question Performance threshold**: Only shows questions with 2+ attempts. Early-stage data may show "No question data available yet"

---

## Current Status: MVP Complete + 1v1 Matches ✅

**Implemented:**

- ✅ Full game loop with 38 UK-focused scenarios
- ✅ Claude AI grading with 3-part rubric (Understanding, Authenticity, Execution)
- ✅ User history and statistics
- ✅ Rate limiting (20/hour, 50/day per IP)
- ✅ Prompt injection protection
- ✅ Database persistence (localStorage used for client-side caching)
- ✅ Privacy policy page
- ✅ **1v1 Match Mode** - Challenge friends to compete on the same scenario

---

## 1v1 Match Mode

Challenge a friend to see who can pass the Turing test better!

**How it works:**

1. Complete a game and click "Challenge a Friend" on your results
2. Share the unique match link with a friend
3. They play the same scenario with the same position assignment
4. Both see head-to-head results comparing scores and responses

**Features:**

- Unique 8-character match codes (e.g., `oneofus.app/match/ABC12XYZ`)
- Share via copy-to-clipboard or native share API
- Match history page at `/matches` showing wins, losses, and pending challenges
- Matches expire after 24 hours if not completed
- Works for both logged-in and new users (onboarding modal triggers for newcomers)

---

## Future Enhancements

### Gameplay Ideas

**Immersive Group Chat Mode**

- Drop the user into a conversation with NPC LLMs all roleplaying a political position
- User must blend in without getting "detected" over an extended multi-turn conversation
- Formats: Family WhatsApp group, Twitter replies, Slack channel
- Challenge: Inference costs and latency

**Scenario Formats to Explore**

- Tweet battle (3-tweet thread)
- Letters to MPs/representatives
- Pub argument responses
- Dating profile political questions
- Diary entry in response to a headline
- Agony aunt column from a political orientation

**Progression System**

- Difficulty levels (easy/medium/hard scenarios)
- Unlock new positions after success
- "Level up" mechanics

### Technical Roadmap

- [ ] Add more UK prompts (target: 50-100 scenarios)
- [ ] Prompt difficulty tagging and progressive unlocking
- [ ] Recent news awareness (e.g., Reform UK, current events)
- [ ] Multiplayer mode with human judges
- [ ] Apply filters for admin dashboard JSON exports
- [ ] Potential UI refresh for a quirkier theme
- [ ] Real-time match updates (currently requires manual refresh)
- [ ] OG image generation for social sharing of match results

### Grading Improvements

- [ ] Switch between different LLM graders
- [ ] A/B test grading prompts
- [ ] Track which positions/prompts are hardest
- [ ] Refine rubric based on user feedback

---

## Project Structure

```
app/
  page.tsx           # Landing page
  game/page.tsx      # Game interface
  results/page.tsx   # Results display
  history/page.tsx   # User history
  privacy/page.tsx   # Privacy policy
  match/
    [code]/page.tsx  # Match lobby (pending/completed/expired states)
  matches/page.tsx   # User's match history
  api/               # API routes
components/
  match/             # 1v1 match components
lib/                 # Utilities, types, database
data/                # Scenarios, grading prompt
scripts/             # Dev tools and tests
```

---

## Privacy

See `/privacy` for the full policy. Key points:

- We collect game responses, scores, IP addresses, and timing data
- Data is used for research and game improvement
- No account required (pseudonymous by UUID)
