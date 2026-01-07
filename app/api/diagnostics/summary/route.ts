import { NextRequest, NextResponse } from 'next/server';
import { requireOrgRole, AuthError } from '@/lib/auth/rbac';
import { sql } from '@/lib/db';
import { getCorrelationId } from '@/app/api/_utils/correlation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        await requireOrgRole('admin');

        const [
            cronRunsRes,
            notificationStatsRes,
            incidentStatsRes
        ] = await Promise.all([
            // Last run for each cron type
            sql`
                SELECT DISTINCT ON (name) name, status, started_at, finished_at, meta_json
                FROM cron_runs
                ORDER BY name, created_at DESC
            `,
            // Notification Queue Stats
            sql`
                SELECT 
                    COUNT(*) FILTER (WHERE status = 'pending') as pending,
                    COUNT(*) FILTER (WHERE status = 'failed') as failed
                FROM notification_jobs
            `,
            // Incident Stats
            sql`
                SELECT COUNT(*) as open
                FROM incidents
                WHERE status = 'open'
            `
        ]);

        return NextResponse.json({
            data: {
                cron: cronRunsRes.rows,
                notifications: notificationStatsRes.rows[0],
                incidents: incidentStatsRes.rows[0],
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[Diagnostics Error]', error);
        const correlationId = getCorrelationId(request);
        if (error instanceof AuthError) {
            return NextResponse.json(
                { error: { code: error.code, message: error.message }, correlationId },
                { status: error.code === 'UNAUTHORIZED' ? 401 : 403 }
            );
        }
        return NextResponse.json(
            { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' }, correlationId },
            { status: 500 }
        );
    }
}
