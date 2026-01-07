/**
 * Logs API Tests
 * Tests for log ingestion, querying, RBAC, tenant isolation, and rate limiting.
 *
 * NOTE: These tests require a database connection.
 * - In CI: POSTGRES_URL must be set, otherwise tests FAIL.
 * - Locally: Tests skip if POSTGRES_URL is not configured.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { generateApiKey, hashApiKey } from '@/lib/keys/apiKey';

// Route imports
import { POST as ingestLogs } from '@/app/api/v1/logs/ingest/route';
import { GET as queryLogs } from '@/app/api/logs/query/route';

// Check if database is configured
const hasDatabase = !!process.env.POSTGRES_URL;
const isCI = !!process.env.CI;

// In CI, we MUST have a database
if (isCI && !hasDatabase) {
    throw new Error(
        'POSTGRES_URL is required in CI. Logs tests cannot be skipped in CI environment.'
    );
}

// Test data
const timestamp = Date.now();

let orgAId: string;
let orgBId: string;
let userAId: string;
let userBId: string;
let serviceAId: string;
let envAId: string;
let _apiKeyAId: string;
let rawApiKeyA: string;
let sessionAToken: string;
let sessionBToken: string;

/**
 * Create authenticated request with session cookie.
 */
function authRequest(
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

describe.skipIf(!hasDatabase)('Logs API', () => {
    beforeAll(async () => {
        // Create org A
        const orgAResult = await sql`
      INSERT INTO orgs (name) VALUES ('Logs Test Org A') RETURNING id
    `;
        orgAId = orgAResult.rows[0].id;

        // Create org B
        const orgBResult = await sql`
      INSERT INTO orgs (name) VALUES ('Logs Test Org B') RETURNING id
    `;
        orgBId = orgBResult.rows[0].id;

        // Create user A (admin of org A)
        const hashA = await hashPassword('password');
        const userAResult = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${`logs-a-${timestamp}@example.com`}, 'Logs User A', ${hashA})
      RETURNING id
    `;
        userAId = userAResult.rows[0].id;

        await sql`
      INSERT INTO org_members (org_id, user_id, role)
      VALUES (${orgAId}, ${userAId}, 'admin')
    `;

        const sessionA = await createSession(userAId, orgAId);
        sessionAToken = sessionA.token;

        // Create user B (admin of org B)
        const hashB = await hashPassword('password');
        const userBResult = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${`logs-b-${timestamp}@example.com`}, 'Logs User B', ${hashB})
      RETURNING id
    `;
        userBId = userBResult.rows[0].id;

        await sql`
      INSERT INTO org_members (org_id, user_id, role)
      VALUES (${orgBId}, ${userBId}, 'admin')
    `;

        const sessionB = await createSession(userBId, orgBId);
        sessionBToken = sessionB.token;

        // Create service for org A
        const serviceResult = await sql`
      INSERT INTO services (org_id, name, created_by)
      VALUES (${orgAId}, 'Test Service', ${userAId})
      RETURNING id
    `;
        serviceAId = serviceResult.rows[0].id;

        // Create environment
        const envResult = await sql`
      INSERT INTO environments (service_id, name)
      VALUES (${serviceAId}, 'production')
      RETURNING id
    `;
        envAId = envResult.rows[0].id;

        // Create API key for org A
        rawApiKeyA = generateApiKey();
        const keyHash = await hashApiKey(rawApiKeyA);
        const keyResult = await sql`
      INSERT INTO api_keys (org_id, service_id, environment_id, key_hash)
      VALUES (${orgAId}, ${serviceAId}, ${envAId}, ${keyHash})
      RETURNING id
    `;
        _apiKeyAId = keyResult.rows[0].id;
    });

    afterAll(async () => {
        // Clean up
        await sql`DELETE FROM users WHERE id IN (${userAId}, ${userBId})`;
        await sql`DELETE FROM orgs WHERE id IN (${orgAId}, ${orgBId})`;
    });

    describe('Log Ingestion', () => {
        it('ingests logs with valid API key', async () => {
            const request = new NextRequest('http://localhost:3000/api/v1/logs/ingest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': rawApiKeyA,
                },
                body: JSON.stringify({
                    logs: [
                        {
                            timestamp: new Date().toISOString(),
                            level: 'info',
                            message: 'Test log message 1',
                            meta: { test: true },
                        },
                        {
                            timestamp: new Date().toISOString(),
                            level: 'error',
                            message: 'Test error message',
                            trace_id: 'trace-123',
                        },
                    ],
                }),
            });

            const response = await ingestLogs(request);
            expect(response.status).toBe(200);

            const body = await response.json();
            expect(body.data.accepted).toBe(2);
        });

        it('rejects without API key', async () => {
            const request = new NextRequest('http://localhost:3000/api/v1/logs/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    logs: [{ timestamp: new Date().toISOString(), level: 'info', message: 'test' }],
                }),
            });

            const response = await ingestLogs(request);
            expect(response.status).toBe(401);
        });

        it('rejects invalid API key', async () => {
            const request = new NextRequest('http://localhost:3000/api/v1/logs/ingest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': 'pol_invalid_key_12345678901234567890',
                },
                body: JSON.stringify({
                    logs: [{ timestamp: new Date().toISOString(), level: 'info', message: 'test' }],
                }),
            });

            const response = await ingestLogs(request);
            expect(response.status).toBe(401);
        });

        it('rejects too many logs in batch', async () => {
            const logs = Array.from({ length: 201 }, (_, i) => ({
                timestamp: new Date().toISOString(),
                level: 'info',
                message: `Log ${i}`,
            }));

            const request = new NextRequest('http://localhost:3000/api/v1/logs/ingest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': rawApiKeyA,
                },
                body: JSON.stringify({ logs }),
            });

            const response = await ingestLogs(request);
            expect(response.status).toBe(400);
        });
    });

    describe('Log Query', () => {
        it('returns logs for authenticated user', async () => {
            const request = authRequest('http://localhost:3000/api/logs/query', sessionAToken);

            const response = await queryLogs(request);
            expect(response.status).toBe(200);

            const body = await response.json();
            expect(body.data.logs.length).toBeGreaterThan(0);
        });

        it('filters by level', async () => {
            const request = authRequest(
                'http://localhost:3000/api/logs/query?level=error',
                sessionAToken
            );

            const response = await queryLogs(request);
            expect(response.status).toBe(200);

            const body = await response.json();
            body.data.logs.forEach((log: { level: string }) => {
                expect(log.level).toBe('error');
            });
        });
    });

    describe('Tenant Isolation', () => {
        it('user B cannot see org A logs', async () => {
            const request = authRequest('http://localhost:3000/api/logs/query', sessionBToken);

            const response = await queryLogs(request);
            expect(response.status).toBe(200);

            const body = await response.json();
            // User B should see no logs (they have no logs in org B)
            expect(body.data.logs.length).toBe(0);
        });
    });

    describe('Revoked Key', () => {
        it('revoked key cannot ingest', async () => {
            // Create a new key and revoke it
            const revokeKey = generateApiKey();
            const revokeHash = await hashApiKey(revokeKey);

            const keyResult = await sql`
        INSERT INTO api_keys (org_id, service_id, environment_id, key_hash)
        VALUES (${orgAId}, ${serviceAId}, ${envAId}, ${revokeHash})
        RETURNING id
      `;
            const revokeKeyId = keyResult.rows[0].id;

            // Revoke it
            await sql`UPDATE api_keys SET revoked_at = NOW() WHERE id = ${revokeKeyId}`;

            // Try to ingest
            const request = new NextRequest('http://localhost:3000/api/v1/logs/ingest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': revokeKey,
                },
                body: JSON.stringify({
                    logs: [{ timestamp: new Date().toISOString(), level: 'info', message: 'test' }],
                }),
            });

            const response = await ingestLogs(request);
            expect(response.status).toBe(401);
        });
    });

    describe('Rate Limiting', () => {
        it('returns 429 when rate limit exceeded', async () => {
            // Create a dedicated key for rate limit testing
            const rateKey = generateApiKey();
            const rateHash = await hashApiKey(rateKey);

            await sql`
        INSERT INTO api_keys (org_id, service_id, environment_id, key_hash)
        VALUES (${orgAId}, ${serviceAId}, ${envAId}, ${rateHash})
      `;

            // Pre-fill rate bucket to near limit (insert directly)
            const windowStart = new Date();
            windowStart.setSeconds(0, 0);

            // Get the key id
            const keyResult = await sql`
        SELECT id FROM api_keys WHERE key_hash = ${rateHash}
      `;
            const rateKeyId = keyResult.rows[0].id;

            // Insert bucket at limit
            await sql`
        INSERT INTO api_key_rate_buckets (api_key_id, window_start, count)
        VALUES (${rateKeyId}, ${windowStart.toISOString()}, 1200)
        ON CONFLICT (api_key_id, window_start) DO UPDATE SET count = 1200
      `;

            // Now try to ingest - should fail with 429
            const request = new NextRequest('http://localhost:3000/api/v1/logs/ingest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': rateKey,
                },
                body: JSON.stringify({
                    logs: [{ timestamp: new Date().toISOString(), level: 'info', message: 'rate test' }],
                }),
            });

            const response = await ingestLogs(request);
            expect(response.status).toBe(429);
        });
    });
});
