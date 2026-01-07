import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiHandler } from '../_utils/withApiHandler';
import { successResponse } from '../_utils/response';
import { sql } from '@/lib/db';
import { requireSession, getUserOrgs } from '@/lib/auth/rbac';

const createOrgSchema = z.object({
    name: z.string().min(1, 'Organization name is required').max(100),
});

/**
 * GET /api/orgs
 * List all organizations the current user belongs to.
 */
export const GET = withApiHandler(
    async (_request, { correlationId }) => {
        const { user } = await requireSession();

        const orgs = await getUserOrgs(user.id);

        return successResponse({ orgs }, correlationId);
    },
    { route: '/api/orgs' }
);

/**
 * POST /api/orgs
 * Create a new organization. The current user becomes admin.
 */
export const POST = withApiHandler(
    async (request: NextRequest, { correlationId }) => {
        const { user } = await requireSession();

        const body = await request.json();
        const parsed = createOrgSchema.safeParse(body);

        if (!parsed.success) {
            throw parsed.error;
        }

        const { name } = parsed.data;

        // Create org
        const orgResult = await sql`
      INSERT INTO orgs (name)
      VALUES (${name})
      RETURNING id, name, created_at
    `;
        const org = orgResult.rows[0];

        // Add user as admin
        await sql`
      INSERT INTO org_members (org_id, user_id, role)
      VALUES (${org.id}, ${user.id}, 'admin')
    `;

        return successResponse(
            {
                org: {
                    id: org.id,
                    name: org.name,
                    createdAt: org.created_at,
                },
            },
            correlationId,
            undefined,
            201
        );
    },
    { route: '/api/orgs' }
);
