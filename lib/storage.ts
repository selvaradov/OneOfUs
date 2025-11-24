import { UserAlignment, GameSession } from './types';

// Keys for localStorage
const KEYS = {
  USER_ALIGNMENT: 'oneofus_user_alignment',
  GAME_SESSIONS: 'oneofus_game_sessions',
  ONBOARDING_COMPLETE: 'oneofus_onboarding_complete',
};

// User Alignment
export function saveUserAlignment(alignment: UserAlignment): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.USER_ALIGNMENT, JSON.stringify(alignment));
  localStorage.setItem(KEYS.ONBOARDING_COMPLETE, 'true');
}

export function getUserAlignment(): UserAlignment | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(KEYS.USER_ALIGNMENT);
  return data ? JSON.parse(data) : null;
}

export function hasCompletedOnboarding(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(KEYS.ONBOARDING_COMPLETE) === 'true';
}

// Game Sessions
export function saveGameSession(session: GameSession): void {
  if (typeof window === 'undefined') return;
  const sessions = getGameSessions();
  sessions.push(session);
  localStorage.setItem(KEYS.GAME_SESSIONS, JSON.stringify(sessions));
}

export function getGameSessions(): GameSession[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(KEYS.GAME_SESSIONS);
  return data ? JSON.parse(data) : [];
}

export function getLatestGameSession(): GameSession | null {
  const sessions = getGameSessions();
  return sessions.length > 0 ? sessions[sessions.length - 1] : null;
}

// Clear all data (for testing/reset)
export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
}
