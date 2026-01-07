import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as queryGET } from '@/app/api/alerts/query/route';
import { GET as detailsGET, PATCH as detailsPATCH } from '@/app/api/alerts/[id]/route';
import { POST as createPOST } from '@/app/api/alerts/create/route';
import { sql } from '@/lib/db';
import crypto from 'crypto';

// Auth Mock
vi.mock('@/lib/auth/session', async () => {
    const actual = await vi.importActual('@/lib/auth/session');
    return {
        ...actual as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        getSessionFromCookies: vi.fn(),
    };
});
import { getSessionFromCookies } from '@/lib/auth/session';

const skip = !process.env.POSTGRES_URL;
if (process.env.CI && skip) {
    throw new Error('Critical: POSTGRES_URL missing in CI.');
}

describe.skipIf(skip)('Alert Rules API', () => {
    let devUserId: string;
    let viewerUserId: string;
    let orgAId: string;
    let orgBId: string;
    let ruleId: string;

    beforeAll(async () => {
        devUserId = crypto.randomUUID();
        viewerUserId = crypto.randomUUID();
        await sql`INSERT INTO users (id, email, name) VALUES (${devUserId}, 'al-dev@test.com', 'Dev')`;
        await sql`INSERT INTO users (id, email, name) VALUES (${viewerUserId}, 'al-view@test.com', 'Viewer')`;

        orgAId = crypto.randomUUID();
        orgBId = crypto.randomUUID();
        await sql`INSERT INTO orgs (id, name, slug) VALUES (${orgAId}, 'Alert Org A', ${'al-org-a-' + orgAId})`;
        await sql`INSERT INTO orgs (id, name, slug) VALUES (${orgBId}, 'Alert Org B', ${'al-org-b-' + orgBId})`;

        await sql`INSERT INTO org_members (org_id, user_id, role) VALUES (${orgAId}, ${devUserId}, 'developer')`;
        await sql`INSERT INTO org_members (org_id, user_id, role) VALUES (${orgAId}, ${viewerUserId}, 'viewer')`;
        await sql`INSERT INTO org_members (org_id, user_id, role) VALUES (${orgBId}, ${devUserId}, 'developer')`;
    });

    afterAll(async () => {
        await sql`DELETE FROM users WHERE id IN (${devUserId}, ${viewerUserId})`;
        await sql`DELETE FROM orgs WHERE id IN (${orgAId}, ${orgBId})`;
    });

    const mockSession = (userId: string, orgId: string) => {
        (getSessionFromCookies as any).mockResolvedValue({ // eslint-disable-line @typescript-eslint/no-explicit-any
            id: 'sess-test',
            userId,
            activeOrgId: orgId,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 100000)
        });
    };

    it('Developer can create rule', async () => {
        mockSession(devUserId, orgAId);
        const req = new NextRequest('http://localhost/api/alerts/create', {
            method: 'POST',
            body: JSON.stringify({
                name: 'High Error Rate',
                type: 'error_count',
                severity: 'high',
                params: { threshold: 50, windowMinutes: 10 },
                cooldownSeconds: 600
            })
        });
        const res = await createPOST(req);
        expect(res.status).toBe(201);
        const json = await res.json();
        ruleId = json.data.id;
        expect(ruleId).toBeDefined();
    });

    it('Viewer can list rules', async () => {
        mockSession(viewerUserId, orgAId);
        const req = new NextRequest('http://localhost/api/alerts/query?type=error_count');
        const res = await queryGET(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data.length).toBeGreaterThan(0);
        expect(json.data[0].name).toBe('High Error Rate');
    });

    it('Developer can update rule', async () => {
        mockSession(devUserId, orgAId);
        const req = new NextRequest(`http://localhost/api/alerts/${ruleId}`, {
            method: 'PATCH',
            body: JSON.stringify({ enabled: false })
        });
        const res = await detailsPATCH(req, { params: Promise.resolve({ id: ruleId }) });
        expect(res.status).toBe(200);

        // Verify update
        const check = await sql`SELECT enabled FROM alert_rules WHERE id = ${ruleId}`;
        expect(check.rows[0].enabled).toBe(false);
    });

    it('Org B cannot access Org A rule', async () => {
        mockSession(devUserId, orgBId); // Dev in Org B
        const req = new NextRequest(`http://localhost/api/alerts/${ruleId}`);
        const res = await detailsGET(req, { params: Promise.resolve({ id: ruleId }) });
        expect(res.status).toBe(404);
    });
});
