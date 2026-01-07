import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as queryGET } from '@/app/api/incidents/query/route';
import { GET as detailsGET, PATCH as detailsPATCH } from '@/app/api/incidents/[id]/route';
import { POST as createPOST } from '@/app/api/incidents/create/route';
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

describe.skipIf(skip)('Incidents API', () => {
    let orgAId: string;
    let orgBId: string;
    let serviceAId: string;
    let envAId: string;
    let serviceBId: string;
    let envBId: string;
    let devUserId: string;
    let viewerUserId: string;
    let incidentId: string;

    beforeAll(async () => {
        // Setup Users
        devUserId = crypto.randomUUID();
        viewerUserId = crypto.randomUUID();
        await sql`INSERT INTO users (id, email, name) VALUES (${devUserId}, 'dev@test.com', 'Dev')`;
        await sql`INSERT INTO users (id, email, name) VALUES (${viewerUserId}, 'view@test.com', 'Viewer')`;

        // Setup Orgs
        orgAId = crypto.randomUUID();
        orgBId = crypto.randomUUID();
        await sql`INSERT INTO orgs (id, name, slug) VALUES (${orgAId}, 'Org A', ${'org-a-' + orgAId})`;
        await sql`INSERT INTO orgs (id, name, slug) VALUES (${orgBId}, 'Org B', ${'org-b-' + orgBId})`;

        // Memberships (Org A)
        await sql`INSERT INTO org_members (org_id, user_id, role) VALUES (${orgAId}, ${devUserId}, 'developer')`;
        await sql`INSERT INTO org_members (org_id, user_id, role) VALUES (${orgAId}, ${viewerUserId}, 'viewer')`;

        // Memberships (Org B) - Viewer only
        await sql`INSERT INTO org_members (org_id, user_id, role) VALUES (${orgBId}, ${viewerUserId}, 'viewer')`;

        // Assets
        serviceAId = crypto.randomUUID();
        await sql`INSERT INTO services (id, org_id, name) VALUES (${serviceAId}, ${orgAId}, 'Svc A')`;
        envAId = crypto.randomUUID();
        await sql`INSERT INTO environments (id, service_id, name) VALUES (${envAId}, ${serviceAId}, 'prod')`;

        serviceBId = crypto.randomUUID();
        await sql`INSERT INTO services (id, org_id, name) VALUES (${serviceBId}, ${orgBId}, 'Svc B')`;
        envBId = crypto.randomUUID();
        await sql`INSERT INTO environments (id, service_id, name) VALUES (${envBId}, ${serviceBId}, 'prod')`;
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

    it('Developer can create incident', async () => {
        mockSession(devUserId, orgAId);
        const req = new NextRequest('http://api/incidents/create', {
            method: 'POST',
            body: JSON.stringify({
                serviceId: serviceAId,
                environmentId: envAId,
                title: 'Test Incident',
                description: 'Something broke',
                severity: 'high'
            })
        });
        const res = await createPOST(req);
        expect(res.status).toBe(201);
        const json = await res.json();
        incidentId = json.data.id;
        expect(incidentId).toBeDefined();
    });

    it('Viewer can get incident details', async () => {
        mockSession(viewerUserId, orgAId);
        const req = new NextRequest(`http://api/incidents/${incidentId}`);
        const res = await detailsGET(req, { params: Promise.resolve({ id: incidentId }) });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data.title).toBe('Test Incident');
        expect(json.data.events.length).toBeGreaterThan(0); // Created event
    });

    it('Viewer can query list', async () => {
        mockSession(viewerUserId, orgAId);
        const req = new NextRequest('http://api/incidents/query?severity=high');
        const res = await queryGET(req);
        const json = await res.json();
        expect(json.data.some((i: any) => i.id === incidentId)).toBe(true); // eslint-disable-line @typescript-eslint/no-explicit-any
    });

    it('Developer can resolve incident', async () => {
        mockSession(devUserId, orgAId);
        const req = new NextRequest(`http://api/incidents/${incidentId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'resolved' })
        });
        const res = await detailsPATCH(req, { params: Promise.resolve({ id: incidentId }) });
        expect(res.status).toBe(200);

        // Verify resolved_at set
        const check = await sql`SELECT status, resolved_at FROM incidents WHERE id = ${incidentId}`;
        expect(check.rows[0].status).toBe('resolved');
        expect(check.rows[0].resolved_at).not.toBeNull();
    });

    it('Org B cannot access Org A incident', async () => {
        mockSession(viewerUserId, orgBId);
        const req = new NextRequest(`http://api/incidents/${incidentId}`);
        const res = await detailsGET(req, { params: Promise.resolve({ id: incidentId }) });
        expect(res.status).toBe(404); // Not found in this org scope
    });
});
