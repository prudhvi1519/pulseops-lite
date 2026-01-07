import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiHandler } from '../../_utils/withApiHandler';
import { successResponse } from '../../_utils/response';
import {
    requireSession,
    getOrgMembership,
    AuthError,
} from '@/lib/auth/rbac';
import { updateSessionActiveOrg } from '@/lib/auth/session';

const switchOrgSchema = z.object({
    orgId: z.string().uuid('Invalid organization ID'),
});

/**
 * POST /api/orgs/active
 * Switch the active organization for the current session.
 */
export const POST = withApiHandler(
    async (request: NextRequest, { correlationId }) => {
        const { session, user } = await requireSession();

        const body = await request.json();
        const parsed = switchOrgSchema.safeParse(body);

        if (!parsed.success) {
            throw parsed.error;
        }

        const { orgId } = parsed.data;

        // Verify user is a member of this org
        const membership = await getOrgMembership(user.id, orgId);

        if (!membership) {
            throw new AuthError('FORBIDDEN', 'Not a member of this organization');
        }

        // Update session's active org
        await updateSessionActiveOrg(session.id, orgId);

        return successResponse(
            {
                activeOrgId: orgId,
                activeOrgName: membership.orgName,
                role: membership.role,
            },
            correlationId
        );
    },
    { route: '/api/orgs/active' }
);
