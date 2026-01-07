// tests/api/alerts.to.incidents.smoke.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as evaluatePOST } from '@/app/api/v1/rules/evaluate/route';
import { sql } from '@/lib/db';
import crypto from 'crypto';

const skip = !process.env.POSTGRES_URL;
if (process.env.CI && skip) {
    throw new Error('Critical: POSTGRES_URL missing in CI.');
}

describe.skipIf(skip)('Alerts to Incidents Logic', () => {
    let orgId: string;
    let serviceId: string;
    let envId: string;
    let ruleId: string;
    const SECRET = process.env.INTERNAL_CRON_SECRET || 'super-secret-cron-key';

    beforeAll(async () => {
        orgId = crypto.randomUUID();
        await sql`INSERT INTO orgs (id, name, slug) VALUES (${orgId}, 'A2I Org', ${'a2i-org-' + orgId})`;
        serviceId = crypto.randomUUID();
        await sql`INSERT INTO services (id, org_id, name) VALUES (${serviceId}, ${orgId}, 'A2I Svc')`;
        envId = crypto.randomUUID();
        await sql`INSERT INTO environments (id, service_id, name) VALUES (${envId}, ${serviceId}, 'prod')`;

        // Create Rule
        const res = await sql`
            INSERT INTO alert_rules (org_id, service_id, environment_id, name, type, params_json, severity, enabled, cooldown_seconds)
            VALUES (${orgId}, ${serviceId}, ${envId}, 'Error Storm', 'error_count', ${JSON.stringify({ threshold: 1, windowMinutes: 10 })}, 'high', true, 60)
            RETURNING id
        `;
        ruleId = res.rows[0].id;
    });

    afterAll(async () => {
        await sql`DELETE FROM orgs WHERE id = ${orgId}`;
    });

    it('Run 1: Creates Incident on Trigger', async () => {
        // Seed Log
        await sql`INSERT INTO logs (org_id, service_id, environment_id, level, message, ts) VALUES (${orgId}, ${serviceId}, ${envId}, 'error', 'Fail 1', NOW())`;

        const req = new NextRequest('http://localhost/api/v1/rules/evaluate', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${SECRET}` }
        });
        const res = await evaluatePOST(req);
        const json = await res.json();

        expect(json.data.incidentsCreated).toBe(1);
        expect(json.data.incidentsUpdated).toBe(0);

        // Verify Incident
        const incident = await sql`SELECT * FROM incidents WHERE rule_id = ${ruleId}`;
        expect(incident.rows.length).toBe(1);
        expect(incident.rows[0].status).toBe('open');
        expect(incident.rows[0].fingerprint).toContain('error_count');

        // Verify Event
        const events = await sql`SELECT * FROM incident_events WHERE incident_id = ${incident.rows[0].id}`;
        expect(events.rows.length).toBe(1);
        expect(events.rows[0].type).toBe('created');
    });

    it('Run 2: Dedupes (Updates existing incident)', async () => {
        // Already triggered. Run again.
        const req = new NextRequest('http://localhost/api/v1/rules/evaluate', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${SECRET}` }
        });
        const res = await evaluatePOST(req);
        const json = await res.json();

        expect(json.data.incidentsCreated).toBe(0);
        expect(json.data.incidentsUpdated).toBe(1);

        const incident = await sql`SELECT id FROM incidents WHERE rule_id = ${ruleId}`;
        const events = await sql`SELECT * FROM incident_events WHERE incident_id = ${incident.rows[0].id}`;
        expect(events.rows.length).toBe(2);
        expect(events.rows[1].type).toBe('trigger');
    });

    it('Run 3: Cooldown logic after resolution', async () => {
        // 1. Resolve the incident
        await sql`UPDATE incidents SET status = 'resolved', resolved_at = NOW() WHERE rule_id = ${ruleId}`;

        // 2. Run Evaluator (Trigger still active due to log window)
        // Cooldown is 60s. last_notified_at was just set ~seconds ago.
        // Should NOT create new incident.
        const req1 = new NextRequest('http://localhost/api/v1/rules/evaluate', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${SECRET}` }
        });
        const res1 = await evaluatePOST(req1);
        const json1 = await res1.json();
        expect(json1.data.incidentsCreated).toBe(0); // Cooldown active

        // 3. Force expire cooldown (backdate last_notified_at)
        await sql`UPDATE alert_firings SET last_notified_at = NOW() - INTERVAL '2 minutes' WHERE rule_id = ${ruleId}`;

        // 4. Run Evaluator Again
        const req2 = new NextRequest('http://localhost/api/v1/rules/evaluate', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${SECRET}` }
        });
        const res2 = await evaluatePOST(req2);
        const json2 = await res2.json();
        expect(json2.data.incidentsCreated).toBe(1);

        const incidents = await sql`SELECT id FROM incidents WHERE rule_id = ${ruleId}`;
        expect(incidents.rows.length).toBe(2); // 1 resolved + 1 new open
    });
});
