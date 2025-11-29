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
  | 'centre-right'
  | 'right'
  | 'progressive'
  | 'conservative'
  | 'libertarian'
  | 'green'
  | 'socialist';

// Array of valid political positions for validation
export const VALID_POSITIONS: readonly PoliticalPosition[] = [
  'left',
  'centre-left',
  'centre',
  'centre-right',
  'right',
  'progressive',
  'conservative',
  'libertarian',
  'green',
  'socialist'
] as const;

export interface UserAlignment {
  id: string;
  politicalAlignment: PoliticalPosition;
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
