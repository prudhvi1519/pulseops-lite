import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiHandler } from '../_utils/withApiHandler';
import { successResponse } from '../_utils/response';
import { sql } from '@/lib/db';
import { requireOrgRole } from '@/lib/auth/rbac';

const createServiceSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().max(500).optional(),
    repoUrl: z.string().url().optional().or(z.literal('')),
    retentionDays: z.number().int().min(1).max(365).optional(),
});

/**
 * GET /api/services
 * List all services for the active org.
 */
export const GET = withApiHandler(
    async (_request, { correlationId }) => {
        const { orgId } = await requireOrgRole();

        const result = await sql`
      SELECT 
        s.id, s.name, s.description, s.repo_url, s.retention_days, s.created_at,
        u.name as created_by_name,
        (SELECT COUNT(*) FROM environments e WHERE e.service_id = s.id) as env_count
      FROM services s
      LEFT JOIN users u ON u.id = s.created_by
      WHERE s.org_id = ${orgId}
      ORDER BY s.created_at DESC
    `;

        const services = result.rows.map((row) => ({
            id: row.id,
            name: row.name,
            description: row.description,
            repoUrl: row.repo_url,
            retentionDays: row.retention_days,
            createdAt: row.created_at,
            createdByName: row.created_by_name,
            envCount: parseInt(row.env_count, 10),
        }));

        return successResponse({ services }, correlationId);
    },
    { route: '/api/services' }
);

/**
 * POST /api/services
 * Create a new service (admin/developer only).
 */
export const POST = withApiHandler(
    async (request: NextRequest, { correlationId }) => {
        const { orgId, user } = await requireOrgRole('developer');

        const body = await request.json();
        const parsed = createServiceSchema.safeParse(body);

        if (!parsed.success) {
            throw parsed.error;
        }

        const { name, description, repoUrl, retentionDays } = parsed.data;

        const result = await sql`
      INSERT INTO services (org_id, name, description, repo_url, retention_days, created_by)
      VALUES (${orgId}, ${name}, ${description || null}, ${repoUrl || null}, ${retentionDays || 7}, ${user.id})
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
            correlationId,
            undefined,
            201
        );
    },
    { route: '/api/services' }
);
