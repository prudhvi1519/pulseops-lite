import { NextRequest, NextResponse } from 'next/server';
import { requireOrgRole, AuthError } from '@/lib/auth/rbac';
import { sql } from '@/lib/db';
import { z } from 'zod';
import { getCorrelationId } from '@/app/api/_utils/correlation';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const createChannelSchema = z.object({
    type: z.enum(['discord', 'slack']),
    config: z.object({
        webhookUrl: z.string().url()
    })
});

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
    console.error(`[${correlationId}] Internal API Error:`, error);
    return NextResponse.json(
        { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' }, correlationId },
        { status: 500 }
    );
}

// POST /api/notifications/channels/create
export async function POST(request: NextRequest) {
    try {
        const { orgId, user } = await requireOrgRole('admin'); // Only admins can create channels

        const json = await request.json();
        const body = createChannelSchema.parse(json);

        const result = await sql`
            INSERT INTO notification_channels (org_id, type, config_json, enabled)
            VALUES (${orgId}, ${body.type}, ${JSON.stringify(body.config)}::jsonb, true)
            RETURNING id, created_at
        `;

        const row = result.rows[0];

        // Audit
        await logAuditEvent(orgId, user.id, 'notification_channel.created', 'notification_channel', row.id, { type: body.type });

        return NextResponse.json({
            data: {
                id: row.id,
                type: body.type,
                config: body.config,
                enabled: true,
                createdAt: row.created_at
            }
        });

    } catch (error) {
        return errorResponse(request, error);
    }
}
