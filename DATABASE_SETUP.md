# Database Setup Guide

**Status: ✅ COMPLETE** - Database infrastructure fully implemented and tested.

This guide explains the Vercel Postgres database setup for OneOfUs. For detailed implementation status, see the [Backend Database Infrastructure Plan](README.md#backend-database-infrastructure-plan) in README.md.

## Overview

The application uses Vercel Postgres (Neon) to store:
- **User profiles** and aggregate statistics (total_games, avg_score)
- **Game sessions** with full grading results, rubrics, timing data
- **Prompt analytics** (auto-populated aggregate stats per prompt)

**Key Features:**
- ✅ Graceful fallback to localStorage if database unavailable
- ✅ Automatic analytics updates after each game session
- ✅ User timing tracking (duration_seconds per session)
- ✅ IP address and user agent capture for research
- ✅ Comprehensive test suite (8 automated tests)

**API Endpoints:** User management, game history, analytics, database initialization - see [API Endpoints](#api-endpoints) section below.

## Setup Steps

### 1. Create Vercel Postgres Database

If deploying to Vercel:
1. Go to your Vercel project dashboard
2. Navigate to the "Storage" tab
3. Click "Create Database" and select "Postgres"
4. Vercel will automatically populate your environment variables

If running locally:
1. You can either:
   - Connect to a Vercel Postgres database (recommended)
   - Use a local Postgres instance
   - Skip this step and use localStorage only

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` (for local development):

```bash
cp .env.example .env.local
```

Fill in the Postgres connection details:

```env
POSTGRES_URL=postgres://username:password@host:5432/database
POSTGRES_PRISMA_URL=postgres://username:password@host:5432/database?pgbouncer=true
POSTGRES_URL_NON_POOLING=postgres://username:password@host:5432/database
POSTGRES_USER=username
POSTGRES_HOST=host
POSTGRES_PASSWORD=password
POSTGRES_DATABASE=database
```

**Note:** If you're using Vercel's database, these will be auto-populated in production.

### 3. Initialize Database Schema

Once you have the database connection configured, initialize the tables by calling the init-db endpoint:

**Local Development:**
```bash
curl -X POST http://localhost:3000/api/init-db
```

**Production (SECURED):**
The `/api/init-db` endpoint is protected by an `INIT_DB_SECRET` environment variable.

1. Generate a secret:
   ```bash
   openssl rand -base64 32
   ```

2. Add `INIT_DB_SECRET` to your Vercel environment variables

3. Call the endpoint with authorization:
   ```bash
   curl -X POST https://your-domain.vercel.app/api/init-db \
     -H "Authorization: Bearer YOUR_SECRET_HERE"
   ```

This will create the following tables with indexes:
- `users` - User profiles and aggregate stats
- `game_sessions` - Individual game attempts with full grading data
- `prompts_analytics` - Auto-populated aggregate prompt stats

**Indexes created:**
- `idx_user_sessions` - Fast user history queries
- `idx_prompt_performance` - Fast prompt analytics
- `idx_position_performance` - Fast position-based analytics

### 4. Verify Setup

**Automated Tests (Recommended):**
```bash
# Make sure dev server is running
npm run dev

# Run full test suite (8 tests)
./scripts/test-database.sh
```

**Manual Verification:**
Check browser console logs when:
- User completes onboarding → "User created in database with ID: ..."
- User submits game response → "Game session saved to database for user: ..."
- History page loads → Should NOT show "Showing local data" indicator

**Neon Dashboard Verification:**
- Go to https://console.neon.tech/
- SQL Editor: `SELECT COUNT(*) FROM game_sessions;`
- Check prompts_analytics table is populating: `SELECT * FROM prompts_analytics;`

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  political_alignment INTEGER, -- 1-5 scale (1=left, 5=right)
  age_range TEXT,
  country TEXT DEFAULT 'UK',
  total_games INTEGER DEFAULT 0,
  avg_score DECIMAL(5,2)
);
```

### Game Sessions Table
```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Prompt data
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
  duration_seconds INTEGER
);
```

### Prompts Analytics Table
```sql
CREATE TABLE prompts_analytics (
  prompt_id TEXT PRIMARY KEY,
  total_attempts INTEGER DEFAULT 0,
  avg_score DECIMAL(5,2),
  detection_rate DECIMAL(5,2),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Data Flow

### User Registration (Onboarding)
1. User completes onboarding modal
2. Frontend calls `POST /api/user` with alignment, age, country
3. User record created in database
4. UUID returned and stored in localStorage
5. User data also saved to localStorage as fallback

### Game Session
1. User plays game (timer starts when prompt loads)
2. User submits response (duration calculated)
3. Frontend calls `POST /api/grade` with userId, prompt data, response, and durationSeconds
4. Claude API grades the response
5. Game session saved to database with:
   - Full grading results and rubric breakdown
   - User timing data (duration_seconds)
   - IP address and user agent for research
6. User stats automatically updated (total_games, avg_score)
7. Prompt analytics automatically updated (prompts_analytics table)
8. Session also saved to localStorage for offline access

### History Page
1. Frontend attempts to fetch user history from database (paginated)
2. If successful, displays database data with no "local data" indicator
3. Falls back to localStorage if database unavailable
4. Supports pagination (default 50 sessions per page)

## API Endpoints

### User Management
- `POST /api/user` - Create new user
- `GET /api/user?userId=xxx` - Get user info and stats
- `PUT /api/user` - Update user information

### Game History & Analytics
- `GET /api/history?userId=xxx&limit=20&offset=0` - Fetch user's game history with pagination
- `GET /api/stats?userId=xxx` - Get user statistics (total games, avg score, detection rate, per-position breakdown)
- `GET /api/stats?type=prompts` - Get global prompt analytics (publicly accessible - see security note below)

**Security Note:** The stats API does not require additional authentication beyond knowing a valid userId. The global prompts endpoint is public. This is intentional for MVP to enable research and transparency. See README.md Production Deployment Checklist for post-launch monitoring recommendations.

### Database Initialization
- `POST /api/init-db` - Initialize database schema (protected in production)

### Grading (with database integration)
- `POST /api/grade` - Grade user response and save to database

## Troubleshooting

### Database connection fails
- Check that your `POSTGRES_URL` environment variable is set correctly
- Verify your database is running and accessible
- Check Vercel logs for connection errors
- The app will fall back to localStorage automatically

### Tables not created
- Make sure you called `POST /api/init-db` after setting up the database
- Check for SQL errors in the console/logs
- Verify your database user has CREATE TABLE permissions

### Sessions not saving to database
- Check console logs for error messages
- Verify userId is being passed from frontend
- Ensure database connection is working (check logs)
- Sessions will still save to localStorage as fallback

## Privacy & Data Collection

**✅ Privacy Policy Implemented:** Comprehensive, honest policy at `/privacy` with footer links on all pages.

The database stores:
- User political alignment (1-5 scale), age range, country
- All game responses and full grading results
- **IP addresses (NOT hashed)** - collected for research purposes
- User agents and session timing data
- Indefinite data retention

**Disclosures Made:**
- ✅ Honest privacy policy page (`/privacy`)
- ✅ Clear about collecting raw IPs (not hashed)
- ✅ Transparent about indefinite retention
- ✅ No promises of deletion features (not yet implemented)
- ✅ User consent via "by playing, you consent" language

**Future Enhancements (Post-Launch):**
- Data retention policy (6-month auto-delete)
- User data export/deletion features
- GDPR full compliance
- IP hashing (if privacy concerns arise)

See [README.md Production Deployment Checklist](README.md#production-deployment-checklist) for details.

## Implementation Status - ALL COMPLETE ✅

**✅ Completed Features:**
1. ✅ User registration flow with database + localStorage
2. ✅ Game session storage with full grading data
3. ✅ History page with database-first, localStorage fallback
4. ✅ Pagination implemented (default 50 sessions)
5. ✅ Analytics endpoints (`/api/stats`) with live and cached queries
6. ✅ Prompt analytics auto-population (prompts_analytics table)
7. ✅ User timing analytics (duration_seconds per session)
8. ✅ Privacy policy page with honest disclosures
9. ✅ Comprehensive test suite (8 automated tests)
10. ✅ Quality assurance scripts (type checking, git hooks)

**🚀 Ready for Production Deployment**

See [README.md Production Deployment Checklist](README.md#production-deployment-checklist) for step-by-step deployment guide.

## Local Development Without Database

If you want to develop locally without setting up a database:
1. Don't set the `POSTGRES_URL` environment variable
2. The app will automatically fall back to localStorage
3. All features will work, but data won't persist across devices
4. You can add database support later without breaking changes
