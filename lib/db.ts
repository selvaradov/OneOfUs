import { sql } from '@vercel/postgres';
import { GameSession, GradingResult, PoliticalPosition } from './types';

// Database utility functions for OneOfUs game

/**
 * Initialize database schema
 * Should be called once to set up tables and indexes
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        political_alignment INTEGER,
        age_range TEXT,
        country TEXT DEFAULT 'UK',
        total_games INTEGER DEFAULT 0,
        avg_score DECIMAL(5,2)
      )
    `;

    // Game sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,

        prompt_id TEXT NOT NULL,
        prompt_scenario TEXT NOT NULL,
        prompt_category TEXT NOT NULL,
        position_assigned TEXT NOT NULL,
        user_response TEXT NOT NULL,
        char_count INTEGER,

        detected BOOLEAN,
        score INTEGER,
        feedback TEXT,
        rubric_understanding INTEGER,
        rubric_authenticity INTEGER,
        rubric_execution INTEGER,
        ai_comparison_response TEXT,

        ip_address INET,
        user_agent TEXT,
        duration_seconds INTEGER
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_user_sessions ON game_sessions(user_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_prompt_performance ON game_sessions(prompt_id, score)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_position_performance ON game_sessions(position_assigned, detected)`;

    // Prompts analytics table
    await sql`
      CREATE TABLE IF NOT EXISTS prompts_analytics (
        prompt_id TEXT PRIMARY KEY,
        total_attempts INTEGER DEFAULT 0,
        avg_score DECIMAL(5,2),
        detection_rate DECIMAL(5,2),
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Create a new user in the database
 * @returns The new user's UUID
 */
export async function createUser(
  politicalAlignment?: number,
  ageRange?: string,
  country: string = 'UK'
): Promise<string> {
  try {
    const result = await sql`
      INSERT INTO users (political_alignment, age_range, country)
      VALUES (${politicalAlignment ?? null}, ${ageRange ?? null}, ${country})
      RETURNING id
    `;
    return result.rows[0].id;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Get user by ID
 */
export async function getUser(userId: string) {
  try {
    const result = await sql`
      SELECT * FROM users WHERE id = ${userId}
    `;
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

/**
 * Update user information
 */
export async function updateUser(
  userId: string,
  politicalAlignment?: number,
  ageRange?: string,
  country?: string
) {
  try {
    await sql`
      UPDATE users
      SET
        political_alignment = COALESCE(${politicalAlignment ?? null}, political_alignment),
        age_range = COALESCE(${ageRange ?? null}, age_range),
        country = COALESCE(${country ?? null}, country)
      WHERE id = ${userId}
    `;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Save a game session to the database
 */
export async function saveGameSession(data: {
  userId: string;
  promptId: string;
  promptScenario: string;
  promptCategory: string;
  positionAssigned: PoliticalPosition;
  userResponse: string;
  charCount: number;
  detected?: boolean;
  score?: number;
  feedback?: string;
  rubricUnderstanding?: number;
  rubricAuthenticity?: number;
  rubricExecution?: number;
  aiComparisonResponse?: string;
  ipAddress?: string;
  userAgent?: string;
  durationSeconds?: number;
}): Promise<string> {
  try {
    const result = await sql`
      INSERT INTO game_sessions (
        user_id, prompt_id, prompt_scenario, prompt_category, position_assigned,
        user_response, char_count, completed_at, detected, score, feedback,
        rubric_understanding, rubric_authenticity, rubric_execution,
        ai_comparison_response, ip_address, user_agent, duration_seconds
      )
      VALUES (
        ${data.userId}, ${data.promptId}, ${data.promptScenario}, ${data.promptCategory},
        ${data.positionAssigned}, ${data.userResponse}, ${data.charCount}, NOW(),
        ${data.detected ?? null}, ${data.score ?? null}, ${data.feedback ?? null},
        ${data.rubricUnderstanding ?? null}, ${data.rubricAuthenticity ?? null},
        ${data.rubricExecution ?? null}, ${data.aiComparisonResponse ?? null},
        ${data.ipAddress ?? null}, ${data.userAgent ?? null}, ${data.durationSeconds ?? null}
      )
      RETURNING id
    `;

    // Update user stats after saving session
    if (data.score !== undefined) {
      await updateUserStats(data.userId);
      // Also update prompt analytics
      await updatePromptAnalytics(data.promptId);
    }

    return result.rows[0].id;
  } catch (error) {
    console.error('Error saving game session:', error);
    throw error;
  }
}

/**
 * Get user's game history with pagination
 */
export async function getUserHistory(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<any[]> {
  try {
    const result = await sql`
      SELECT * FROM game_sessions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result.rows;
  } catch (error) {
    console.error('Error fetching user history:', error);
    throw error;
  }
}

/**
 * Get aggregate user statistics
 */
export async function getUserStats(userId: string): Promise<{
  totalGames: number;
  avgScore: number;
  detectionRate: number;
  positionPerformance: Record<string, { games: number; avgScore: number; detectionRate: number }>;
}> {
  try {
    // Get basic stats
    const basicStats = await sql`
      SELECT
        COUNT(*) as total_games,
        AVG(score) as avg_score,
        AVG(CASE WHEN detected = true THEN 1.0 ELSE 0.0 END) * 100 as detection_rate
      FROM game_sessions
      WHERE user_id = ${userId} AND score IS NOT NULL
    `;

    // Get position-specific performance
    const positionStats = await sql`
      SELECT
        position_assigned,
        COUNT(*) as games,
        AVG(score) as avg_score,
        AVG(CASE WHEN detected = true THEN 1.0 ELSE 0.0 END) * 100 as detection_rate
      FROM game_sessions
      WHERE user_id = ${userId} AND score IS NOT NULL
      GROUP BY position_assigned
    `;

    const positionPerformance: Record<string, any> = {};
    positionStats.rows.forEach(row => {
      positionPerformance[row.position_assigned] = {
        games: parseInt(row.games),
        avgScore: parseFloat(row.avg_score),
        detectionRate: parseFloat(row.detection_rate),
      };
    });

    return {
      totalGames: parseInt(basicStats.rows[0].total_games) || 0,
      avgScore: parseFloat(basicStats.rows[0].avg_score) || 0,
      detectionRate: parseFloat(basicStats.rows[0].detection_rate) || 0,
      positionPerformance,
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
}

/**
 * Update user's aggregate statistics (called after each game)
 */
export async function updateUserStats(userId: string): Promise<void> {
  try {
    await sql`
      UPDATE users
      SET
        total_games = (
          SELECT COUNT(*) FROM game_sessions WHERE user_id = ${userId}
        ),
        avg_score = (
          SELECT AVG(score) FROM game_sessions WHERE user_id = ${userId} AND score IS NOT NULL
        )
      WHERE id = ${userId}
    `;
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
}

/**
 * Get analytics for a specific prompt
 */
export async function getPromptAnalytics(promptId: string): Promise<{
  promptId: string;
  totalAttempts: number;
  avgScore: number;
  detectionRate: number;
}> {
  try {
    const result = await sql`
      SELECT
        prompt_id,
        COUNT(*) as total_attempts,
        AVG(score) as avg_score,
        AVG(CASE WHEN detected = true THEN 1.0 ELSE 0.0 END) * 100 as detection_rate
      FROM game_sessions
      WHERE prompt_id = ${promptId} AND score IS NOT NULL
      GROUP BY prompt_id
    `;

    if (result.rows.length === 0) {
      return {
        promptId,
        totalAttempts: 0,
        avgScore: 0,
        detectionRate: 0,
      };
    }

    const row = result.rows[0];
    return {
      promptId: row.prompt_id,
      totalAttempts: parseInt(row.total_attempts),
      avgScore: parseFloat(row.avg_score),
      detectionRate: parseFloat(row.detection_rate),
    };
  } catch (error) {
    console.error('Error fetching prompt analytics:', error);
    throw error;
  }
}

/**
 * Get analytics for all prompts
 */
export async function getAllPromptsAnalytics(): Promise<any[]> {
  try {
    const result = await sql`
      SELECT
        prompt_id,
        COUNT(*) as total_attempts,
        AVG(score) as avg_score,
        AVG(CASE WHEN detected = true THEN 1.0 ELSE 0.0 END) * 100 as detection_rate
      FROM game_sessions
      WHERE score IS NOT NULL
      GROUP BY prompt_id
      ORDER BY total_attempts DESC
    `;

    return result.rows.map(row => ({
      promptId: row.prompt_id,
      totalAttempts: parseInt(row.total_attempts),
      avgScore: parseFloat(row.avg_score),
      detectionRate: parseFloat(row.detection_rate),
    }));
  } catch (error) {
    console.error('Error fetching all prompts analytics:', error);
    throw error;
  }
}

/**
 * Update prompts_analytics table with latest aggregate data
 * This should be called after each game session to keep analytics fresh
 */
export async function updatePromptAnalytics(promptId: string): Promise<void> {
  try {
    await sql`
      INSERT INTO prompts_analytics (
        prompt_id, total_attempts, avg_score, avg_understanding, avg_authenticity,
        avg_execution, detection_rate, last_updated
      )
      SELECT
        prompt_id,
        COUNT(*) as total_attempts,
        AVG(score) as avg_score,
        AVG(rubric_understanding) as avg_understanding,
        AVG(rubric_authenticity) as avg_authenticity,
        AVG(rubric_execution) as avg_execution,
        AVG(CASE WHEN detected = true THEN 1.0 ELSE 0.0 END) * 100 as detection_rate,
        NOW() as last_updated
      FROM game_sessions
      WHERE prompt_id = ${promptId} AND score IS NOT NULL
      GROUP BY prompt_id
      ON CONFLICT (prompt_id)
      DO UPDATE SET
        total_attempts = EXCLUDED.total_attempts,
        avg_score = EXCLUDED.avg_score,
        avg_understanding = EXCLUDED.avg_understanding,
        avg_authenticity = EXCLUDED.avg_authenticity,
        avg_execution = EXCLUDED.avg_execution,
        detection_rate = EXCLUDED.detection_rate,
        last_updated = EXCLUDED.last_updated
    `;
  } catch (error) {
    console.error('Error updating prompt analytics:', error);
    throw error;
  }
}

/**
 * Refresh all prompt analytics (useful for batch updates)
 */
export async function refreshAllPromptAnalytics(): Promise<void> {
  try {
    await sql`
      INSERT INTO prompts_analytics (
        prompt_id, total_attempts, avg_score, avg_understanding, avg_authenticity,
        avg_execution, detection_rate, last_updated
      )
      SELECT
        prompt_id,
        COUNT(*) as total_attempts,
        AVG(score) as avg_score,
        AVG(rubric_understanding) as avg_understanding,
        AVG(rubric_authenticity) as avg_authenticity,
        AVG(rubric_execution) as avg_execution,
        AVG(CASE WHEN detected = true THEN 1.0 ELSE 0.0 END) * 100 as detection_rate,
        NOW() as last_updated
      FROM game_sessions
      WHERE score IS NOT NULL
      GROUP BY prompt_id
      ON CONFLICT (prompt_id)
      DO UPDATE SET
        total_attempts = EXCLUDED.total_attempts,
        avg_score = EXCLUDED.avg_score,
        avg_understanding = EXCLUDED.avg_understanding,
        avg_authenticity = EXCLUDED.avg_authenticity,
        avg_execution = EXCLUDED.avg_execution,
        detection_rate = EXCLUDED.detection_rate,
        last_updated = EXCLUDED.last_updated
    `;
    console.log('All prompt analytics refreshed successfully');
  } catch (error) {
    console.error('Error refreshing all prompt analytics:', error);
    throw error;
  }
}

/**
 * Get analytics directly from prompts_analytics table (cached/aggregated)
 */
export async function getCachedPromptAnalytics(promptId: string) {
  try {
    const result = await sql`
      SELECT * FROM prompts_analytics WHERE prompt_id = ${promptId}
    `;
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching cached prompt analytics:', error);
    throw error;
  }
}

/**
 * Get all prompts analytics from the cached table
 */
export async function getAllCachedPromptsAnalytics(): Promise<any[]> {
  try {
    const result = await sql`
      SELECT * FROM prompts_analytics
      ORDER BY total_attempts DESC, avg_score DESC
    `;
    return result.rows;
  } catch (error) {
    console.error('Error fetching all cached prompts analytics:', error);
    throw error;
  }
}

/**
 * Check if database connection is working
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
