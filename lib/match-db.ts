import { sql } from '@vercel/postgres';
import {
  Match,
  MatchParticipant,
  MatchWithParticipants,
  MatchResults,
  ParticipantWithSession,
  MatchHistoryItem,
  PoliticalPosition,
} from './types';
import { getPromptById } from './prompts';

// =====================================================
// MATCH CODE GENERATION
// =====================================================

// Alphabet excluding ambiguous characters (0/O, 1/I/L)
const MATCH_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const MATCH_CODE_LENGTH = 8;

/**
 * Generate a random 8-character match code
 */
function generateRandomCode(): string {
  let code = '';
  for (let i = 0; i < MATCH_CODE_LENGTH; i++) {
    code += MATCH_CODE_ALPHABET.charAt(Math.floor(Math.random() * MATCH_CODE_ALPHABET.length));
  }
  return code;
}

/**
 * Generate a unique match code with collision retry
 */
export async function generateMatchCode(maxRetries = 5): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const code = generateRandomCode();
    // Check if code already exists
    const existing = await sql`SELECT id FROM matches WHERE match_code = ${code}`;
    if (existing.rows.length === 0) {
      return code;
    }
  }
  throw new Error('Failed to generate unique match code after max retries');
}

// =====================================================
// MATCH CRUD OPERATIONS
// =====================================================

/**
 * Create a new match from an existing game session
 * Also creates the creator participant record
 */
export async function createMatch(
  creatorUserId: string,
  creatorSessionId: string,
  promptId: string
): Promise<{ matchId: string; matchCode: string }> {
  const matchCode = await generateMatchCode();

  // Create the match
  const matchResult = await sql`
    INSERT INTO matches (match_code, prompt_id)
    VALUES (${matchCode}, ${promptId})
    RETURNING id
  `;
  const matchId = matchResult.rows[0].id;

  // Create the creator participant record
  await sql`
    INSERT INTO match_participants (match_id, user_id, session_id, role)
    VALUES (${matchId}, ${creatorUserId}, ${creatorSessionId}, 'creator')
  `;

  // Link the session to the match
  await sql`
    UPDATE game_sessions SET match_id = ${matchId} WHERE id = ${creatorSessionId}
  `;

  return { matchId, matchCode };
}

/**
 * Get a match by its 8-character code
 */
export async function getMatchByCode(matchCode: string): Promise<MatchWithParticipants | null> {
  const upperCode = matchCode.toUpperCase();

  const matchResult = await sql`
    SELECT id, match_code, status, prompt_id, created_at, expires_at, completed_at
    FROM matches
    WHERE match_code = ${upperCode}
  `;

  if (matchResult.rows.length === 0) {
    return null;
  }

  const matchRow = matchResult.rows[0];
  const match = rowToMatch(matchRow);

  // Fetch participants
  const participantsResult = await sql`
    SELECT id, match_id, user_id, session_id, role, joined_at
    FROM match_participants
    WHERE match_id = ${match.id}
    ORDER BY joined_at ASC
  `;

  const participants = participantsResult.rows.map(rowToParticipant);

  return { ...match, participants };
}

/**
 * Get a match by its UUID
 */
export async function getMatchById(matchId: string): Promise<MatchWithParticipants | null> {
  const matchResult = await sql`
    SELECT id, match_code, status, prompt_id, created_at, expires_at, completed_at
    FROM matches
    WHERE id = ${matchId}
  `;

  if (matchResult.rows.length === 0) {
    return null;
  }

  const matchRow = matchResult.rows[0];
  const match = rowToMatch(matchRow);

  // Fetch participants
  const participantsResult = await sql`
    SELECT id, match_id, user_id, session_id, role, joined_at
    FROM match_participants
    WHERE match_id = ${match.id}
    ORDER BY joined_at ASC
  `;

  const participants = participantsResult.rows.map(rowToParticipant);

  return { ...match, participants };
}

/**
 * Check if a match already exists for a given session
 * Used to prevent duplicate match creation
 */
export async function getExistingMatchForSession(
  sessionId: string
): Promise<{ matchId: string; matchCode: string } | null> {
  const result = await sql`
    SELECT m.id, m.match_code
    FROM matches m
    JOIN match_participants mp ON m.id = mp.match_id
    WHERE mp.session_id = ${sessionId} AND mp.role = 'creator'
  `;

  if (result.rows.length === 0) {
    return null;
  }

  return {
    matchId: result.rows[0].id,
    matchCode: result.rows[0].match_code,
  };
}

/**
 * Join a match as an opponent
 * Returns the match details needed for the game page
 */
export async function joinMatch(
  matchCode: string,
  userId: string
): Promise<{
  success: boolean;
  matchId?: string;
  promptId?: string;
  position?: PoliticalPosition;
  alreadyJoined?: boolean;
  error?: string;
}> {
  const upperCode = matchCode.toUpperCase();

  // Get the match
  const matchResult = await sql`
    SELECT id, status, prompt_id, expires_at
    FROM matches
    WHERE match_code = ${upperCode}
  `;

  if (matchResult.rows.length === 0) {
    return { success: false, error: 'Match not found' };
  }

  const match = matchResult.rows[0];

  // Check if expired
  if (new Date(match.expires_at) < new Date()) {
    // Mark as expired if not already
    if (match.status !== 'expired') {
      await sql`UPDATE matches SET status = 'expired' WHERE id = ${match.id}`;
    }
    return { success: false, error: 'Match has expired' };
  }

  // Check if already completed
  if (match.status === 'completed') {
    return { success: false, error: 'Match is already completed' };
  }

  // Check if user is the creator
  const creatorCheck = await sql`
    SELECT id FROM match_participants
    WHERE match_id = ${match.id} AND user_id = ${userId} AND role = 'creator'
  `;
  if (creatorCheck.rows.length > 0) {
    return { success: false, error: 'You cannot join your own match as opponent' };
  }

  // Check if user already joined
  const existingParticipant = await sql`
    SELECT id FROM match_participants
    WHERE match_id = ${match.id} AND user_id = ${userId} AND role = 'opponent'
  `;
  if (existingParticipant.rows.length > 0) {
    // User already joined, return the match details
    const position = await getCreatorPosition(match.id);
    return {
      success: true,
      matchId: match.id,
      promptId: match.prompt_id,
      position: position,
      alreadyJoined: true,
    };
  }

  // Check if match already has an opponent (for MVP, single opponent only)
  const opponentCount = await sql`
    SELECT COUNT(*) as count FROM match_participants
    WHERE match_id = ${match.id} AND role = 'opponent'
  `;
  if (parseInt(opponentCount.rows[0].count) > 0) {
    return { success: false, error: 'Match already has an opponent' };
  }

  // Add the opponent participant
  await sql`
    INSERT INTO match_participants (match_id, user_id, role)
    VALUES (${match.id}, ${userId}, 'opponent')
  `;

  // Get the creator's position to assign the same to opponent (for same-position mode)
  const position = await getCreatorPosition(match.id);

  return {
    success: true,
    matchId: match.id,
    promptId: match.prompt_id,
    position: position,
    alreadyJoined: false,
  };
}

/**
 * Get the creator's position from their session
 * Used to assign the same position to opponent in same-position mode
 */
async function getCreatorPosition(matchId: string): Promise<PoliticalPosition> {
  const result = await sql`
    SELECT gs.position_assigned
    FROM match_participants mp
    JOIN game_sessions gs ON mp.session_id = gs.id
    WHERE mp.match_id = ${matchId} AND mp.role = 'creator'
  `;

  if (result.rows.length === 0) {
    throw new Error('Creator session not found');
  }

  return result.rows[0].position_assigned as PoliticalPosition;
}

/**
 * Link a game session to a match (called after grading)
 * Validates that the session used the correct prompt and position.
 * Also checks if match is now complete.
 */
export async function linkSessionToMatch(
  sessionId: string,
  matchId: string,
  userId: string
): Promise<{ success: boolean; matchCompleted: boolean; error?: string }> {
  // Get the match details
  const matchResult = await sql`
    SELECT prompt_id FROM matches WHERE id = ${matchId}
  `;

  if (matchResult.rows.length === 0) {
    return { success: false, matchCompleted: false, error: 'Match not found' };
  }

  const matchPromptId = matchResult.rows[0].prompt_id;

  // Get the session details to validate
  const sessionResult = await sql`
    SELECT prompt_id, position_assigned FROM game_sessions WHERE id = ${sessionId}
  `;

  if (sessionResult.rows.length === 0) {
    return { success: false, matchCompleted: false, error: 'Session not found' };
  }

  const session = sessionResult.rows[0];

  // Validate prompt matches
  if (session.prompt_id !== matchPromptId) {
    return {
      success: false,
      matchCompleted: false,
      error: `Session prompt (${session.prompt_id}) does not match match prompt (${matchPromptId})`,
    };
  }

  // Get the expected position (creator's position for same-position mode)
  const expectedPosition = await getCreatorPosition(matchId);

  // Validate position matches
  if (session.position_assigned !== expectedPosition) {
    return {
      success: false,
      matchCompleted: false,
      error: `Session position (${session.position_assigned}) does not match expected position (${expectedPosition})`,
    };
  }

  // Update the game session with match_id
  await sql`
    UPDATE game_sessions SET match_id = ${matchId} WHERE id = ${sessionId}
  `;

  // Update the participant's session_id
  const updateResult = await sql`
    UPDATE match_participants
    SET session_id = ${sessionId}
    WHERE match_id = ${matchId} AND user_id = ${userId}
    RETURNING role
  `;

  if (updateResult.rows.length === 0) {
    return { success: false, matchCompleted: false, error: 'Participant not found in match' };
  }

  // Check if all participants have sessions (match is complete)
  const incompleteCount = await sql`
    SELECT COUNT(*) as count FROM match_participants
    WHERE match_id = ${matchId} AND session_id IS NULL
  `;

  const allComplete = parseInt(incompleteCount.rows[0].count) === 0;

  if (allComplete) {
    // Mark match as completed
    await sql`
      UPDATE matches
      SET status = 'completed', completed_at = NOW()
      WHERE id = ${matchId}
    `;
  }

  return { success: true, matchCompleted: allComplete };
}

/**
 * Get full match results with participant session data
 * Used for the head-to-head results display
 */
export async function getMatchResults(matchId: string): Promise<MatchResults | null> {
  // Get the match
  const matchResult = await sql`
    SELECT id, match_code, status, prompt_id, created_at, expires_at, completed_at
    FROM matches
    WHERE id = ${matchId}
  `;

  if (matchResult.rows.length === 0) {
    return null;
  }

  const match = rowToMatch(matchResult.rows[0]);

  // Get the prompt
  const prompt = getPromptById(match.promptId);
  if (!prompt) {
    throw new Error(`Prompt not found: ${match.promptId}`);
  }

  // Get participants with their session data
  const participantsResult = await sql`
    SELECT
      mp.id, mp.match_id, mp.user_id, mp.session_id, mp.role, mp.joined_at,
      gs.position_assigned, gs.user_response, gs.score, gs.detected, gs.feedback,
      gs.rubric_understanding, gs.rubric_authenticity, gs.rubric_execution,
      gs.ai_comparison_response, gs.duration_seconds
    FROM match_participants mp
    LEFT JOIN game_sessions gs ON mp.session_id = gs.id
    WHERE mp.match_id = ${matchId}
    ORDER BY mp.joined_at ASC
  `;

  const participants: ParticipantWithSession[] = participantsResult.rows.map((row) => ({
    id: row.id,
    matchId: row.match_id,
    userId: row.user_id,
    sessionId: row.session_id,
    role: row.role,
    joinedAt: row.joined_at,
    session: row.session_id
      ? {
          id: row.session_id,
          positionAssigned: row.position_assigned,
          userResponse: row.user_response,
          score: row.score,
          detected: row.detected,
          feedback: row.feedback,
          rubricUnderstanding: row.rubric_understanding,
          rubricAuthenticity: row.rubric_authenticity,
          rubricExecution: row.rubric_execution,
          aiComparisonResponse: row.ai_comparison_response,
          durationSeconds: row.duration_seconds,
        }
      : undefined,
  }));

  // Determine winner
  let winner: 'creator' | 'opponent' | 'tie' | null = null;
  if (match.status === 'completed') {
    const creatorScore = participants.find((p) => p.role === 'creator')?.session?.score ?? 0;
    const opponentScore = participants.find((p) => p.role === 'opponent')?.session?.score ?? 0;

    if (creatorScore > opponentScore) {
      winner = 'creator';
    } else if (opponentScore > creatorScore) {
      winner = 'opponent';
    } else {
      winner = 'tie';
    }
  }

  return { match, prompt, participants, winner };
}

/**
 * Get match history for a user
 * Returns matches where user is creator or opponent
 */
export async function getMatchHistory(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ matches: MatchHistoryItem[]; total: number }> {
  // Get total count
  const countResult = await sql`
    SELECT COUNT(DISTINCT m.id) as count
    FROM matches m
    JOIN match_participants mp ON m.id = mp.match_id
    WHERE mp.user_id = ${userId}
  `;
  const total = parseInt(countResult.rows[0].count);

  // Get matches with participant info
  const matchesResult = await sql`
    SELECT
      m.id, m.match_code, m.status, m.prompt_id, m.created_at, m.completed_at,
      mp.role,
      (SELECT gs.prompt_scenario FROM game_sessions gs
       JOIN match_participants mp2 ON gs.id = mp2.session_id
       WHERE mp2.match_id = m.id AND mp2.role = 'creator' LIMIT 1) as prompt_scenario,
      (SELECT gs.score FROM game_sessions gs
       JOIN match_participants mp2 ON gs.id = mp2.session_id
       WHERE mp2.match_id = m.id AND mp2.role = 'creator' LIMIT 1) as creator_score,
      (SELECT gs.score FROM game_sessions gs
       JOIN match_participants mp2 ON gs.id = mp2.session_id
       WHERE mp2.match_id = m.id AND mp2.role = 'opponent' LIMIT 1) as opponent_score,
      (SELECT COUNT(*) FROM match_participants mp2 WHERE mp2.match_id = m.id) as participant_count
    FROM matches m
    JOIN match_participants mp ON m.id = mp.match_id
    WHERE mp.user_id = ${userId}
    ORDER BY m.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const matches: MatchHistoryItem[] = matchesResult.rows.map((row) => ({
    id: row.id,
    matchCode: row.match_code,
    status: row.status,
    promptId: row.prompt_id,
    promptScenario: row.prompt_scenario || '',
    createdAt: row.created_at,
    completedAt: row.completed_at,
    role: row.role,
    creatorScore: row.creator_score,
    opponentScore: row.opponent_score,
    participantCount: parseInt(row.participant_count),
  }));

  return { matches, total };
}

/**
 * Mark expired matches (can be called periodically or on-access)
 */
export async function markExpiredMatches(): Promise<number> {
  const result = await sql`
    UPDATE matches
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at < NOW()
    RETURNING id
  `;
  return result.rows.length;
}

/**
 * Check if a match is expired (updates status if needed)
 */
export async function checkAndUpdateMatchExpiry(matchId: string): Promise<boolean> {
  const result = await sql`
    UPDATE matches
    SET status = 'expired'
    WHERE id = ${matchId} AND status = 'pending' AND expires_at < NOW()
    RETURNING id
  `;
  return result.rows.length > 0;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function rowToMatch(row: Record<string, unknown>): Match {
  return {
    id: row.id as string,
    matchCode: row.match_code as string,
    status: row.status as Match['status'],
    promptId: row.prompt_id as string,
    createdAt: row.created_at as string,
    expiresAt: row.expires_at as string,
    completedAt: row.completed_at as string | null,
  };
}

function rowToParticipant(row: Record<string, unknown>): MatchParticipant {
  return {
    id: row.id as string,
    matchId: row.match_id as string,
    userId: row.user_id as string,
    sessionId: row.session_id as string | null,
    role: row.role as MatchParticipant['role'],
    joinedAt: row.joined_at as string,
  };
}
