/**
 * Auth and Tenancy Tests
 * Tests for authentication, session management, and cross-tenant isolation.
 *
 * NOTE: These tests require a database connection.
 * - In CI: POSTGRES_URL must be set, otherwise tests FAIL.
 * - Locally: Tests skip if POSTGRES_URL is not configured.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as signup } from '@/app/api/auth/signup/route';
// login import kept for potential future login-specific tests
import { POST as _login } from '@/app/api/auth/login/route';
import { GET as getMe } from '@/app/api/me/route';
import { GET as getOrgMeta } from '@/app/api/orgs/[orgId]/meta/route';
import { POST as switchOrg } from '@/app/api/orgs/active/route';
import { sql } from '@/lib/db';

// Check if database is configured
const hasDatabase = !!process.env.POSTGRES_URL;
const isCI = !!process.env.CI;

// In CI, we MUST have a database - fail loudly if not configured
if (isCI && !hasDatabase) {
    throw new Error(
        'POSTGRES_URL is required in CI. Auth-tenancy tests cannot be skipped in CI environment.'
    );
}

// Test data with unique emails to avoid conflicts
const testUserA = {
    email: `test-a-${Date.now()}@example.com`,
    password: 'password123',
    name: 'User A',
};

const testUserB = {
    email: `test-b-${Date.now()}@example.com`,
    password: 'password456',
    name: 'User B',
};

// Store created data for cleanup
let userAId: string;
let userBId: string;
let orgAId: string;
let orgBId: string;
let sessionAToken: string;
let sessionBToken: string;

/**
 * Helper to extract session token from Set-Cookie header.
 */
function extractSessionToken(response: Response): string | null {
    const setCookie = response.headers.get('set-cookie');
    if (!setCookie) return null;

    const match = setCookie.match(/pulseops_session=([^;]+)/);
    return match ? match[1] : null;
}

/**
 * Create a request with a session cookie.
 */
function createAuthenticatedRequest(
    url: string,
    token: string,
    options: { method?: string; body?: string; headers?: Record<string, string> } = {}
): NextRequest {
    const headers = new Headers(options.headers);
    headers.set('cookie', `pulseops_session=${token}`);

    return new NextRequest(url, {
        method: options.method || 'GET',
        body: options.body,
        headers,
    });
}

describe.skipIf(!hasDatabase)('Auth and Tenancy', () => {
    beforeAll(async () => {
        // Clean up any existing test data
        await sql`DELETE FROM users WHERE email LIKE 'test-%@example.com'`;
    });

    afterAll(async () => {
        // Clean up test data
        if (userAId) {
            await sql`DELETE FROM users WHERE id = ${userAId}`;
        }
        if (userBId) {
            await sql`DELETE FROM users WHERE id = ${userBId}`;
        }
        // Orgs will be cascade deleted via org_members
    });

    describe('Signup', () => {
        it('creates user, org, and returns session cookie', async () => {
            const request = new NextRequest('http://localhost:3000/api/auth/signup', {
                method: 'POST',
                body: JSON.stringify(testUserA),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await signup(request);
            expect(response.status).toBe(200);

            const body = await response.json();
            expect(body.data).toBeDefined();
            expect(body.data.user).toBeDefined();
            expect(body.data.user.email).toBe(testUserA.email);
            expect(body.data.org).toBeDefined();
            expect(body.data.org.name).toContain("User A's Org");

            // Store IDs for later tests
            userAId = body.data.user.id;
            orgAId = body.data.org.id;

            // Check session cookie
            sessionAToken = extractSessionToken(response) || '';
            expect(sessionAToken).toBeTruthy();

            // Check correlation ID header
            expect(response.headers.get('x-correlation-id')).toBeTruthy();
        });

        it('creates second user with separate org', async () => {
            const request = new NextRequest('http://localhost:3000/api/auth/signup', {
                method: 'POST',
                body: JSON.stringify(testUserB),
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await signup(request);
            expect(response.status).toBe(200);

            const body = await response.json();
            userBId = body.data.user.id;
            orgBId = body.data.org.id;
            sessionBToken = extractSessionToken(response) || '';

            expect(orgBId).not.toBe(orgAId);
        });
    });

    describe('/api/me', () => {
        it('returns user and org context with valid session', async () => {
            const request = createAuthenticatedRequest(
                'http://localhost:3000/api/me',
                sessionAToken
            );

            const response = await getMe(request);
            expect(response.status).toBe(200);

            const body = await response.json();
            expect(body.data.user.email).toBe(testUserA.email);
            expect(body.data.activeOrgId).toBe(orgAId);
            expect(body.data.role).toBe('admin');
        });

        it('returns 401 without session', async () => {
            const request = new NextRequest('http://localhost:3000/api/me');

            const response = await getMe(request);
            expect(response.status).toBe(401);
        });
    });

    describe('Cross-Tenant Isolation', () => {
        it('user A cannot access org B meta (403)', async () => {
            const request = createAuthenticatedRequest(
                `http://localhost:3000/api/orgs/${orgBId}/meta`,
                sessionAToken
            );

            const response = await getOrgMeta(request);
            expect(response.status).toBe(403);

            const body = await response.json();
            expect(body.error.code).toBe('FORBIDDEN');
        });

        it('user B cannot access org A meta (403)', async () => {
            const request = createAuthenticatedRequest(
                `http://localhost:3000/api/orgs/${orgAId}/meta`,
                sessionBToken
            );

            const response = await getOrgMeta(request);
            expect(response.status).toBe(403);
        });

        it('user A can access own org meta', async () => {
            const request = createAuthenticatedRequest(
                `http://localhost:3000/api/orgs/${orgAId}/meta`,
                sessionAToken
            );

            const response = await getOrgMeta(request);
            expect(response.status).toBe(200);

            const body = await response.json();
            expect(body.data.org.id).toBe(orgAId);
        });
    });

    describe('Org Switch Protection', () => {
        it('user A cannot switch to org B (403)', async () => {
            const request = createAuthenticatedRequest(
                'http://localhost:3000/api/orgs/active',
                sessionAToken,
                {
                    method: 'POST',
                    body: JSON.stringify({ orgId: orgBId }),
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            const response = await switchOrg(request);
            expect(response.status).toBe(403);
        });

        it('user A can switch to own org', async () => {
            const request = createAuthenticatedRequest(
                'http://localhost:3000/api/orgs/active',
                sessionAToken,
                {
                    method: 'POST',
                    body: JSON.stringify({ orgId: orgAId }),
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            const response = await switchOrg(request);
            expect(response.status).toBe(200);
        });
    });
});
