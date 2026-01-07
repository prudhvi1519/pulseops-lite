/**
 * Services and API Keys Tests
 * Tests for services, environments, API keys with RBAC and tenant isolation.
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
import { verifyApiKey } from '@/lib/keys/apiKey';

// Route imports
import { GET as getServices, POST as createService } from '@/app/api/services/route';
import { GET as getServiceDetail } from '@/app/api/services/[serviceId]/route';
import { POST as createEnv, GET as getEnvs } from '@/app/api/services/[serviceId]/environments/route';
import { POST as createKey, GET as getKeys } from '@/app/api/services/[serviceId]/keys/route';
import { POST as revokeKey } from '@/app/api/keys/[keyId]/revoke/route';

// Check if database is configured
const hasDatabase = !!process.env.POSTGRES_URL;
const isCI = !!process.env.CI;

// In CI, we MUST have a database
if (isCI && !hasDatabase) {
    throw new Error(
        'POSTGRES_URL is required in CI. Services-keys tests cannot be skipped in CI environment.'
    );
}

// Test data
const timestamp = Date.now();
const testDeveloper = {
    email: `dev-${timestamp}@example.com`,
    password: 'password123',
    name: 'Test Developer',
};
const testViewer = {
    email: `viewer-${timestamp}@example.com`,
    password: 'password456',
    name: 'Test Viewer',
};

let orgId: string;
let developerUserId: string;
let viewerUserId: string;
let developerSession: string;
let viewerSession: string;
let createdServiceId: string;
let createdEnvId: string;
let createdKeyId: string;
let rawApiKey: string;

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

describe.skipIf(!hasDatabase)('Services and API Keys', () => {
    beforeAll(async () => {
        // Create org
        const orgResult = await sql`
      INSERT INTO orgs (name)
      VALUES ('Test Org Services')
      RETURNING id
    `;
        orgId = orgResult.rows[0].id;

        // Create developer user
        const devHash = await hashPassword(testDeveloper.password);
        const devResult = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${testDeveloper.email}, ${testDeveloper.name}, ${devHash})
      RETURNING id
    `;
        developerUserId = devResult.rows[0].id;

        await sql`
      INSERT INTO org_members (org_id, user_id, role)
      VALUES (${orgId}, ${developerUserId}, 'developer')
    `;

        const devSession = await createSession(developerUserId, orgId);
        developerSession = devSession.token;

        // Create viewer user
        const viewerHash = await hashPassword(testViewer.password);
        const viewerResult = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${testViewer.email}, ${testViewer.name}, ${viewerHash})
      RETURNING id
    `;
        viewerUserId = viewerResult.rows[0].id;

        await sql`
      INSERT INTO org_members (org_id, user_id, role)
      VALUES (${orgId}, ${viewerUserId}, 'viewer')
    `;

        const viewerSessionResult = await createSession(viewerUserId, orgId);
        viewerSession = viewerSessionResult.token;
    });

    afterAll(async () => {
        // Clean up
        await sql`DELETE FROM users WHERE id IN (${developerUserId}, ${viewerUserId})`;
        await sql`DELETE FROM orgs WHERE id = ${orgId}`;
    });

    describe('RBAC - Service Creation', () => {
        it('developer can create service', async () => {
            const request = authRequest(
                'http://localhost:3000/api/services',
                developerSession,
                {
                    method: 'POST',
                    body: JSON.stringify({ name: 'My Test Service', description: 'A test service' }),
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            const response = await createService(request);
            expect(response.status).toBe(201);

            const body = await response.json();
            expect(body.data.service.name).toBe('My Test Service');
            createdServiceId = body.data.service.id;
        });

        it('viewer cannot create service (403)', async () => {
            const request = authRequest(
                'http://localhost:3000/api/services',
                viewerSession,
                {
                    method: 'POST',
                    body: JSON.stringify({ name: 'Viewer Service' }),
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            const response = await createService(request);
            expect(response.status).toBe(403);
        });
    });

    describe('Service Listing', () => {
        it('developer can list services', async () => {
            const request = authRequest(
                'http://localhost:3000/api/services',
                developerSession
            );

            const response = await getServices(request);
            expect(response.status).toBe(200);

            const body = await response.json();
            expect(body.data.services.length).toBeGreaterThan(0);
        });

        it('viewer can list services', async () => {
            const request = authRequest(
                'http://localhost:3000/api/services',
                viewerSession
            );

            const response = await getServices(request);
            expect(response.status).toBe(200);
        });
    });

    describe('RBAC - Environment Creation', () => {
        it('developer can create environment', async () => {
            const request = authRequest(
                `http://localhost:3000/api/services/${createdServiceId}/environments`,
                developerSession,
                {
                    method: 'POST',
                    body: JSON.stringify({ name: 'production' }),
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            const response = await createEnv(request);
            expect(response.status).toBe(201);

            const body = await response.json();
            createdEnvId = body.data.environment.id;
        });

        it('viewer cannot create environment (403)', async () => {
            const request = authRequest(
                `http://localhost:3000/api/services/${createdServiceId}/environments`,
                viewerSession,
                {
                    method: 'POST',
                    body: JSON.stringify({ name: 'staging' }),
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            const response = await createEnv(request);
            expect(response.status).toBe(403);
        });
    });

    describe('API Key Creation and Verification', () => {
        it('developer can create API key', async () => {
            const request = authRequest(
                `http://localhost:3000/api/services/${createdServiceId}/keys`,
                developerSession,
                {
                    method: 'POST',
                    body: JSON.stringify({ environmentId: createdEnvId }),
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            const response = await createKey(request);
            expect(response.status).toBe(201);

            const body = await response.json();
            expect(body.data.key.rawKey).toBeDefined();
            expect(body.data.key.rawKey).toMatch(/^pol_/);
            expect(body.data.warning).toContain('Save this key');

            rawApiKey = body.data.key.rawKey;
            createdKeyId = body.data.key.id;
        });

        it('key listing shows masked key, not raw', async () => {
            const request = authRequest(
                `http://localhost:3000/api/services/${createdServiceId}/keys`,
                developerSession
            );

            const response = await getKeys(request);
            expect(response.status).toBe(200);

            const body = await response.json();
            const key = body.data.keys.find((k: { id: string }) => k.id === createdKeyId);
            expect(key).toBeDefined();
            // Should show masked format, not the raw key
            expect(key.maskedKey).toContain('•');
            expect(key.maskedKey).not.toBe(rawApiKey);
        });

        it('raw key can be verified', async () => {
            const result = await verifyApiKey(rawApiKey);
            expect(result).not.toBeNull();
            expect(result?.serviceId).toBe(createdServiceId);
            expect(result?.environmentId).toBe(createdEnvId);
        });
    });

    describe('API Key Revocation', () => {
        it('developer can revoke key', async () => {
            const request = authRequest(
                `http://localhost:3000/api/keys/${createdKeyId}/revoke`,
                developerSession,
                { method: 'POST' }
            );

            const response = await revokeKey(request);
            expect(response.status).toBe(200);
        });

        it('revoked key fails verification', async () => {
            const result = await verifyApiKey(rawApiKey);
            expect(result).toBeNull();
        });
    });

    describe('Cross-Tenant Isolation', () => {
        let otherOrgId: string;
        let otherUserId: string;
        let otherSession: string;

        beforeAll(async () => {
            // Create another org with a user
            const orgResult = await sql`
        INSERT INTO orgs (name) VALUES ('Other Org') RETURNING id
      `;
            otherOrgId = orgResult.rows[0].id;

            const hash = await hashPassword('password');
            const userResult = await sql`
        INSERT INTO users (email, name, password_hash)
        VALUES ('other-${timestamp}@example.com', 'Other User', ${hash})
        RETURNING id
      `;
            otherUserId = userResult.rows[0].id;

            await sql`
        INSERT INTO org_members (org_id, user_id, role)
        VALUES (${otherOrgId}, ${otherUserId}, 'admin')
      `;

            const session = await createSession(otherUserId, otherOrgId);
            otherSession = session.token;
        });

        afterAll(async () => {
            await sql`DELETE FROM users WHERE id = ${otherUserId}`;
            await sql`DELETE FROM orgs WHERE id = ${otherOrgId}`;
        });

        it('cannot access other org service (404)', async () => {
            const request = authRequest(
                `http://localhost:3000/api/services/${createdServiceId}`,
                otherSession
            );

            const response = await getServiceDetail(request);
            expect(response.status).toBe(404);
        });

        it('cannot list other org environments (404)', async () => {
            const request = authRequest(
                `http://localhost:3000/api/services/${createdServiceId}/environments`,
                otherSession
            );

            const response = await getEnvs(request);
            expect(response.status).toBe(404);
        });
    });
});
