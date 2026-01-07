import { describe, it, expect, vi, beforeEach, afterEach, afterAll, beforeAll } from 'vitest';
import { POST } from '@/app/api/v1/notifications/process/route';
import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';

// Enforce CI check
if (process.env.CI && !process.env.POSTGRES_URL) {
    throw new Error('Critical: POSTGRES_URL missing in CI');
}

// Skip if no DB locally
const runTests = process.env.POSTGRES_URL ? describe : describe.skip;

// Mock Fetch ONLY (DB is real)
const mockFetch = vi.spyOn(global, 'fetch');

runTests('Notifications Processor API (Integration)', () => {
    let testOrgId: string;

    beforeAll(async () => {
        // Create test org
        const orgRes = await sql`
            INSERT INTO orgs (name) VALUES ('Test Org') RETURNING id
        `;
        testOrgId = orgRes.rows[0].id;
    });

    afterAll(async () => {
        if (testOrgId) {
            await sql`DELETE FROM orgs WHERE id = ${testOrgId}`;
        }
    });

    beforeEach(async () => {
        vi.clearAllMocks();
        process.env.INTERNAL_CRON_SECRET = 'test-secret';

        // Clear jobs for this org
        if (testOrgId) {
            await sql`DELETE FROM notification_jobs WHERE org_id = ${testOrgId}`;
        }
    });

    afterEach(() => {
        delete process.env.INTERNAL_CRON_SECRET;
    });

    const createRequest = () => {
        return new NextRequest('http://localhost:3000/api/v1/notifications/process', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer test-secret' }
        });
    };

    it('Returns 401 if unauthorized', async () => {
        const req = new NextRequest('http://localhost:3000/api/v1/notifications/process', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer wrong-secret' }
        });
        const res = await POST(req);
        expect(res.status).toBe(401);
    });

    it('Processes pending jobs and marks them sent on success', async () => {
        // Seed job
        const payload = {
            webhookUrl: 'https://discord.com/api/webhooks/xxx',
            event: 'incident.created',
            title: 'Test Incident'
        };

        const insertRes = await sql`
            INSERT INTO notification_jobs (org_id, type, payload_json, status, attempts, next_attempt_at)
            VALUES (${testOrgId}, 'discord', ${JSON.stringify(payload)}::jsonb, 'pending', 0, NOW() - INTERVAL '1 minute')
            RETURNING id
        `;
        const jobId = insertRes.rows[0].id;

        // Mock Webhook Success
        mockFetch.mockResolvedValue({ ok: true } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

        const res = await POST(createRequest());
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.data.processed).toBeGreaterThanOrEqual(1);

        // Verify DB update
        const jobCheck = await sql`SELECT status, attempts FROM notification_jobs WHERE id = ${jobId}`;
        expect(jobCheck.rows[0].status).toBe('sent');

        // Verify Webhook Call
        expect(mockFetch).toHaveBeenCalledWith(
            'https://discord.com/api/webhooks/xxx',
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('Test Incident')
            })
        );
    });

    it('Retries job on failure', async () => {
        const payload = { webhookUrl: 'https://hooks.slack.com/xxx' };

        const insertRes = await sql`
            INSERT INTO notification_jobs (org_id, type, payload_json, status, attempts, next_attempt_at)
            VALUES (${testOrgId}, 'slack', ${JSON.stringify(payload)}::jsonb, 'pending', 0, NOW() - INTERVAL '1 minute')
            RETURNING id
        `;
        const jobId = insertRes.rows[0].id;

        // Mock Webhook Failure
        mockFetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

        const res = await POST(createRequest());
        await res.json();

        expect(res.status).toBe(200);

        // Verify DB update (Pending retry)
        const jobCheck = await sql`SELECT status, attempts, next_attempt_at FROM notification_jobs WHERE id = ${jobId}`;
        expect(jobCheck.rows[0].status).toBe('pending');
        expect(jobCheck.rows[0].attempts).toBe(1);
        expect(new Date(jobCheck.rows[0].next_attempt_at).getTime()).toBeGreaterThan(Date.now());
    });
});
