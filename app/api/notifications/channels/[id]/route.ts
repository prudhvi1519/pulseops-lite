import { NextRequest, NextResponse } from 'next/server';
import { requireOrgRole, AuthError } from '@/lib/auth/rbac';
import { sql } from '@/lib/db';
import { z } from 'zod';
import { getCorrelationId } from '@/app/api/_utils/correlation';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const updateChannelSchema = z.object({
    enabled: z.boolean().optional(),
    config: z.object({
        webhookUrl: z.string().url()
    }).optional()
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

// PATCH /api/notifications/channels/:id
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { orgId, user } = await requireOrgRole('admin');

        const json = await request.json();
        const body = updateChannelSchema.parse(json);

        if (body.enabled === undefined && body.config === undefined) {
            return NextResponse.json({ data: { ok: true, message: 'No changes' } });
        }

        const result = await sql`
            UPDATE notification_channels
            SET 
                enabled = COALESCE(${body.enabled ?? null}, enabled),
                config_json = COALESCE(${body.config ? JSON.stringify(body.config) : null}::jsonb, config_json)
            WHERE id = ${id} AND org_id = ${orgId}
            RETURNING id, enabled, config_json
        `;

        if ((result.rowCount ?? 0) === 0) {
            const correlationId = getCorrelationId(request);
            return NextResponse.json(
                { error: { code: 'NOT_FOUND', message: 'Channel not found' }, correlationId },
                { status: 404 }
            );
        }

        const response = NextResponse.json({
            data: {
                id: result.rows[0].id,
                enabled: result.rows[0].enabled,
                config: result.rows[0].config_json
            }
        });

        await logAuditEvent(orgId, user.id, 'notification_channel.updated', 'notification_channel', id, { enabled: body.enabled });

        return response;

    } catch (error) {
        return errorResponse(request, error);
    }
}

// DELETE /api/notifications/channels/:id
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { orgId, user } = await requireOrgRole('admin');

        const result = await sql`
            DELETE FROM notification_channels
            WHERE id = ${id} AND org_id = ${orgId}
            RETURNING id
        `;

        if ((result.rowCount ?? 0) === 0) {
            const correlationId = getCorrelationId(request);
            return NextResponse.json(
                { error: { code: 'NOT_FOUND', message: 'Channel not found' }, correlationId },
                { status: 404 }
            );
        }

        await logAuditEvent(orgId, user.id, 'notification_channel.deleted', 'notification_channel', id, null);

        return NextResponse.json({ data: { ok: true } });

    } catch (error) {
        return errorResponse(request, error);
    }
}
