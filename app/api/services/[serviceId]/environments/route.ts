import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiHandler } from '../../../_utils/withApiHandler';
import { successResponse, errorResponse, ErrorCodes } from '../../../_utils/response';
import { sql } from '@/lib/db';
import { requireOrgRole } from '@/lib/auth/rbac';

const createEnvSchema = z.object({
    name: z.string().min(1, 'Name is required').max(50),
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
 * GET /api/services/[serviceId]/environments
 * List environments for a service.
 */
export const GET = withApiHandler(
    async (request: NextRequest, { correlationId }) => {
        const { orgId } = await requireOrgRole();
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
      SELECT id, name, created_at
      FROM environments
      WHERE service_id = ${serviceId}
      ORDER BY created_at ASC
    `;

        const environments = result.rows.map((row) => ({
            id: row.id,
            name: row.name,
            createdAt: row.created_at,
        }));

        return successResponse({ environments }, correlationId);
    },
    { route: '/api/services/[serviceId]/environments' }
);

/**
 * POST /api/services/[serviceId]/environments
 * Create environment (admin/developer only).
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
        const parsed = createEnvSchema.safeParse(body);

        if (!parsed.success) {
            throw parsed.error;
        }

        const { name } = parsed.data;

        const result = await sql`
      INSERT INTO environments (service_id, name)
      VALUES (${serviceId}, ${name})
      RETURNING id, name, created_at
    `;

        const env = result.rows[0];

        return successResponse(
            {
                environment: {
                    id: env.id,
                    name: env.name,
                    createdAt: env.created_at,
                },
            },
            correlationId,
            undefined,
            201
        );
    },
    { route: '/api/services/[serviceId]/environments' }
);
