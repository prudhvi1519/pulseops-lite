import { NextRequest, NextResponse } from 'next/server';
import { requireOrgRole, AuthError } from '@/lib/auth/rbac';
import { sql } from '@/lib/db';
import { getCorrelationId } from '@/app/api/_utils/correlation';

export const dynamic = 'force-dynamic';

function errorResponse(req: NextRequest, error: unknown) {
    const correlationId = getCorrelationId(req);
    if (error instanceof AuthError) {
        return NextResponse.json(
            { error: { code: error.code, message: error.message }, correlationId },
            { status: error.code === 'UNAUTHORIZED' ? 401 : 403 }
        );
    }
    console.error(`[${correlationId}] Internal API Error:`, error);
    return NextResponse.json(
        { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' }, correlationId },
        { status: 500 }
    );
}

// GET /api/notifications/channels/query
export async function GET(request: NextRequest) {
    try {
        // Developer role required to view configuration
        const { orgId } = await requireOrgRole('developer');

        const result = await sql`
            SELECT id, type, config_json, enabled, created_at
            FROM notification_channels
            WHERE org_id = ${orgId}
            ORDER BY created_at DESC
        `;

        return NextResponse.json({
            data: result.rows.map(row => ({
                id: row.id,
                type: row.type,
                config: row.config_json,
                enabled: row.enabled,
                createdAt: row.created_at
            }))
        });

    } catch (error) {
        return errorResponse(request, error);
    }
}
