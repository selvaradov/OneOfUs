import { NextRequest } from 'next/server';
import crypto from 'crypto';

// Simple in-memory session store
// For production with multiple instances, consider using Redis
const sessions = new Map<string, { expires: number }>();

/**
 * Generate a secure session token for admin authentication
 * Session expires after 8 hours
 */
export function generateSessionToken(): string {
  const token = crypto.randomBytes(32).toString('hex');
  // Session expires in 8 hours (28800000 ms)
  sessions.set(token, { expires: Date.now() + 8 * 60 * 60 * 1000 });
  return token;
}

/**
 * Validate a session token
 * Returns true if token exists and hasn't expired
 */
export function validateSessionToken(token: string): boolean {
  const session = sessions.get(token);
  if (!session) return false;

  // Check if session has expired
  if (Date.now() > session.expires) {
    sessions.delete(token);
    return false;
  }

  return true;
}

/**
 * Verify admin authentication from request
 * Checks Authorization header for Bearer token
 */
export function verifyAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) return false;

  // Extract token from "Bearer <token>"
  const token = authHeader.replace('Bearer ', '');

  if (!token || token === authHeader) {
    // No token found or malformed header
    return false;
  }

  return validateSessionToken(token);
}

/**
 * Verify admin password against environment variable
 * Returns true if password matches ADMIN_DASHBOARD_PASSWORD
 */
export function verifyAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_DASHBOARD_PASSWORD;

  if (!adminPassword) {
    console.error('ADMIN_DASHBOARD_PASSWORD environment variable not set');
    return false;
  }

  return password === adminPassword;
}

/**
 * Revoke a session token (for logout functionality)
 */
export function revokeSessionToken(token: string): void {
  sessions.delete(token);
}

/**
 * Clean up expired sessions (run periodically)
 * Helps prevent memory leaks in long-running processes
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now > session.expires) {
      sessions.delete(token);
    }
  }
}

// Run cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
}
