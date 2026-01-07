import { NextRequest } from 'next/server';
import { withApiHandler } from '../../../_utils/withApiHandler';
import { successResponse } from '../../../_utils/response';
import { requireOrgMembership } from '@/lib/auth/rbac';
import { sql } from '@/lib/db';

/**
 * GET /api/orgs/[orgId]/meta
 * Get organization metadata. Requires membership in the org.
 */
export const GET = withApiHandler(
    async (request: NextRequest, { correlationId }) => {
        // Extract orgId from URL
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/');
        const orgIdIndex = pathParts.findIndex((p) => p === 'orgs') + 1;
        const orgId = pathParts[orgIdIndex];

        // Validate membership
        const { role } = await requireOrgMembership(orgId);

        // Get org details
        const result = await sql`
      SELECT id, name, created_at
      FROM orgs
      WHERE id = ${orgId}
    `;

        const org = result.rows[0];

        return successResponse(
            {
                org: {
                    id: org.id,
                    name: org.name,
                    createdAt: org.created_at,
                },
                role,
            },
            correlationId
        );
    },
    { route: '/api/orgs/[orgId]/meta' }
);
