import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiHandler } from '../../../_utils/withApiHandler';
import { successResponse, errorResponse, ErrorCodes } from '../../../_utils/response';
import { sql } from '@/lib/db';
import { requireOrgRole } from '@/lib/auth/rbac';
import { generateApiKey, hashApiKey, maskApiKey } from '@/lib/keys/apiKey';

const createKeySchema = z.object({
    environmentId: z.string().uuid('Invalid environment ID'),
});

/**
 * Extract serviceId from URL path.
 */
function getServiceIdFromUrl(request: NextRequest): string {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const servicesIndex = pathParts.findIndex((p) => p === 'services');
    return pathParts[servicesIndex + 1];
}

/**
 * Verify service belongs to org.
 */
async function verifyServiceAccess(
    serviceId: string,
    orgId: string
): Promise<boolean> {
    const result = await sql`
    SELECT id FROM services WHERE id = ${serviceId} AND org_id = ${orgId}
  `;
    return result.rows.length > 0;
}

/**
 * GET /api/services/[serviceId]/keys
 * List API keys for a service (masked).
 */
export const GET = withApiHandler(
    async (request: NextRequest, { correlationId }) => {
        const { orgId } = await requireOrgRole('developer');
        const serviceId = getServiceIdFromUrl(request);

        if (!(await verifyServiceAccess(serviceId, orgId))) {
            return errorResponse(
                ErrorCodes.NOT_FOUND,
                'Service not found',
                correlationId,
                404
            );
        }

        const result = await sql`
      SELECT 
        k.id, k.environment_id, k.revoked_at, k.created_at,
        e.name as environment_name
      FROM api_keys k
      JOIN environments e ON e.id = k.environment_id
      WHERE k.service_id = ${serviceId} AND k.org_id = ${orgId}
      ORDER BY k.created_at DESC
    `;

        const keys = result.rows.map((row) => ({
            id: row.id,
            environmentId: row.environment_id,
            environmentName: row.environment_name,
            maskedKey: maskApiKey(row.id),
            revokedAt: row.revoked_at,
            createdAt: row.created_at,
        }));

        return successResponse({ keys }, correlationId);
    },
    { route: '/api/services/[serviceId]/keys' }
);

/**
 * POST /api/services/[serviceId]/keys
 * Create API key (admin/developer only).
 * Returns raw key ONCE in response.
 */
export const POST = withApiHandler(
    async (request: NextRequest, { correlationId }) => {
        const { orgId } = await requireOrgRole('developer');
        const serviceId = getServiceIdFromUrl(request);

        if (!(await verifyServiceAccess(serviceId, orgId))) {
            return errorResponse(
                ErrorCodes.NOT_FOUND,
                'Service not found',
                correlationId,
                404
            );
        }

        const body = await request.json();
        const parsed = createKeySchema.safeParse(body);

        if (!parsed.success) {
            throw parsed.error;
        }

        const { environmentId } = parsed.data;

        // Verify environment belongs to this service
        const envCheck = await sql`
      SELECT id FROM environments 
      WHERE id = ${environmentId} AND service_id = ${serviceId}
    `;

        if (envCheck.rows.length === 0) {
            return errorResponse(
                ErrorCodes.BAD_REQUEST,
                'Environment not found for this service',
                correlationId,
                400
            );
        }

        // Generate and hash key
        const rawKey = generateApiKey();
        const keyHash = await hashApiKey(rawKey);

        const result = await sql`
      INSERT INTO api_keys (org_id, service_id, environment_id, key_hash)
      VALUES (${orgId}, ${serviceId}, ${environmentId}, ${keyHash})
      RETURNING id, created_at
    `;

        const key = result.rows[0];

        // Return raw key ONCE - this is the only time it's visible
        return successResponse(
            {
                key: {
                    id: key.id,
                    rawKey, // Only returned at creation
                    environmentId,
                    createdAt: key.created_at,
                },
                warning: 'Save this key now. It will not be shown again.',
            },
            correlationId,
            undefined,
            201
        );
    },
    { route: '/api/services/[serviceId]/keys' }
);
