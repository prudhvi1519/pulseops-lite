import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiHandler } from '../../_utils/withApiHandler';
import { successResponse, errorResponse, ErrorCodes } from '../../_utils/response';
import { sql } from '@/lib/db';
import { requireOrgRole } from '@/lib/auth/rbac';

const updateServiceSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    repoUrl: z.string().url().optional().or(z.literal('')),
    retentionDays: z.number().int().min(1).max(365).optional(),
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
 * GET /api/services/[serviceId]
 * Get service detail (org-scoped).
 */
export const GET = withApiHandler(
    async (request: NextRequest, { correlationId }) => {
        const { orgId } = await requireOrgRole();
        const serviceId = getServiceIdFromUrl(request);

        const result = await sql`
      SELECT 
        s.id, s.name, s.description, s.repo_url, s.retention_days, s.created_at,
        u.name as created_by_name
      FROM services s
      LEFT JOIN users u ON u.id = s.created_by
      WHERE s.id = ${serviceId} AND s.org_id = ${orgId}
    `;

        if (result.rows.length === 0) {
            return errorResponse(
                ErrorCodes.NOT_FOUND,
                'Service not found',
                correlationId,
                404
            );
        }

        const row = result.rows[0];
        return successResponse(
            {
                service: {
                    id: row.id,
                    name: row.name,
                    description: row.description,
                    repoUrl: row.repo_url,
                    retentionDays: row.retention_days,
                    createdAt: row.created_at,
                    createdByName: row.created_by_name,
                },
            },
            correlationId
        );
    },
    { route: '/api/services/[serviceId]' }
);

/**
 * PATCH /api/services/[serviceId]
 * Update service (admin/developer only).
 */
export const PATCH = withApiHandler(
    async (request: NextRequest, { correlationId }) => {
        const { orgId } = await requireOrgRole('developer');
        const serviceId = getServiceIdFromUrl(request);

        const body = await request.json();
        const parsed = updateServiceSchema.safeParse(body);

        if (!parsed.success) {
            throw parsed.error;
        }

        // Check service exists and belongs to org
        const existing = await sql`
      SELECT id FROM services WHERE id = ${serviceId} AND org_id = ${orgId}
    `;

        if (existing.rows.length === 0) {
            return errorResponse(
                ErrorCodes.NOT_FOUND,
                'Service not found',
                correlationId,
                404
            );
        }

        const { name, description, repoUrl, retentionDays } = parsed.data;

        // Build update query dynamically
        const updates: string[] = [];
        const values: (string | number | null)[] = [];

        if (name !== undefined) {
            updates.push('name');
            values.push(name);
        }
        if (description !== undefined) {
            updates.push('description');
            values.push(description || null);
        }
        if (repoUrl !== undefined) {
            updates.push('repo_url');
            values.push(repoUrl || null);
        }
        if (retentionDays !== undefined) {
            updates.push('retention_days');
            values.push(retentionDays);
        }

        if (updates.length === 0) {
            return errorResponse(
                ErrorCodes.BAD_REQUEST,
                'No fields to update',
                correlationId,
                400
            );
        }

        // Update service
        const result = await sql`
      UPDATE services
      SET 
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        repo_url = COALESCE(${repoUrl}, repo_url),
        retention_days = COALESCE(${retentionDays}, retention_days)
      WHERE id = ${serviceId} AND org_id = ${orgId}
      RETURNING id, name, description, repo_url, retention_days, created_at
    `;

        const service = result.rows[0];

        return successResponse(
            {
                service: {
                    id: service.id,
                    name: service.name,
                    description: service.description,
                    repoUrl: service.repo_url,
                    retentionDays: service.retention_days,
                    createdAt: service.created_at,
                },
            },
            correlationId
        );
    },
    { route: '/api/services/[serviceId]' }
);
