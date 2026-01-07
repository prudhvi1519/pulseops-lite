import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireOrgRole, AuthError } from '@/lib/auth/rbac';
import { getCorrelationId, withCorrelationId } from '@/app/api/_utils/correlation';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// Helper to validate status transition if needed
const VALID_STATUSES = ['open', 'investigating', 'resolved'];

// GET: Incident Details + Timeline
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = getCorrelationId(request);
    const headers = withCorrelationId(correlationId);
    const { id } = await params;

    try {
        const { orgId } = await requireOrgRole('viewer');

        // Fetch Incident
        const incidentRes = await sql`
            SELECT 
                i.*, 
                s.name as service_name, 
                e.name as environment_name 
            FROM incidents i
            JOIN services s ON i.service_id = s.id
            JOIN environments e ON i.environment_id = e.id
            WHERE i.id = ${id} AND i.org_id = ${orgId}
        `;

        if (incidentRes.rows.length === 0) {
            return NextResponse.json(
                { error: { code: 'NOT_FOUND', message: 'Incident not found' }, correlationId },
                { status: 404, headers }
            );
        }

        const incident = incidentRes.rows[0];

        // Fetch Events (Timeline)
        const eventsRes = await sql`
            SELECT 
                ie.*, u.email as actor_email, u.name as actor_name
            FROM incident_events ie
            LEFT JOIN users u ON ie.actor_user_id = u.id
            WHERE ie.incident_id = ${id}
            ORDER BY ie.created_at ASC
        `;

        return NextResponse.json(
            {
                data: {
                    ...incident,
                    events: eventsRes.rows
                }
            },
            { status: 200, headers }
        );

    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json(
                { error: { code: err.code, message: err.message }, correlationId },
                { status: err.code === 'UNAUTHORIZED' ? 401 : 403, headers }
            );
        }
        console.error('[Get Incident Error]', err);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, correlationId },
            { status: 500, headers }
        );
    }
}

// PATCH: Update Status/Metadata
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = getCorrelationId(request);
    const headers = withCorrelationId(correlationId, { 'Content-Type': 'application/json' });
    const { id } = await params;

    try {
        const { orgId, user } = await requireOrgRole('developer');
        const json = await request.json();
        const { status } = json;

        // Verify existence & ownership
        const check = await sql`SELECT id, status FROM incidents WHERE id = ${id} AND org_id = ${orgId}`;
        if (check.rows.length === 0) {
            return NextResponse.json(
                { error: { code: 'NOT_FOUND', message: 'Incident not found' }, correlationId },
                { status: 404, headers }
            );
        }

        const currentStatus = check.rows[0].status;
        // We will do individual updates or simple dynamic check.
        // For simplicity and safety with 'sql' tag function, we might just build specific queries or valid separate updates.
        // Actually, let's just do sequential logic logic.

        // 1. Update Status
        if (status && status !== currentStatus) {
            if (!VALID_STATUSES.includes(status)) {
                return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Invalid status' } }, { status: 400 });
            }

            let resolvedAt = null;
            if (status === 'resolved') resolvedAt = new Date();

            // We need to construct the update securely.
            await sql`
                UPDATE incidents 
                SET status = ${status}, resolved_at = ${resolvedAt ? resolvedAt.toISOString() : null}
                WHERE id = ${id}
            `;

            await sql`
                INSERT INTO incident_events (incident_id, actor_user_id, type, message)
                VALUES (${id}, ${user.id}, 'status_change', ${`Status changed from ${currentStatus} to ${status}`})
            `;

            // Audit
            await logAuditEvent(
                orgId,
                user.id,
                'incident.status_updated',
                'incident',
                id,
                { oldStatus: currentStatus, newStatus: status }
            );
        }

        // 2. Update Severity
        // (Skipping for brevity unless requested, plan mentioned status mostly, but easy to add)

        return NextResponse.json({ data: { message: 'Updated' } }, { status: 200, headers });

    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json(
                { error: { code: err.code, message: err.message }, correlationId },
                { status: err.code === 'UNAUTHORIZED' ? 401 : 403, headers }
            );
        }
        console.error('[Update Incident Error]', err);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, correlationId },
            { status: 500, headers }
        );
    }
}
