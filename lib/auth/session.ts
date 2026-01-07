/**
 * Session management utilities.
 * Provides session creation, validation, and cookie handling.
 */

import { sql } from '@/lib/db';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'pulseops_session';
const SESSION_EXPIRY_DAYS = 7;

export interface Session {
    id: string;
    userId: string;
    activeOrgId: string | null;
    createdAt: Date;
    expiresAt: Date;
}

/**
 * Generate a random session token.
 */
function generateSessionToken(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Hash a session token for storage.
 */
async function hashSessionToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a new session for a user.
 * Returns the session token (to be stored in cookie).
 */
export async function createSession(
    userId: string,
    activeOrgId: string | null
): Promise<{ sessionId: string; token: string }> {
    const token = generateSessionToken();
    const tokenHash = await hashSessionToken(token);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

    const result = await sql`
    INSERT INTO sessions (user_id, session_token_hash, active_org_id, expires_at)
    VALUES (${userId}, ${tokenHash}, ${activeOrgId}, ${expiresAt.toISOString()})
    RETURNING id
  `;

    return { sessionId: result.rows[0].id, token };
}

/**
 * Get session from cookie token.
 * Returns null if session is invalid or expired.
 */
export async function getSessionByToken(
    token: string
): Promise<Session | null> {
    const tokenHash = await hashSessionToken(token);

    const result = await sql`
    SELECT id, user_id, active_org_id, created_at, expires_at
    FROM sessions
    WHERE session_token_hash = ${tokenHash}
      AND expires_at > NOW()
  `;

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];
    return {
        id: row.id,
        userId: row.user_id,
        activeOrgId: row.active_org_id,
        createdAt: new Date(row.created_at),
        expiresAt: new Date(row.expires_at),
    };
}

/**
 * Get session from the current request cookies.
 */
export async function getSessionFromCookies(): Promise<Session | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
        return null;
    }

    return getSessionByToken(sessionCookie.value);
}

/**
 * Update the active org for a session.
 */
export async function updateSessionActiveOrg(
    sessionId: string,
    activeOrgId: string
): Promise<void> {
    await sql`
    UPDATE sessions
    SET active_org_id = ${activeOrgId}
    WHERE id = ${sessionId}
  `;
}

/**
 * Destroy a session by ID.
 */
export async function destroySession(sessionId: string): Promise<void> {
    await sql`
    DELETE FROM sessions
    WHERE id = ${sessionId}
  `;
}

/**
 * Set the session cookie.
 * Must be called from a Server Action or Route Handler.
 */
export async function setSessionCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production';

    cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        path: '/',
        maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60, // seconds
    });
}

/**
 * Clear the session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}

export { SESSION_COOKIE_NAME };
