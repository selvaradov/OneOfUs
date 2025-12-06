import { sql } from '@vercel/postgres';
import { AdminGameSession, AdminAnalytics, PoliticalPosition, MatchAnalytics } from './types';

/**
 * Query options for fetching admin game sessions
 */
export interface AdminSessionsQuery {
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'score' | 'detected';
  sortOrder?: 'ASC' | 'DESC';
  filterDetected?: boolean | null;
  filterPosition?: PoliticalPosition | PoliticalPosition[] | null;
  filterPromptId?: string | string[] | null;
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
    filterPromptId = null,
    dateFrom = null,
    dateTo = null,
  } = options;

  try {
    // Build WHERE clause conditions
    const conditions: string[] = ['1=1']; // Always true base condition
    const params: (string | boolean | string[] | number)[] = [];

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
      if (Array.isArray(filterPosition)) {
        params.push(filterPosition);
        conditions.push(`gs.position_assigned = ANY($${params.length}::text[])`);
      } else {
        params.push(filterPosition);
        conditions.push(`gs.position_assigned = $${params.length}::text`);
      }
    }

    if (filterPromptId) {
      if (Array.isArray(filterPromptId)) {
        params.push(filterPromptId);
        conditions.push(`gs.prompt_id = ANY($${params.length}::text[])`);
      } else {
        params.push(filterPromptId);
        conditions.push(`gs.prompt_id = $${params.length}::text`);
      }
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
        host(gs.ip_address) as ip_address,
        gs.user_agent,
        gs.duration_seconds,
        u.political_alignment,
        u.age_range,
        u.country,
        u.total_games as user_total_games,
        u.avg_score as user_avg_score,
        COALESCE(
          ARRAY_AGG(DISTINCT m.id) FILTER (WHERE m.id IS NOT NULL),
          ARRAY[]::uuid[]
        ) as match_ids,
        COALESCE(
          ARRAY_AGG(DISTINCT m.match_code) FILTER (WHERE m.match_code IS NOT NULL),
          ARRAY[]::text[]
        ) as match_codes,
        COALESCE(
          ARRAY_AGG(DISTINCT m.status) FILTER (WHERE m.status IS NOT NULL),
          ARRAY[]::text[]
        ) as match_statuses
      FROM game_sessions gs
      LEFT JOIN users u ON gs.user_id = u.id
      LEFT JOIN (
        -- Get all matches associated with this session
        -- Either directly via gs.match_id or via match_participants
        SELECT DISTINCT m2.id, m2.match_code, m2.status, mp.session_id
        FROM matches m2
        LEFT JOIN match_participants mp ON m2.id = mp.match_id
      ) m ON m.session_id = gs.id
      WHERE ${whereClause}
      GROUP BY gs.id, u.political_alignment, u.age_range, u.country, u.total_games, u.avg_score
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
    filterPromptId = null,
    dateFrom = null,
    dateTo = null,
  } = options;

  try {
    const conditions: string[] = ['1=1'];
    const params: (string | boolean | string[])[] = [];

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
      if (Array.isArray(filterPosition)) {
        params.push(filterPosition);
        conditions.push(`position_assigned = ANY($${params.length}::text[])`);
      } else {
        params.push(filterPosition);
        conditions.push(`position_assigned = $${params.length}::text`);
      }
    }

    if (filterPromptId) {
      if (Array.isArray(filterPromptId)) {
        params.push(filterPromptId);
        conditions.push(`prompt_id = ANY($${params.length}::text[])`);
      } else {
        params.push(filterPromptId);
        conditions.push(`prompt_id = $${params.length}::text`);
      }
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

    // Get score distribution (10-point buckets) - always return all 10 bins
    const scoreDistResult = await sql`
      WITH bins AS (
        SELECT unnest(ARRAY['0-9', '10-19', '20-29', '30-39', '40-49',
                            '50-59', '60-69', '70-79', '80-89', '90-100']) as range,
               unnest(ARRAY[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) as bin_order
      ),
      score_counts AS (
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
      )
      SELECT bins.range, COALESCE(score_counts.count, 0) as count
      FROM bins
      LEFT JOIN score_counts ON bins.range = score_counts.range
      ORDER BY bins.bin_order
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

    // Get prompt performance (min 2 attempts, showing top 20)
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
      HAVING COUNT(*) >= 2
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
export async function getAllUsers(): Promise<Record<string, unknown>[]> {
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
export async function getAllSessions(
  dateFrom?: string,
  dateTo?: string
): Promise<Record<string, unknown>[]> {
  try {
    const conditions: string[] = ['1=1'];
    const params: string[] = [];

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
        host(gs.ip_address) as ip_address,
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

/**
 * Get list of distinct prompt IDs for filtering
 */
export async function getDistinctPromptIds(): Promise<string[]> {
  try {
    const result = await sql`
      SELECT DISTINCT prompt_id
      FROM game_sessions
      ORDER BY prompt_id
    `;

    return result.rows.map((row) => row.prompt_id);
  } catch (error) {
    console.error('Error fetching distinct prompt IDs:', error);
    throw error;
  }
}

/**
 * Get comprehensive match analytics for admin dashboard
 */
export async function getMatchAnalytics(): Promise<MatchAnalytics> {
  try {
    // Get total matches by status and completion rate
    const statusResult = await sql`
      SELECT
        status,
        COUNT(*) as count,
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
      FROM matches
      GROUP BY status
    `;

    const statusCounts = statusResult.rows.reduce(
      (acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      },
      { pending: 0, completed: 0, expired: 0 } as Record<string, number>
    );

    const totalMatches = statusCounts.pending + statusCounts.completed + statusCounts.expired;
    const completionRate = totalMatches > 0 ? (statusCounts.completed * 100.0) / totalMatches : 0;

    // Get match participation rate
    const participationResult = await sql`
      SELECT
        (SELECT COUNT(DISTINCT user_id) FROM match_participants) as users_in_matches,
        (SELECT COUNT(*) FROM users) as total_users
    `;

    const participationData = participationResult.rows[0];
    const usersInMatches = parseInt(participationData.users_in_matches) || 0;
    const totalUsers = parseInt(participationData.total_users) || 0;
    const participationRate = totalUsers > 0 ? (usersInMatches * 100.0) / totalUsers : 0;

    // Get average score difference in completed matches
    const scoreStatsResult = await sql`
      SELECT
        AVG(ABS(creator_score - opponent_score)) as avg_score_diff,
        AVG(GREATEST(creator_score, opponent_score) - LEAST(creator_score, opponent_score)) as avg_score_gap
      FROM (
        SELECT
          m.id,
          MAX(CASE WHEN mp.role = 'creator' THEN gs.score END) as creator_score,
          MAX(CASE WHEN mp.role = 'opponent' THEN gs.score END) as opponent_score
        FROM matches m
        JOIN match_participants mp ON m.id = mp.match_id
        JOIN game_sessions gs ON mp.session_id = gs.id
        WHERE m.status = 'completed'
        GROUP BY m.id
        HAVING COUNT(*) = 2
      ) scores
      WHERE creator_score IS NOT NULL AND opponent_score IS NOT NULL
    `;

    const scoreStats = scoreStatsResult.rows[0];
    const avgScoreDifference = parseFloat(scoreStats?.avg_score_diff) || 0;
    const avgScoreGap = parseFloat(scoreStats?.avg_score_gap) || 0;

    // Get score distribution by role (10-point buckets)
    const scoreDistResult = await sql`
      WITH bins AS (
        SELECT unnest(ARRAY['0-9', '10-19', '20-29', '30-39', '40-49',
                            '50-59', '60-69', '70-79', '80-89', '90-100']) as range,
               unnest(ARRAY[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) as bin_order
      ),
      creator_scores AS (
        SELECT
          CASE
            WHEN gs.score < 10 THEN '0-9'
            WHEN gs.score < 20 THEN '10-19'
            WHEN gs.score < 30 THEN '20-29'
            WHEN gs.score < 40 THEN '30-39'
            WHEN gs.score < 50 THEN '40-49'
            WHEN gs.score < 60 THEN '50-59'
            WHEN gs.score < 70 THEN '60-69'
            WHEN gs.score < 80 THEN '70-79'
            WHEN gs.score < 90 THEN '80-89'
            ELSE '90-100'
          END as range,
          COUNT(*) as count
        FROM match_participants mp
        JOIN game_sessions gs ON mp.session_id = gs.id
        WHERE mp.role = 'creator' AND gs.score IS NOT NULL
        GROUP BY range
      ),
      opponent_scores AS (
        SELECT
          CASE
            WHEN gs.score < 10 THEN '0-9'
            WHEN gs.score < 20 THEN '10-19'
            WHEN gs.score < 30 THEN '20-29'
            WHEN gs.score < 40 THEN '30-39'
            WHEN gs.score < 50 THEN '40-49'
            WHEN gs.score < 60 THEN '50-59'
            WHEN gs.score < 70 THEN '60-69'
            WHEN gs.score < 80 THEN '70-79'
            WHEN gs.score < 90 THEN '80-89'
            ELSE '90-100'
          END as range,
          COUNT(*) as count
        FROM match_participants mp
        JOIN game_sessions gs ON mp.session_id = gs.id
        WHERE mp.role = 'opponent' AND gs.score IS NOT NULL
        GROUP BY range
      )
      SELECT
        bins.range,
        COALESCE(creator_scores.count, 0) as creator_count,
        COALESCE(opponent_scores.count, 0) as opponent_count
      FROM bins
      LEFT JOIN creator_scores ON bins.range = creator_scores.range
      LEFT JOIN opponent_scores ON bins.range = opponent_scores.range
      ORDER BY bins.bin_order
    `;

    // Get top match creators
    const topCreatorsResult = await sql`
      SELECT
        mp.user_id,
        COUNT(DISTINCT m.id) as matches_created,
        COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as completed_matches,
        COUNT(CASE
          WHEN m.status = 'completed' AND scores.creator_score > scores.opponent_score
          THEN 1
        END) as wins
      FROM match_participants mp
      JOIN matches m ON mp.match_id = m.id
      LEFT JOIN LATERAL (
        SELECT
          MAX(CASE WHEN mp2.role = 'creator' THEN gs.score END) as creator_score,
          MAX(CASE WHEN mp2.role = 'opponent' THEN gs.score END) as opponent_score
        FROM match_participants mp2
        JOIN game_sessions gs ON mp2.session_id = gs.id
        WHERE mp2.match_id = m.id
      ) scores ON true
      WHERE mp.role = 'creator'
      GROUP BY mp.user_id
      ORDER BY matches_created DESC
      LIMIT 10
    `;

    return {
      totalMatches,
      completedMatches: statusCounts.completed,
      pendingMatches: statusCounts.pending,
      expiredMatches: statusCounts.expired,
      completionRate,
      participationRate,
      avgScoreDifference,
      avgScoreGap,
      statusDistribution: statusResult.rows.map((row) => ({
        status: row.status,
        count: parseInt(row.count),
        percentage: parseFloat(row.percentage) || 0,
      })),
      scoreDistributionByRole: {
        creators: scoreDistResult.rows.map((row) => ({
          range: row.range,
          count: parseInt(row.creator_count),
        })),
        opponents: scoreDistResult.rows.map((row) => ({
          range: row.range,
          count: parseInt(row.opponent_count),
        })),
      },
      topCreators: topCreatorsResult.rows.map((row) => {
        const matchesCreated = parseInt(row.matches_created);
        const completedMatches = parseInt(row.completed_matches);
        const wins = parseInt(row.wins);
        const winRate = completedMatches > 0 ? (wins * 100.0) / completedMatches : 0;
        return {
          userId: row.user_id,
          matchesCreated,
          completedMatches,
          wins,
          winRate,
        };
      }),
    };
  } catch (error) {
    console.error('Error fetching match analytics:', error);
    throw error;
  }
}
