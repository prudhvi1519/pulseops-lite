import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/internal/logs/cleanup/route';
import { sql } from '@/lib/db';

// Skip if DB not available
const skip = !process.env.POSTGRES_URL;

describe.skipIf(skip)('Logs Cleanup API', () => {
    let orgId: string;
    let serviceId: string;
    let envId: string;
    const SECRET = 'test-secret';

    beforeAll(async () => {
        process.env.INTERNAL_CRON_SECRET = SECRET;

        // Setup Org, Service, Env
        orgId = crypto.randomUUID();
        await sql`INSERT INTO orgs (id, name, slug) VALUES (${orgId}, 'Cleanup Test Org', ${'cleanup-org-' + crypto.randomUUID()})`;

        serviceId = crypto.randomUUID();
        // default retention 7 days
        await sql`
            INSERT INTO services (id, org_id, name, retention_days) 
            VALUES (${serviceId}, ${orgId}, 'Cleanup Svc', 7)
        `;

        envId = crypto.randomUUID();
        await sql`INSERT INTO environments (id, service_id, name) VALUES (${envId}, ${serviceId}, 'prod')`;
    });

    afterAll(async () => {
        await sql`DELETE FROM orgs WHERE id = ${orgId}`;
    });

    it('returns 401 if secret header is missing or invalid', async () => {
        const req1 = new NextRequest('http://api/logs/cleanup', { method: 'POST' });
        const res1 = await POST(req1);
        expect(res1.status).toBe(401);

        const req2 = new NextRequest('http://api/logs/cleanup', {
            method: 'POST',
            headers: { 'x-internal-cron-secret': 'wrong' }
        });
        const res2 = await POST(req2);
        expect(res2.status).toBe(401);
    });

    it('deletes old logs and keeps new logs', async () => {
        // Insert Old Log (8 days ago)
        const oldLogId = crypto.randomUUID();
        await sql`
            INSERT INTO logs (id, org_id, service_id, environment_id, ts, level, message, meta_json)
            VALUES (${oldLogId}, ${orgId}, ${serviceId}, ${envId}, NOW() - INTERVAL '8 days', 'info', 'Old Log', '{}')
        `;

        // Insert New Log (1 day ago)
        const newLogId = crypto.randomUUID();
        await sql`
            INSERT INTO logs (id, org_id, service_id, environment_id, ts, level, message, meta_json)
            VALUES (${newLogId}, ${orgId}, ${serviceId}, ${envId}, NOW() - INTERVAL '1 day', 'info', 'New Log', '{}')
        `;

        // Call Cleanup
        const req = new NextRequest('http://api/logs/cleanup', {
            method: 'POST',
            headers: { 'x-internal-cron-secret': SECRET }
        });
        const res = await POST(req);
        expect(res.status).toBe(200);

        const json = await res.json();
        // Should have deleted at least 1 log
        expect(json.data.deleted).toBeGreaterThanOrEqual(1);

        // Verify Old Log Gone
        const oldCheck = await sql`SELECT id FROM logs WHERE id = ${oldLogId}`;
        expect(oldCheck.rowCount).toBe(0);

        // Verify New Log Exists
        const newCheck = await sql`SELECT id FROM logs WHERE id = ${newLogId}`;
        expect(newCheck.rowCount).toBe(1);
    });
});
