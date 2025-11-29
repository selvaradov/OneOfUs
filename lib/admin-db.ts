import { sql } from '@vercel/postgres';
import { AdminGameSession, AdminAnalytics, PoliticalPosition } from './types';

/**
 * Query options for fetching admin game sessions
 */
export interface AdminSessionsQuery {
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'score' | 'detected';
  sortOrder?: 'ASC' | 'DESC';
  filterDetected?: boolean | null;
  filterPosition?: PoliticalPosition | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

/**
 * Fetch game sessions with user data for admin dashboard
 * Includes filtering, sorting, and pagination
 */
export async function getAdminGameSessions(
  options: AdminSessionsQuery = {}
): Promise<AdminGameSession[]> {
  const {
    limit = 50,
    offset = 0,
    sortBy = 'created_at',
    sortOrder = 'DESC',
    filterDetected = null,
    filterPosition = null,
    dateFrom = null,
    dateTo = null,
  } = options;

  try {
    // Build WHERE clause conditions
    const conditions: string[] = ['1=1']; // Always true base condition
    const params: any[] = [];

    if (dateFrom) {
      params.push(dateFrom);
      conditions.push(`gs.created_at >= $${params.length}::timestamp`);
    }

    if (dateTo) {
      params.push(dateTo);
      conditions.push(`gs.created_at <= $${params.length}::timestamp`);
    }

    if (filterDetected !== null) {
      params.push(filterDetected);
      conditions.push(`gs.detected = $${params.length}::boolean`);
    }

    if (filterPosition) {
      params.push(filterPosition);
      conditions.push(`gs.position_assigned = $${params.length}::text`);
    }

    // Add limit and offset params
    params.push(limit, offset);

    const whereClause = conditions.join(' AND ');
    const orderClause = `gs.${sortBy} ${sortOrder}`;

    const query = `
      SELECT
        gs.id,
        gs.user_id,
        gs.created_at,
        gs.completed_at,
        gs.prompt_id,
        gs.prompt_scenario,
        gs.prompt_category,
        gs.position_assigned,
        gs.user_response,
        gs.char_count,
        gs.detected,
        gs.score,
        gs.feedback,
        gs.rubric_understanding,
        gs.rubric_authenticity,
        gs.rubric_execution,
        gs.ai_comparison_response,
        gs.ip_address::text as ip_address,
        gs.user_agent,
        gs.duration_seconds,
        u.political_alignment,
        u.age_range,
        u.country,
        u.total_games as user_total_games,
        u.avg_score as user_avg_score
      FROM game_sessions gs
      LEFT JOIN users u ON gs.user_id = u.id
      WHERE ${whereClause}
      ORDER BY ${orderClause}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const result = await sql.query(query, params);

    return result.rows.map((row) => ({
      ...row,
      created_at: row.created_at.toISOString(),
      completed_at: row.completed_at?.toISOString() || '',
    }));
  } catch (error) {
    console.error('Error fetching admin game sessions:', error);
    throw error;
  }
}

/**
 * Get total count of sessions for pagination
 */
export async function getTotalSessionsCount(
  options: Omit<AdminSessionsQuery, 'limit' | 'offset' | 'sortBy' | 'sortOrder'> = {}
): Promise<number> {
  const {
    filterDetected = null,
    filterPosition = null,
    dateFrom = null,
    dateTo = null,
  } = options;

  try {
    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    if (dateFrom) {
      params.push(dateFrom);
      conditions.push(`created_at >= $${params.length}::timestamp`);
    }

    if (dateTo) {
      params.push(dateTo);
      conditions.push(`created_at <= $${params.length}::timestamp`);
    }

    if (filterDetected !== null) {
      params.push(filterDetected);
      conditions.push(`detected = $${params.length}::boolean`);
    }

    if (filterPosition) {
      params.push(filterPosition);
      conditions.push(`position_assigned = $${params.length}::text`);
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT COUNT(*) as total
      FROM game_sessions
      WHERE ${whereClause}
    `;

    const result = await sql.query(query, params);
    return parseInt(result.rows[0].total);
  } catch (error) {
    console.error('Error getting total sessions count:', error);
    throw error;
  }
}

/**
 * Get comprehensive analytics for admin dashboard
 */
export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  try {
    // Get total users and games
    const totalsResult = await sql`
      SELECT
        (SELECT COUNT(DISTINCT id) FROM users) as total_users,
        (SELECT COUNT(*) FROM game_sessions) as total_games,
        (SELECT AVG(score) FROM game_sessions WHERE score IS NOT NULL) as avg_score,
        (SELECT AVG(CASE WHEN detected THEN 1.0 ELSE 0.0 END) * 100
         FROM game_sessions WHERE detected IS NOT NULL) as detection_rate
    `;

    const totals = totalsResult.rows[0];

    // Get score distribution (10-point buckets)
    const scoreDistResult = await sql`
      SELECT
        CASE
          WHEN score < 10 THEN '0-9'
          WHEN score < 20 THEN '10-19'
          WHEN score < 30 THEN '20-29'
          WHEN score < 40 THEN '30-39'
          WHEN score < 50 THEN '40-49'
          WHEN score < 60 THEN '50-59'
          WHEN score < 70 THEN '60-69'
          WHEN score < 80 THEN '70-79'
          WHEN score < 90 THEN '80-89'
          ELSE '90-100'
        END as range,
        COUNT(*) as count
      FROM game_sessions
      WHERE score IS NOT NULL
      GROUP BY range
      ORDER BY MIN(score)
    `;

    // Get position performance
    const positionPerfResult = await sql`
      SELECT
        position_assigned as position,
        COUNT(*) as total,
        AVG(score) as avg_score,
        AVG(CASE WHEN detected THEN 1.0 ELSE 0.0 END) * 100 as detection_rate
      FROM game_sessions
      WHERE score IS NOT NULL
      GROUP BY position_assigned
      ORDER BY avg_score DESC
    `;

    // Get top/bottom prompt performance (min 5 attempts for statistical significance)
    const promptPerfResult = await sql`
      SELECT
        prompt_id,
        prompt_scenario,
        COUNT(*) as attempts,
        AVG(score) as avg_score,
        AVG(CASE WHEN detected THEN 1.0 ELSE 0.0 END) * 100 as detection_rate
      FROM game_sessions
      WHERE score IS NOT NULL
      GROUP BY prompt_id, prompt_scenario
      HAVING COUNT(*) >= 5
      ORDER BY avg_score DESC
      LIMIT 20
    `;

    // Get demographic breakdowns
    const alignmentResult = await sql`
      SELECT
        u.political_alignment as alignment,
        COUNT(DISTINCT u.id) as count,
        AVG(gs.score) as avg_score
      FROM users u
      LEFT JOIN game_sessions gs ON u.id = gs.user_id
      WHERE u.political_alignment IS NOT NULL
      GROUP BY u.political_alignment
      ORDER BY u.political_alignment
    `;

    const countryResult = await sql`
      SELECT
        country,
        COUNT(*) as count
      FROM users
      WHERE country IS NOT NULL
      GROUP BY country
      ORDER BY count DESC
      LIMIT 20
    `;

    const ageResult = await sql`
      SELECT
        age_range,
        COUNT(*) as count
      FROM users
      WHERE age_range IS NOT NULL AND age_range != ''
      GROUP BY age_range
      ORDER BY
        CASE age_range
          WHEN '18-24' THEN 1
          WHEN '25-34' THEN 2
          WHEN '35-44' THEN 3
          WHEN '45-54' THEN 4
          WHEN '55+' THEN 5
          ELSE 6
        END
    `;

    return {
      totalUsers: parseInt(totals.total_users) || 0,
      totalGames: parseInt(totals.total_games) || 0,
      avgScore: parseFloat(totals.avg_score) || 0,
      detectionRate: parseFloat(totals.detection_rate) || 0,
      scoreDistribution: scoreDistResult.rows.map((row) => ({
        range: row.range,
        count: parseInt(row.count),
      })),
      positionPerformance: positionPerfResult.rows.map((row) => ({
        position: row.position,
        total: parseInt(row.total),
        avgScore: parseFloat(row.avg_score) || 0,
        detectionRate: parseFloat(row.detection_rate) || 0,
      })),
      promptPerformance: promptPerfResult.rows.map((row) => ({
        promptId: row.prompt_id,
        promptScenario: row.prompt_scenario,
        attempts: parseInt(row.attempts),
        avgScore: parseFloat(row.avg_score) || 0,
        detectionRate: parseFloat(row.detection_rate) || 0,
      })),
      demographicBreakdown: {
        byAlignment: alignmentResult.rows.map((row) => ({
          alignment: row.alignment,
          count: parseInt(row.count),
          avgScore: parseFloat(row.avg_score) || 0,
        })),
        byCountry: countryResult.rows.map((row) => ({
          country: row.country,
          count: parseInt(row.count),
        })),
        byAge: ageResult.rows.map((row) => ({
          ageRange: row.age_range,
          count: parseInt(row.count),
        })),
      },
    };
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    throw error;
  }
}

/**
 * Get all users for export
 */
export async function getAllUsers(): Promise<any[]> {
  try {
    const result = await sql`
      SELECT
        id,
        created_at,
        political_alignment,
        age_range,
        country,
        total_games,
        avg_score
      FROM users
      ORDER BY created_at DESC
    `;

    return result.rows.map((row) => ({
      ...row,
      created_at: row.created_at.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
}

/**
 * Get all sessions for export (without pagination)
 * WARNING: This can be a large dataset - use with caution
 */
export async function getAllSessions(dateFrom?: string, dateTo?: string): Promise<any[]> {
  try {
    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    if (dateFrom) {
      params.push(dateFrom);
      conditions.push(`gs.created_at >= $${params.length}::timestamp`);
    }

    if (dateTo) {
      params.push(dateTo);
      conditions.push(`gs.created_at <= $${params.length}::timestamp`);
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT
        gs.*,
        gs.ip_address::text as ip_address,
        u.political_alignment,
        u.age_range,
        u.country
      FROM game_sessions gs
      LEFT JOIN users u ON gs.user_id = u.id
      WHERE ${whereClause}
      ORDER BY gs.created_at DESC
    `;

    const result = await sql.query(query, params);

    return result.rows.map((row) => ({
      ...row,
      created_at: row.created_at.toISOString(),
      completed_at: row.completed_at?.toISOString() || null,
    }));
  } catch (error) {
    console.error('Error fetching all sessions:', error);
    throw error;
  }
}
