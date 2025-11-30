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
- **Deployment**: Vercel

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
- `POSTGRES_URL` - Database connection (or skip for localStorage-only mode)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` - For rate limiting

### Initialize Database (Optional)

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

---

## Current Status: MVP Complete ✅

**Implemented:**
- ✅ Full game loop with 38 UK-focused scenarios
- ✅ Claude AI grading with 3-part rubric (Understanding, Authenticity, Execution)
- ✅ User history and statistics
- ✅ Rate limiting (20/hour, 50/day per IP)
- ✅ Prompt injection protection
- ✅ Database persistence with localStorage fallback
- ✅ Privacy policy page

---

## Future Enhancements

### Gameplay Ideas

**1v1 mode**
- Receive the same prompts as friends playing simultaneously, and see who performs the best
- Also add ability to share results with others

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

### Grading Improvements

- [ ] Switch between different LLM graders
- [ ] A/B test grading prompts
- [ ] Track which positions/prompts are hardest
- [ ] Refine rubric based on user feedback

---

## Project Structure

```
app/
  page.tsx          # Landing page
  game/page.tsx     # Game interface
  results/page.tsx  # Results display
  history/page.tsx  # User history
  privacy/page.tsx  # Privacy policy
  api/              # API routes
components/         # React components
lib/                # Utilities, types, database
data/               # Scenarios, grading prompt
scripts/            # Dev tools and tests
```

---

## Privacy

See `/privacy` for the full policy. Key points:
- We collect game responses, scores, IP addresses, and timing data
- Data is used for research and game improvement
- No account required (pseudonymous by UUID)

