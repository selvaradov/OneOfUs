import { UserAlignment } from './types';

// Keys for localStorage
const KEYS = {
  USER_ALIGNMENT: 'oneofus_user_alignment',
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
