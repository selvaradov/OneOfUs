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
  createdAt: string;
  completedAt?: string;
}

export interface GradingResult {
  detected: boolean;
  score: number;
  feedback: string;
  rubricScores?: {
    authenticity: number;
    shibboleths: number;
    steelmanning: number;
    tone: number;
    coherence: number;
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
