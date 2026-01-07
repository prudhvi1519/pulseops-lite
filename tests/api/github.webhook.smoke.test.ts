import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/v1/github/webhook/route';
import { sql } from '@/lib/db';
import crypto from 'crypto';

const skip = !process.env.POSTGRES_URL;

if (process.env.CI && skip) {
    throw new Error('Critical: POSTGRES_URL missing in CI. Tests cannot be skipped.');
}

describe.skipIf(skip)('GitHub Webhook API', () => {
    let orgId: string;
    let serviceId: string;
    let envId: string;
    const SECRET = 'test-webhook-secret';

    // Setup Data
    const repoOwner = 'test-owner';
    const repoName = 'test-repo-' + crypto.randomUUID();
    const branch = 'main';

    beforeAll(async () => {
        process.env.GITHUB_WEBHOOK_SECRET = SECRET;

        orgId = crypto.randomUUID();
        await sql`INSERT INTO orgs (id, name, slug) VALUES (${orgId}, 'Webhook Org', ${'webhook-org-' + orgId})`;

        serviceId = crypto.randomUUID();
        await sql`INSERT INTO services (id, org_id, name) VALUES (${serviceId}, ${orgId}, 'Webhook Svc')`;

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
        // Cascade deletes services, envs, integrations
    });

    function createRequest(payload: any, secret: string = SECRET, deliveryId: string = crypto.randomUUID(), event: string = 'workflow_run') { // eslint-disable-line @typescript-eslint/no-explicit-any
        const body = JSON.stringify(payload);
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(body);
        const sig = `sha256=${hmac.digest('hex')}`;

        return new NextRequest('http://api/webhook', {
            method: 'POST',
            body: body,
            headers: {
                'X-Hub-Signature-256': sig,
                'X-GitHub-Delivery': deliveryId,
                'X-GitHub-Event': event,
                'Content-Type': 'application/json'
            }
        });
    }

    it('rejects invalid signature', async () => {
        const req = createRequest({}, 'wrong-secret');
        const res = await POST(req);
        expect(res.status).toBe(401);
    });

    it('processes workflow_run and creates deployment', async () => {
        const deliveryId = crypto.randomUUID();
        const payload = {
            workflow_run: {
                status: 'completed',
                conclusion: 'success',
                head_branch: branch,
                head_sha: 'sha123',
                head_commit: { message: 'feat: new thing' },
                actor: { login: 'tester' },
                html_url: `https://github.com/${repoOwner}/${repoName}/actions/runs/123`,
                run_started_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            repository: {
                owner: { login: repoOwner },
                name: repoName,
                full_name: `${repoOwner}/${repoName}`
            }
        };

        const req = createRequest(payload, SECRET, deliveryId);
        const res = await POST(req);

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data.ok).toBe(true);
        expect(json.data.deduped).toBeUndefined(); // First time

        // Verify Record
        const depCheck = await sql`
            SELECT * FROM deployments 
            WHERE org_id = ${orgId} AND service_id = ${serviceId}
        `;
        expect(depCheck.rowCount).toBe(1);
        expect(depCheck.rows[0].status).toBe('success');
        expect(depCheck.rows[0].commit_sha).toBe('sha123');
    });

    it('deduplicates same delivery id', async () => {
        const deliveryId = crypto.randomUUID();
        const payload = {
            workflow_run: {
                // ... same payload structure necessary to pass validation?
                // actually dedupe happens BEFORE parsing event if relying on headers/body hash?
                // code checks delivery_id first.
                status: 'completed'
            }
        };
        // We need valid body for signature

        // 1. First Call
        const req1 = createRequest(payload, SECRET, deliveryId);
        const res1 = await POST(req1);
        expect(res1.status).toBe(200);

        // 2. Second Call
        const req2 = createRequest(payload, SECRET, deliveryId);
        const res2 = await POST(req2);
        expect(res2.status).toBe(200);
        const json = await res2.json();
        expect(json.data.deduped).toBe(true);

        // Verify webhook_deliveries count for this id
        const delCheck = await sql`
            SELECT * FROM webhook_deliveries WHERE delivery_id = ${deliveryId}
        `;
        expect(delCheck.rowCount).toBe(1);
    });
});
