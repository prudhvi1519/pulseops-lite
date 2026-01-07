/**
 * Log Ingestion Smoke Tests
 * Verifies the ingestion endpoint works end-to-end with Postgres.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { generateApiKey, hashApiKey } from '@/lib/keys/apiKey';
import { POST as ingestLogs } from '@/app/api/v1/logs/ingest/route';

const hasDatabase = !!process.env.POSTGRES_URL;

describe.skipIf(!hasDatabase)('Log Ingestion Smoke Tests', () => {
    let orgId: string;
    let userId: string;
    let serviceId: string;
    let envId: string;
    let apiKeyId: string;
    let rawApiKey: string;

    const timestamp = Date.now();

    beforeAll(async () => {
        // 1. Create Org
        const orgRes = await sql`
      INSERT INTO orgs (name) VALUES ('Ingest Smoke Test Org') RETURNING id
    `;
        orgId = orgRes.rows[0].id;

        // 2. Create User
        const hash = await hashPassword('password');
        const userRes = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${`ingest-${timestamp}@example.com`}, 'Ingest User', ${hash})
      RETURNING id
    `;
        userId = userRes.rows[0].id;

        // 3. Create Service
        const svcRes = await sql`
      INSERT INTO services (org_id, name, created_by)
      VALUES (${orgId}, 'Ingest Service', ${userId})
      RETURNING id
    `;
        serviceId = svcRes.rows[0].id;

        // 4. Create Environment
        const envRes = await sql`
      INSERT INTO environments (service_id, name)
      VALUES (${serviceId}, 'prod')
      RETURNING id
    `;
        envId = envRes.rows[0].id;

        // 5. Create API Key
        rawApiKey = generateApiKey();
        const keyHash = await hashApiKey(rawApiKey);
        const keyRes = await sql`
      INSERT INTO api_keys (org_id, service_id, environment_id, key_hash)
      VALUES (${orgId}, ${serviceId}, ${envId}, ${keyHash})
      RETURNING id
    `;
        apiKeyId = keyRes.rows[0].id;
    });

    afterAll(async () => {
        // Clean up org (cascades to everything)
        if (orgId) {
            await sql`DELETE FROM orgs WHERE id = ${orgId}`;
        }
        if (userId) {
            await sql`DELETE FROM users WHERE id = ${userId}`;
        }
    });

    it('accepts valid logs with API key', async () => {
        const request = new NextRequest('http://localhost/api/v1/logs/ingest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': rawApiKey,
            },
            body: JSON.stringify({
                logs: [
                    { timestamp: new Date().toISOString(), level: 'info', message: 'Hello World' },
                    { timestamp: new Date().toISOString(), level: 'error', message: 'Something broke' }
                ]
            })
        });

        const response = await ingestLogs(request);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.data.accepted).toBe(2);
    });

    it('rejects missing API key', async () => {
        const request = new NextRequest('http://localhost/api/v1/logs/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logs: [] })
        });

        const response = await ingestLogs(request);
        expect(response.status).toBe(401);
    });

    it('rejects batch too large (>200)', async () => {
        const logs = Array.from({ length: 201 }, () => ({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'x'
        }));

        const request = new NextRequest('http://localhost/api/v1/logs/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': rawApiKey },
            body: JSON.stringify({ logs })
        });

        const response = await ingestLogs(request);
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects revoked API key', async () => {
        // Revoke key
        await sql`UPDATE api_keys SET revoked_at = NOW() WHERE id = ${apiKeyId}`;

        const request = new NextRequest('http://localhost/api/v1/logs/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': rawApiKey },
            body: JSON.stringify({
                logs: [{ timestamp: new Date().toISOString(), level: 'info', message: 'revoked' }]
            })
        });

        const response = await ingestLogs(request);
        expect(response.status).toBe(403);

        // Unrevoke for further tests if needed (or create new key)
        // We'll create a new key for rate limit test below
    });

    it('enforces rate limit', async () => {
        // Create fresh key
        const newRateKey = generateApiKey();
        const newHash = await hashApiKey(newRateKey);
        const kRes = await sql`
      INSERT INTO api_keys (org_id, service_id, environment_id, key_hash)
      VALUES (${orgId}, ${serviceId}, ${envId}, ${newHash})
      RETURNING id
    `;
        const rateKeyId = kRes.rows[0].id;

        // Pre-fill bucket to limit (1200)
        const windowStart = new Date();
        windowStart.setSeconds(0, 0);
        windowStart.setMilliseconds(0); // align with route logic

        await sql`
      INSERT INTO api_key_rate_buckets (api_key_id, window_start, count)
      VALUES (${rateKeyId}, ${windowStart.toISOString()}, 1200)
    `;

        // Try to ingest 1 log -> total 1201 -> REJECT
        const request = new NextRequest('http://localhost/api/v1/logs/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': newRateKey },
            body: JSON.stringify({
                logs: [{ timestamp: new Date().toISOString(), level: 'info', message: 'overflow' }]
            })
        });

        const response = await ingestLogs(request);
        expect(response.status).toBe(429);
    });
});
