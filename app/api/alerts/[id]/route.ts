import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireOrgRole, AuthError } from '@/lib/auth/rbac';
import { getCorrelationId, withCorrelationId } from '@/app/api/_utils/correlation';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = getCorrelationId(request);
    const headers = withCorrelationId(correlationId);
    const { id } = await params;

    try {
        const { orgId } = await requireOrgRole('viewer');

        const result = await sql`
            SELECT 
                r.*, s.name as service_name, e.name as environment_name
            FROM alert_rules r
            LEFT JOIN services s ON r.service_id = s.id
            LEFT JOIN environments e ON r.environment_id = e.id
            WHERE r.id = ${id} AND r.org_id = ${orgId}
        `;

        if (result.rows.length === 0) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Rule not found' } }, { status: 404, headers });
        }

        const row = result.rows[0];
        const rule = {
            id: row.id,
            orgId: row.org_id,
            serviceId: row.service_id,
            serviceName: row.service_name,
            environmentId: row.environment_id,
            environmentName: row.environment_name,
            name: row.name,
            type: row.type,
            params: row.params_json,
            severity: row.severity,
            enabled: row.enabled,
            cooldownSeconds: row.cooldown_seconds,
            createdAt: row.created_at
        };

        return NextResponse.json({ data: rule }, { status: 200, headers });

    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json(
                { error: { code: err.code, message: err.message }, correlationId },
                { status: err.code === 'UNAUTHORIZED' ? 401 : 403, headers }
            );
        }
        console.error('[Get Alert Rule Error]', err);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, correlationId },
            { status: 500, headers }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = getCorrelationId(request);
    const headers = withCorrelationId(correlationId, { 'Content-Type': 'application/json' });
    const { id } = await params;

    try {
        const { orgId } = await requireOrgRole('developer');
        const json = await request.json();
        const { enabled, params, cooldownSeconds } = json;

        // Verify existence
        const check = await sql`SELECT id FROM alert_rules WHERE id = ${id} AND org_id = ${orgId}`;
        if (check.rows.length === 0) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Rule not found' } }, { status: 404, headers });
        }

        // Build Update Query
        // We handle fields selectively
        if (enabled !== undefined) {
            await sql`UPDATE alert_rules SET enabled = ${enabled} WHERE id = ${id}`;
        }
        if (params !== undefined) {
            await sql`UPDATE alert_rules SET params_json = ${params} WHERE id = ${id}`;
        }
        if (cooldownSeconds !== undefined) {
            await sql`UPDATE alert_rules SET cooldown_seconds = ${cooldownSeconds} WHERE id = ${id}`;
        }

        return NextResponse.json({ data: { message: 'Updated' } }, { status: 200, headers });

    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json(
                { error: { code: err.code, message: err.message }, correlationId },
                { status: err.code === 'UNAUTHORIZED' ? 401 : 403, headers }
            );
        }
        console.error('[Update Alert Rule Error]', err);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, correlationId },
            { status: 500, headers }
        );
    }
}
