// Type definitions for the OneOfUs game

export interface Prompt {
  id: string;
  category: 'tweet' | 'reddit' | 'letter-to-mp' | 'news-comment' | 'whatsapp' | 'other';
  scenario: string;
  positions: PoliticalPosition[];
  charLimit: number;
  wordLimit?: number;
  metadata?: {
    region?: 'UK' | 'US' | 'global';
    difficulty?: 'easy' | 'medium' | 'hard';
    topic?: string;
  };
}

export type PoliticalPosition =
  | 'left'
  | 'centre-left'
  | 'centre'
  | 'conservative'
  | 'right'
  | 'libertarian'
  | 'environmentalist';

// Array of valid political positions for validation
export const VALID_POSITIONS: readonly PoliticalPosition[] = [
  'left',
  'centre-left',
  'centre',
  'conservative',
  'right',
  'libertarian',
  'environmentalist',
] as const;

export interface UserAlignment {
  id: string;
  politicalAlignment: number; // 1=Left, 2=Centre-left, 3=Centre, 4=Centre-right, 5=Right
  ageRange?: string;
  country?: string;
  createdAt: string;
}

export interface GameSession {
  id: string;
  userId?: string;
  promptId: string;
  prompt: Prompt;
  positionChosen: PoliticalPosition;
  userResponse: string;
  gradingResult?: GradingResult;
  aiResponse?: string;
  createdAt: string;
  completedAt?: string;
}

export interface GradingResult {
  detected: boolean;
  score: number;
  feedback: string;
  rubricScores?: {
    understanding: number;
    authenticity: number;
    execution: number;
  };
  timestamp: string;
}

// API request/response types
export interface GradeRequest {
  promptId: string;
  scenario: string;
  position: PoliticalPosition;
  userResponse: string;
}

export interface GradeResponse {
  success: boolean;
  result?: GradingResult;
  error?: string;
}

// Admin Dashboard Types

export interface GeolocationData {
  city: string;
  country: string;
  countryCode: string;
  region: string;
  lat: number;
  lon: number;
}

export interface AdminGameSession {
  // Game session fields
  id: string;
  user_id: string;
  created_at: string;
  completed_at: string;
  prompt_id: string;
  prompt_scenario: string;
  prompt_category: string;
  position_assigned: PoliticalPosition;
  user_response: string;
  char_count: number;
  detected: boolean;
  score: number;
  feedback: string;
  rubric_understanding: number;
  rubric_authenticity: number;
  rubric_execution: number;
  ai_comparison_response: string;
  ip_address: string;
  user_agent: string;
  duration_seconds: number;

  // Joined user fields
  political_alignment: number;
  age_range: string;
  country: string;
  user_total_games: number;
  user_avg_score: number;

  // Enriched geolocation data
  geolocation?: GeolocationData;
}

export interface AdminAnalytics {
  totalUsers: number;
  totalGames: number;
  avgScore: number;
  detectionRate: number;
  scoreDistribution: Array<{ range: string; count: number }>;
  positionPerformance: Array<{
    position: string;
    total: number;
    avgScore: number;
    detectionRate: number;
  }>;
  promptPerformance: Array<{
    promptId: string;
    promptScenario: string;
    attempts: number;
    avgScore: number;
    detectionRate: number;
  }>;
  demographicBreakdown: {
    byAlignment: Array<{ alignment: number; count: number; avgScore: number }>;
    byCountry: Array<{ country: string; count: number }>;
    byAge: Array<{ ageRange: string; count: number }>;
  };
}

// =====================================================
// 1v1 MATCHES TYPES
// =====================================================

export type MatchStatus = 'pending' | 'completed' | 'expired';

export type ParticipantRole = 'creator' | 'opponent';

export interface Match {
  id: string;
  matchCode: string;
  status: MatchStatus;
  promptId: string;
  createdAt: string;
  expiresAt: string;
  completedAt: string | null;
}

export interface MatchParticipant {
  id: string;
  matchId: string;
  userId: string;
  sessionId: string | null;
  role: ParticipantRole;
  joinedAt: string;
}

// Extended match with participants (returned by API)
export interface MatchWithParticipants extends Match {
  participants: MatchParticipant[];
}

// Participant with session data for results display
export interface ParticipantWithSession extends MatchParticipant {
  session?: {
    id: string;
    positionAssigned: PoliticalPosition;
    userResponse: string;
    score: number | null;
    detected: boolean | null;
    feedback: string | null;
    rubricUnderstanding: number | null;
    rubricAuthenticity: number | null;
    rubricExecution: number | null;
    aiComparisonResponse: string | null;
    durationSeconds: number | null;
  };
}

// Full match data for results page
export interface MatchResults {
  match: Match;
  prompt: Prompt;
  participants: ParticipantWithSession[];
  winner: 'creator' | 'opponent' | 'tie' | null; // null if not completed
}

// API Request/Response types for matches

export interface MatchCreateRequest {
  sessionId: string;
  userId: string;
}

export interface MatchCreateResponse {
  success: boolean;
  matchId?: string;
  matchCode?: string;
  shareUrl?: string;
  existingMatch?: boolean; // True if returning existing match for this session
  error?: string;
}

export interface MatchJoinRequest {
  matchCode: string;
  userId: string;
}

export interface MatchJoinResponse {
  success: boolean;
  matchId?: string;
  promptId?: string;
  position?: PoliticalPosition;
  alreadyJoined?: boolean;
  error?: string;
}

export interface MatchLinkSessionRequest {
  sessionId: string;
  matchId: string;
  userId: string;
}

export interface MatchLinkSessionResponse {
  success: boolean;
  matchCompleted?: boolean;
  error?: string;
}

// Match history item (for /matches page)
export interface MatchHistoryItem {
  id: string;
  matchCode: string;
  status: MatchStatus;
  promptId: string;
  promptScenario: string;
  createdAt: string;
  completedAt: string | null;
  role: ParticipantRole;
  creatorScore: number | null;
  opponentScore: number | null;
  participantCount: number;
}

// =====================================================
// MATCH ANALYTICS TYPES (Admin Dashboard)
// =====================================================

export interface MatchAnalytics {
  // Overview metrics
  totalMatches: number;
  completedMatches: number;
  pendingMatches: number;
  expiredMatches: number;
  completionRate: number; // percentage
  participationRate: number; // percentage of users in matches

  // Score metrics
  avgScoreDifference: number;
  avgScoreGap: number; // Always positive difference

  // Distributions
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;

  scoreDistributionByRole: {
    creators: Array<{ range: string; count: number }>;
    opponents: Array<{ range: string; count: number }>;
  };

  // Top creators
  topCreators: Array<{
    userId: string;
    matchesCreated: number;
    completedMatches: number;
    wins: number;
    winRate: number;
  }>;
}
