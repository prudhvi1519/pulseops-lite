import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/v1/github/webhook/route';
import { sql } from '@/lib/db';
import crypto from 'crypto';

const skip = !process.env.POSTGRES_URL;

if (process.env.CI && skip) {
    throw new Error('Critical: POSTGRES_URL missing in CI. Tests cannot be skipped.');
}

describe.skipIf(skip)('GitHub Webhook Idempotency', () => {
    const SECRET = 'test-secret';
    process.env.GITHUB_WEBHOOK_SECRET = SECRET;

    // Setup Data
    let orgId: string;
    let serviceId: string;
    let envId: string;
    const repoOwner = 'test-owner-idempotency';
    const repoName = 'test-repo-' + crypto.randomUUID();
    const branch = 'main';

    beforeAll(async () => {
        orgId = crypto.randomUUID();
        await sql`INSERT INTO orgs (id, name, slug) VALUES (${orgId}, 'Idem Org', ${'idem-org-' + orgId})`;

        serviceId = crypto.randomUUID();
        await sql`INSERT INTO services (id, org_id, name) VALUES (${serviceId}, ${orgId}, 'Idem Svc')`;

        envId = crypto.randomUUID();
        await sql`INSERT INTO environments (id, service_id, name) VALUES (${envId}, ${serviceId}, 'prod')`;

        // Integration
        await sql`
            INSERT INTO service_github_integrations (service_id, repo_owner, repo_name, environment_mapping)
            VALUES (${serviceId}, ${repoOwner}, ${repoName}, ${JSON.stringify({ [branch]: 'prod' })})
        `;
    });

    afterAll(async () => {
        await sql`DELETE FROM orgs WHERE id = ${orgId}`;
    });

    function createRequest(payload: any, deliveryId: string) { // eslint-disable-line @typescript-eslint/no-explicit-any
        const body = JSON.stringify(payload);
        const hmac = crypto.createHmac('sha256', SECRET);
        hmac.update(body);
        const sig = `sha256=${hmac.digest('hex')}`;

        return new NextRequest('http://api/webhook', {
            method: 'POST',
            body: body,
            headers: {
                'X-Hub-Signature-256': sig,
                'X-GitHub-Delivery': deliveryId,
                'X-GitHub-Event': 'workflow_run',
                'Content-Type': 'application/json'
            }
        });
    }

    it('handles duplicate deliveries idempotently', async () => {
        const deliveryId = crypto.randomUUID();
        const payload = {
            workflow_run: {
                status: 'completed',
                conclusion: 'success',
                head_branch: branch,
                head_sha: 'sha123',
                html_url: `https://github.com/${repoOwner}/${repoName}/actions/runs/123`,
                run_started_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            repository: {
                owner: { login: repoOwner },
                name: repoName
            }
        };

        // 1. First Call
        const req1 = createRequest(payload, deliveryId);
        const res1 = await POST(req1);
        expect(res1.status).toBe(200);

        // Check Deployment
        const depCheck1 = await sql`SELECT count(*) FROM deployments WHERE org_id = ${orgId}`;
        expect(Number(depCheck1.rows[0].count)).toBe(1);

        // 2. Second Call (Duplicate)
        const req2 = createRequest(payload, deliveryId);
        const res2 = await POST(req2);
        expect(res2.status).toBe(200);
        const json2 = await res2.json();
        expect(json2.data.deduped).toBe(true);

        // Check Deployment Count (Should remain 1)
        const depCheck2 = await sql`SELECT count(*) FROM deployments WHERE org_id = ${orgId}`;
        expect(Number(depCheck2.rows[0].count)).toBe(1);
    });
});
