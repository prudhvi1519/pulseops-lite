/**
 * Log Query Smoke Tests
 * Verifies the query endpoint with filters, hybrid search, and strict isolation.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { GET as queryLogs } from '@/app/api/logs/query/route';

const hasDatabase = !!process.env.POSTGRES_URL;

function authRequest(url: string, token: string) {
    const req = new NextRequest(url);
    req.headers.set('cookie', `pulseops_session=${token}`);
    return req;
}

describe.skipIf(!hasDatabase)('Log Query Smoke Tests', () => {
    let orgAId: string;
    let orgBId: string;
    let userAId: string;
    let sessionAToken: string;
    let serviceAId: string;
    let envAId: string;

    const timestamp = Date.now();

    beforeAll(async () => {
        // 1. Create Org A
        const orgARes = await sql`INSERT INTO orgs (name) VALUES ('Query Test Org A') RETURNING id`;
        orgAId = orgARes.rows[0].id;

        // 2. Create User A (Member of A)
        const hash = await hashPassword('password');
        const userRes = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${`query-a-${timestamp}@example.com`}, 'Query User A', ${hash})
      RETURNING id
    `;
        userAId = userRes.rows[0].id;

        await sql`
      INSERT INTO org_members (org_id, user_id, role)
      VALUES (${orgAId}, ${userAId}, 'viewer')
    `;

        const sessionA = await createSession(userAId, orgAId);
        sessionAToken = sessionA.token;

        // 3. Create Org B
        const orgBRes = await sql`INSERT INTO orgs (name) VALUES ('Query Test Org B') RETURNING id`;
        orgBId = orgBRes.rows[0].id;

        // 4. Create Service/Env for A
        const svcA = await sql`INSERT INTO services (org_id, name, created_by) VALUES (${orgAId}, 'Svc A', ${userAId}) RETURNING id`;
        serviceAId = svcA.rows[0].id;

        const envA = await sql`INSERT INTO environments (service_id, name) VALUES (${serviceAId}, 'prod') RETURNING id`;
        envAId = envA.rows[0].id;

        // 5. Insert Logs
        // Log for A with "file:///"
        await sql`
      INSERT INTO logs (org_id, service_id, environment_id, ts, level, message, created_at)
      VALUES (${orgAId}, ${serviceAId}, ${envAId}, NOW(), 'error', 'Error reading file:///etc/hosts', NOW())
    `;

        // Log for A (plain)
        await sql`
      INSERT INTO logs (org_id, service_id, environment_id, ts, level, message, created_at)
      VALUES (${orgAId}, ${serviceAId}, ${envAId}, NOW() - INTERVAL '1 hour', 'info', 'Normal log', NOW())
    `;

        // Log for B
        const svcB = await sql`INSERT INTO services (org_id, name, created_by) VALUES (${orgBId}, 'Svc B', ${userAId}) RETURNING id`; // User A created it but for Org B? Wait, constraint fk?
        // User A might not be member of B. 'created_by' is just reference.
        const serviceBId = svcB.rows[0].id;
        const envB = await sql`INSERT INTO environments (service_id, name) VALUES (${serviceBId}, 'prod') RETURNING id`;
        const envBId = envB.rows[0].id;

        await sql`
      INSERT INTO logs (org_id, service_id, environment_id, ts, level, message, created_at)
      VALUES (${orgBId}, ${serviceBId}, ${envBId}, NOW(), 'error', 'Secret Org B Log', NOW())
    `;
    });

    afterAll(async () => {
        if (orgAId) await sql`DELETE FROM orgs WHERE id = ${orgAId}`;
        if (orgBId) await sql`DELETE FROM orgs WHERE id = ${orgBId}`;
        if (userAId) await sql`DELETE FROM users WHERE id = ${userAId}`;
    });

    it('filters by org (isolation)', async () => {
        const req = authRequest('http://localhost/api/logs/query', sessionAToken);
        const res = await queryLogs(req);
        expect(res.status).toBe(200);
        const body = await res.json();

        // Should see Org A logs, but NOT Org B logs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const messages = body.data.map((l: any) => l.message);
        expect(messages).toContain('Error reading file:///etc/hosts');
        expect(messages).not.toContain('Secret Org B Log');
    });

    it('supports keyword search with special chars (file:///)', async () => {
        const url = new URL('http://localhost/api/logs/query');
        url.searchParams.set('q', 'file:///');

        const req = authRequest(url.toString(), sessionAToken);
        const res = await queryLogs(req);
        const body = await res.json();

        expect(body.data).toHaveLength(1);
        expect(body.data[0].message).toContain('file:///etc/hosts');
    });

    it('supports cursor pagination', async () => {
        // We have 2 logs for Org A. Limit 1 should give cursor.
        const url = new URL('http://localhost/api/logs/query');
        url.searchParams.set('limit', '1');

        const req = authRequest(url.toString(), sessionAToken);
        const res = await queryLogs(req);
        const body = await res.json();

        expect(body.data).toHaveLength(1);
        expect(body.meta.nextCursor).toBeTruthy();

        // Fetch next page
        url.searchParams.set('cursor', body.meta.nextCursor);
        const req2 = authRequest(url.toString(), sessionAToken);
        const res2 = await queryLogs(req2);
        const body2 = await res2.json();

        expect(body2.data).toHaveLength(1);
        expect(body2.data[0].message).toBe('Normal log'); // Older log
    });
});
