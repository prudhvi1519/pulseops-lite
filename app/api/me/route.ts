import { withApiHandler } from '../_utils/withApiHandler';
import { successResponse } from '../_utils/response';
import { requireOrgRole } from '@/lib/auth/rbac';

/**
 * GET /api/me
 * Get the current authenticated user and org context.
 */
export const GET = withApiHandler(
    async (_request, { correlationId }) => {
        const { user, orgId, orgName, role } = await requireOrgRole();

        return successResponse(
            {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
                activeOrgId: orgId,
                activeOrgName: orgName,
                role,
            },
            correlationId
        );
    },
    { route: '/api/me' }
);
