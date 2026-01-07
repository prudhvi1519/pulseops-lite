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

// GET /api/notifications/jobs/recent
export async function GET(request: NextRequest) {
    try {
        const { orgId } = await requireOrgRole('admin'); // Admin only for diagnostics

        const result = await sql`
            SELECT id, type, status, attempts, last_error, created_at, next_attempt_at
            FROM notification_jobs
            WHERE org_id = ${orgId}
            ORDER BY created_at DESC
            LIMIT 25
        `;

        return NextResponse.json({
            data: result.rows.map(row => ({
                id: row.id,
                type: row.type,
                status: row.status,
                attempts: row.attempts,
                lastError: row.last_error,
                createdAt: row.created_at,
                nextAttemptAt: row.next_attempt_at
            }))
        });

    } catch (error) {
        return errorResponse(request, error);
    }
}
