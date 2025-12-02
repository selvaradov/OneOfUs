-- OneOfUs Database Schema
-- Phase 1: Initial setup with users, game_sessions, and prompts_analytics tables

-- Users table: Store user profiles and aggregate stats
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  political_alignment INTEGER, -- 1-5 scale from onboarding
  age_range TEXT,
  country TEXT,
  total_games INTEGER DEFAULT 0,
  avg_score DECIMAL(5,2)
);

-- Game sessions table: Store individual game attempts with full grading results
CREATE TABLE IF NOT EXISTS game_sessions (
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
  duration_seconds INTEGER
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_sessions ON game_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_performance ON game_sessions(prompt_id, score);
CREATE INDEX IF NOT EXISTS idx_position_performance ON game_sessions(position_assigned, detected);

-- Prompts analytics table: Track aggregate prompt difficulty metrics
CREATE TABLE IF NOT EXISTS prompts_analytics (
  prompt_id TEXT PRIMARY KEY,
  total_attempts INTEGER DEFAULT 0,
  avg_score DECIMAL(5,2),
  avg_understanding DECIMAL(5,2),
  avg_authenticity DECIMAL(5,2),
  avg_execution DECIMAL(5,2),
  detection_rate DECIMAL(5,2), -- % detected
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 1v1 MATCHES TABLES
-- =====================================================

-- Matches table: Store match-level info (prompt, status, expiry)
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_code VARCHAR(8) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending' | 'completed' | 'expired'
  
  -- Prompt reference only (scenario/category looked up via prompt_id)
  -- Position is per-participant, stored in game_sessions (supports future mirror mode)
  prompt_id TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_matches_code ON matches(match_code);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status, expires_at);

-- Match participants junction table: Store per-player info (session, role, timing)
-- Future-proofed: adding more opponents = more rows in match_participants
CREATE TABLE IF NOT EXISTS match_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
  role VARCHAR(20) NOT NULL,  -- 'creator' | 'opponent'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(match_id, user_id)  -- Each user can only join a match once
);

CREATE INDEX IF NOT EXISTS idx_match_participants_match ON match_participants(match_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_user ON match_participants(user_id, joined_at DESC);

-- Add match_id to game_sessions for linking sessions to matches
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES matches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_match ON game_sessions(match_id);
