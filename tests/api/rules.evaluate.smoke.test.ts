import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as evaluatePOST } from '@/app/api/v1/rules/evaluate/route';
import { sql } from '@/lib/db';
import crypto from 'crypto';

const skip = !process.env.POSTGRES_URL;
if (process.env.CI && skip) {
    throw new Error('Critical: POSTGRES_URL missing in CI.');
}

describe.skipIf(skip)('Rules Evaluator API', () => {
    let orgId: string;
    let serviceId: string;
    let envId: string;
    let logRuleId: string;
    let depRuleId: string;

    const SECRET = process.env.INTERNAL_CRON_SECRET || 'test-secret';

    beforeAll(async () => {
        orgId = crypto.randomUUID();
        await sql`INSERT INTO orgs (id, name, slug) VALUES (${orgId}, 'Eval Org', ${'eval-org-' + orgId})`;

        serviceId = crypto.randomUUID();
        await sql`INSERT INTO services (id, org_id, name) VALUES (${serviceId}, ${orgId}, 'Eval Svc')`;

        envId = crypto.randomUUID();
        await sql`INSERT INTO environments (id, service_id, name) VALUES (${envId}, ${serviceId}, 'prod')`;

        // Create Error Count Rule (Threshold 2)
        const res1 = await sql`
            INSERT INTO alert_rules (org_id, service_id, environment_id, name, type, params_json, severity, enabled)
            VALUES (${orgId}, ${serviceId}, ${envId}, 'Detect Errors', 'error_count', ${JSON.stringify({ threshold: 2, windowMinutes: 10 })}, 'high', true)
            RETURNING id
        `;
        logRuleId = res1.rows[0].id;

        // Create Deployment Failure Rule
        const res2 = await sql`
            INSERT INTO alert_rules (org_id, service_id, environment_id, name, type, params_json, severity, enabled)
            VALUES (${orgId}, ${serviceId}, ${envId}, 'Detect Bad Deploy', 'deployment_failure', '{}', 'high', true)
            RETURNING id
        `;
        depRuleId = res2.rows[0].id;
    });

    afterAll(async () => {
        await sql`DELETE FROM orgs WHERE id = ${orgId}`;
    });

    it('Detects Error Count threshold breach', async () => {
        // Seed 2 error logs
        await sql`INSERT INTO logs (org_id, service_id, environment_id, level, message, ts) VALUES (${orgId}, ${serviceId}, ${envId}, 'error', 'Error 1', NOW())`;
        await sql`INSERT INTO logs (org_id, service_id, environment_id, level, message, ts) VALUES (${orgId}, ${serviceId}, ${envId}, 'error', 'Error 2', NOW())`;

        const req = new NextRequest('http://localhost/api/v1/rules/evaluate', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${SECRET}` }
        });
        const res = await evaluatePOST(req);
        expect(res.status).toBe(200);
        const json = await res.json();

        // Find triggered rule
        const trigger = json.data.triggeredRules.find((r: any) => r.ruleId === logRuleId); // eslint-disable-line @typescript-eslint/no-explicit-any
        expect(trigger).toBeDefined();
        expect(trigger.context.count).toBeGreaterThanOrEqual(2);
    });

    it('Detects Deployment Failure', async () => {
        // Seed Failed Deployment
        await sql`
            INSERT INTO deployments (org_id, service_id, environment_id, status, commit_sha, created_at)
            VALUES (${orgId}, ${serviceId}, ${envId}, 'failure', 'badsha', NOW())
        `;

        const req = new NextRequest('http://localhost/api/v1/rules/evaluate', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${SECRET}` }
        });
        const res = await evaluatePOST(req);
        const json = await res.json();

        const trigger = json.data.triggeredRules.find((r: any) => r.ruleId === depRuleId); // eslint-disable-line @typescript-eslint/no-explicit-any
        expect(trigger).toBeDefined();
        expect(trigger.context.status).toBe('failure');
    });

    it('Rejects invalid secret', async () => {
        const req = new NextRequest('http://localhost/api/v1/rules/evaluate', {
            method: 'POST',
            headers: { 'Authorization': `Bearer wrong` }
        });
        const res = await evaluatePOST(req);
        expect(res.status).toBe(401);
    });
});
