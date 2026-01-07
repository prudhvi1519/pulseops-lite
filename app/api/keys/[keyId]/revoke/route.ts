import { NextRequest } from 'next/server';
import { withApiHandler } from '../../../_utils/withApiHandler';
import { successResponse, errorResponse, ErrorCodes } from '../../../_utils/response';
import { sql } from '@/lib/db';
import { requireOrgRole } from '@/lib/auth/rbac';

/**
 * Extract keyId from URL path.
 */
function getKeyIdFromUrl(request: NextRequest): string {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const keysIndex = pathParts.findIndex((p) => p === 'keys');
    return pathParts[keysIndex + 1];
}

/**
 * POST /api/keys/[keyId]/revoke
 * Revoke an API key (admin/developer only).
 */
export const POST = withApiHandler(
    async (request: NextRequest, { correlationId }) => {
        const { orgId } = await requireOrgRole('developer');
        const keyId = getKeyIdFromUrl(request);

        // Check key exists and belongs to org
        const existing = await sql`
      SELECT id, revoked_at FROM api_keys 
      WHERE id = ${keyId} AND org_id = ${orgId}
    `;

        if (existing.rows.length === 0) {
            return errorResponse(
                ErrorCodes.NOT_FOUND,
                'API key not found',
                correlationId,
                404
            );
        }

        if (existing.rows[0].revoked_at) {
            return errorResponse(
                ErrorCodes.BAD_REQUEST,
                'API key is already revoked',
                correlationId,
                400
            );
        }

        // Revoke the key
        await sql`
      UPDATE api_keys
      SET revoked_at = NOW()
      WHERE id = ${keyId} AND org_id = ${orgId}
    `;

        return successResponse(
            { revoked: true, keyId },
            correlationId
        );
    },
    { route: '/api/keys/[keyId]/revoke' }
);
