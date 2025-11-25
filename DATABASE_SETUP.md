# Database Setup Guide

This guide explains how to set up the Vercel Postgres database for the OneOfUs game.

## Overview

The application uses Vercel Postgres to store:
- User profiles and aggregate statistics
- Game session data (prompts, responses, grading results)
- Analytics data for prompts and positions

The database is optional - the app will fall back to localStorage if the database is unavailable.

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

```bash
curl -X POST http://localhost:3000/api/init-db
```

Or in production:
```bash
curl -X POST https://your-domain.vercel.app/api/init-db
```

This will create the following tables:
- `users` - User profiles and stats
- `game_sessions` - Individual game attempts
- `prompts_analytics` - Aggregate prompt difficulty data

**Security Note:** In production, you should protect this endpoint or use a proper migration tool.

### 4. Verify Setup

You can verify the database connection by checking the console logs when:
- A user completes onboarding (should see "User created in database with ID: ...")
- A user submits a game response (should see "Game session saved to database for user: ...")

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
1. User plays game and submits response
2. Frontend calls `POST /api/grade` with userId, prompt data, and response
3. Claude API grades the response
4. Game session saved to database with full results
5. Session also saved to localStorage for offline access
6. User stats automatically updated (total_games, avg_score)

### History Page
1. Frontend fetches user history from localStorage
2. (Future) Will fetch from database with pagination
3. Falls back to localStorage if database unavailable

## API Endpoints

### User Management
- `POST /api/user` - Create new user
- `GET /api/user?userId=xxx` - Get user info and stats
- `PUT /api/user` - Update user information

### Database Initialization
- `POST /api/init-db` - Initialize database schema

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

## Privacy Considerations

The database stores:
- User political alignment (1-5 scale)
- Game responses and scores
- IP addresses (hashed recommended for production)
- User agents

**Before deploying to production:**
1. Add privacy policy to landing page
2. Consider hashing IP addresses before storage
3. Implement data retention policy (auto-delete old sessions)
4. Add GDPR compliance features (data export/deletion)

See README.md Phase 6 for full privacy implementation plan.

## Next Steps

After setting up the database, you can:
1. ✅ Test user registration flow
2. ✅ Test game session storage
3. ⏭️ Update history page to fetch from database
4. ⏭️ Add pagination for user history
5. ⏭️ Create analytics queries for aggregate data
6. ⏭️ Implement privacy features (Phase 6)

## Local Development Without Database

If you want to develop locally without setting up a database:
1. Don't set the `POSTGRES_URL` environment variable
2. The app will automatically fall back to localStorage
3. All features will work, but data won't persist across devices
4. You can add database support later without breaking changes
