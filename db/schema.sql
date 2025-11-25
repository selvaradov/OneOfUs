-- OneOfUs Database Schema
-- Phase 1: Initial setup with users, game_sessions, and prompts_analytics tables

-- Users table: Store user profiles and aggregate stats
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  political_alignment INTEGER, -- 1-5 scale from onboarding
  age_range TEXT,
  country TEXT DEFAULT 'UK',
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
  detection_rate DECIMAL(5,2), -- % detected
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
