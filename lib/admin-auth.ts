import { NextRequest } from 'next/server';
import crypto from 'crypto';

// Token expiration time: 8 hours in seconds
const TOKEN_EXPIRY_SECONDS = 8 * 60 * 60;

/**
 * Generate a secure session token for admin authentication (JWT-like stateless token)
 * Format: base64(payload).base64(signature)
 * Payload: { exp: expiration_timestamp }
 * This is stateless and works across serverless function instances
 */
export function generateSessionToken(): string {
  const secret = process.env.ADMIN_DASHBOARD_PASSWORD;
  if (!secret) {
    throw new Error('ADMIN_DASHBOARD_PASSWORD not set');
  }

  const payload = {
    exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS,
    iat: Math.floor(Date.now() / 1000),
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadBase64).digest('base64url');

  return `${payloadBase64}.${signature}`;
}

/**
 * Validate a session token
 * Returns true if token signature is valid and hasn't expired
 */
export function validateSessionToken(token: string): boolean {
  const secret = process.env.ADMIN_DASHBOARD_PASSWORD;
  if (!secret) {
    console.error('ADMIN_DASHBOARD_PASSWORD not set for token validation');
    return false;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 2) {
      console.warn('Admin auth: malformed token (wrong number of parts)');
      return false;
    }

    const [payloadBase64, providedSignature] = parts;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadBase64)
      .digest('base64url');

    if (providedSignature !== expectedSignature) {
      console.warn('Admin auth: invalid token signature');
      return false;
    }

    // Parse and check expiration
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString());
    const now = Math.floor(Date.now() / 1000);

    if (!payload.exp || payload.exp < now) {
      console.warn('Admin auth: token expired');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Admin auth: token validation error:', error);
    return false;
  }
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
 * Note: With stateless tokens, true revocation would require a blocklist.
 * For now, logout is handled client-side by clearing the stored token.
 * The token will naturally expire after TOKEN_EXPIRY_SECONDS.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function revokeSessionToken(_token: string): void {
  // Stateless tokens can't be revoked server-side without a blocklist
  // Client-side logout clears sessionStorage, which is sufficient for most cases
}
