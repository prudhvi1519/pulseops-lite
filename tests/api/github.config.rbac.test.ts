import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/services/[serviceId]/github/route';
import { sql } from '@/lib/db';
import crypto from 'crypto';

// Types for mocks
// We mock getSessionFromCookies to simulate authentication context
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
    throw new Error('Critical: POSTGRES_URL missing in CI. Tests cannot be skipped.');
}

describe.skipIf(skip)('GitHub Config RBAC', () => {
    let user1Id: string;
    let orgAId: string;
    let orgBId: string;
    let svcAId: string;
    let svcBId: string;

    beforeAll(async () => {
        // Setup User
        user1Id = crypto.randomUUID();
        await sql`INSERT INTO users (id, email, name) VALUES (${user1Id}, ${'rbac-test-' + user1Id + '@test.com'}, 'RBAC User')`;

        // Setup Org A
        orgAId = crypto.randomUUID();
        await sql`INSERT INTO orgs (id, name, slug) VALUES (${orgAId}, 'Org A', ${'org-a-' + orgAId})`;

        // Setup Org B
        orgBId = crypto.randomUUID();
        await sql`INSERT INTO orgs (id, name, slug) VALUES (${orgBId}, 'Org B', ${'org-b-' + orgBId})`;

        // User1 is DEVELOPER in Org A
        await sql`INSERT INTO org_members (org_id, user_id, role) VALUES (${orgAId}, ${user1Id}, 'developer')`;

        // User1 is VIEWER in Org B
        await sql`INSERT INTO org_members (org_id, user_id, role) VALUES (${orgBId}, ${user1Id}, 'viewer')`;

        // Service A in Org A
        svcAId = crypto.randomUUID();
        await sql`INSERT INTO services (id, org_id, name) VALUES (${svcAId}, ${orgAId}, 'Service A')`;

        // Service B in Org B
        svcBId = crypto.randomUUID();
        await sql`INSERT INTO services (id, org_id, name) VALUES (${svcBId}, ${orgBId}, 'Service B')`;
    });

    afterAll(async () => {
        await sql`DELETE FROM users WHERE id = ${user1Id}`; // Cascades to memberships
        await sql`DELETE FROM orgs WHERE id IN (${orgAId}, ${orgBId})`; // Cascades to services
    });

    // Helper to mock session
    const mockSession = (activeOrgId: string) => {
        (getSessionFromCookies as any).mockResolvedValue({ // eslint-disable-line @typescript-eslint/no-explicit-any
            id: 'sess-123',
            userId: user1Id,
            activeOrgId: activeOrgId,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 86400000)
        });
    };

    it('allows DEVELOPER in active org to GET config', async () => {
        mockSession(orgAId);
        const req = new NextRequest(`http://localhost/api/services/${svcAId}/github`);
        const res = await GET(req, { params: Promise.resolve({ serviceId: svcAId }) });

        expect(res.status).toBe(200);
        // Data might be null if no config yet, but auth succeeded
    });

    it('forbids access to service in different org (Isolation)', async () => {
        mockSession(orgAId); // Active Org is A
        // Try to access Service B (which is in Org B)
        const req = new NextRequest(`http://localhost/api/services/${svcBId}/github`);
        const res = await GET(req, { params: Promise.resolve({ serviceId: svcBId }) });

        // Should be 404 because service lookup filters by active org_id
        expect(res.status).toBe(404);
        const json = await res.json();
        expect(json.error.message).toContain('Service not found');
    });

    it('forbids VIEWER role from GET config (Developer required)', async () => {
        mockSession(orgBId); // Active Org B (where User is Viewer)
        const req = new NextRequest(`http://localhost/api/services/${svcBId}/github`);
        const res = await GET(req, { params: Promise.resolve({ serviceId: svcBId }) });

        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.error.message).toContain('Requires developer role');
    });

    it('allows DEVELOPER to POST (Create/Update) config', async () => {
        mockSession(orgAId);
        const req = new NextRequest(`http://localhost/api/services/${svcAId}/github`, {
            method: 'POST',
            body: JSON.stringify({
                repoOwner: 'owner',
                repoName: 'repo',
                environmentMapping: { main: 'prod' }
            })
        });
        const res = await POST(req, { params: Promise.resolve({ serviceId: svcAId }) });
        expect(res.status).toBe(200);

        // Verify insert
        const check = await sql`SELECT * FROM service_github_integrations WHERE service_id = ${svcAId}`;
        expect(check.rowCount).toBe(1);
    });

    it('forbids VIEWER from POST config', async () => {
        mockSession(orgBId);
        const req = new NextRequest(`http://localhost/api/services/${svcBId}/github`, {
            method: 'POST',
            body: JSON.stringify({
                repoOwner: 'owner',
                repoName: 'repo',
                environmentMapping: { main: 'prod' }
            })
        });
        const res = await POST(req, { params: Promise.resolve({ serviceId: svcBId }) });
        expect(res.status).toBe(403);
    });
});
