import { NextRequest, NextResponse } from 'next/server';
import { requireOrgRole, AuthError } from '@/lib/auth/rbac';
import { sql } from '@/lib/db';
import { z } from 'zod';
import { getCorrelationId } from '@/app/api/_utils/correlation';

export const dynamic = 'force-dynamic';

const configSchema = z.object({
    repoOwner: z.string().min(1),
    repoName: z.string().min(1),
    environmentMapping: z.record(z.string())
});

// Helper for standard error response
function errorResponse(req: NextRequest, error: unknown) {
    const correlationId = getCorrelationId(req);

    if (error instanceof AuthError) {
        return NextResponse.json(
            { error: { code: error.code, message: error.message }, correlationId },
            { status: error.code === 'UNAUTHORIZED' ? 401 : 403 }
        );
    }

    if (error instanceof z.ZodError) {
        return NextResponse.json(
            { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: error.errors }, correlationId },
            { status: 400 }
        );
    }

    // Default 500
    console.error(`[${correlationId}] Internal API Error:`, error);
    return NextResponse.json(
        { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' }, correlationId },
        { status: 500 }
    );
}

// GET /api/services/:serviceId/github
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ serviceId: string }> }
) {
    try {
        const { serviceId } = await params;

        // Auth Check (Developer +)
        const { orgId } = await requireOrgRole('developer');

        // Verify service belongs to org
        const serviceCheck = await sql`
            SELECT id FROM services 
            WHERE id = ${serviceId} AND org_id = ${orgId}
        `;

        if ((serviceCheck.rowCount ?? 0) === 0) {
            const correlationId = getCorrelationId(request);
            return NextResponse.json(
                { error: { code: 'NOT_FOUND', message: 'Service not found' }, correlationId },
                { status: 404 }
            );
        }

        const integration = await sql`
            SELECT * FROM service_github_integrations 
            WHERE service_id = ${serviceId}
        `;

        if ((integration.rowCount ?? 0) === 0) {
            return NextResponse.json({ data: null });
        }

        const row = integration.rows[0];
        return NextResponse.json({
            data: {
                id: row.id,
                repoOwner: row.repo_owner,
                repoName: row.repo_name,
                environmentMapping: row.environment_mapping
            }
        });

    } catch (error) {
        return errorResponse(request, error);
    }
}

// POST /api/services/:serviceId/github
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ serviceId: string }> }
) {
    try {
        const { serviceId } = await params;
        const { orgId } = await requireOrgRole('developer');

        // Verify service
        const serviceCheck = await sql`
            SELECT id FROM services 
            WHERE id = ${serviceId} AND org_id = ${orgId}
        `;

        if ((serviceCheck.rowCount ?? 0) === 0) {
            const correlationId = getCorrelationId(request);
            return NextResponse.json(
                { error: { code: 'NOT_FOUND', message: 'Service not found' }, correlationId },
                { status: 404 }
            );
        }

        const json = await request.json();
        const body = configSchema.parse(json);

        // Upsert
        // Use stringify + ::jsonb cast for safety and type compliance
        await sql`
            INSERT INTO service_github_integrations (service_id, repo_owner, repo_name, environment_mapping)
            VALUES (${serviceId}, ${body.repoOwner}, ${body.repoName}, ${JSON.stringify(body.environmentMapping)}::jsonb)
            ON CONFLICT (service_id) 
            DO UPDATE SET 
                repo_owner = EXCLUDED.repo_owner,
                repo_name = EXCLUDED.repo_name,
                environment_mapping = EXCLUDED.environment_mapping
        `;

        return NextResponse.json({ data: { ok: true } });

    } catch (error) {
        return errorResponse(request, error);
    }
}
