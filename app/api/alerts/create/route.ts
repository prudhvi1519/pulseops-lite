import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireOrgRole, AuthError } from '@/lib/auth/rbac';
import { getCorrelationId, withCorrelationId } from '@/app/api/_utils/correlation';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
    const correlationId = getCorrelationId(request);
    const headers = withCorrelationId(correlationId, { 'Content-Type': 'application/json' });

    try {
        const { orgId, user } = await requireOrgRole('developer');
        const json = await request.json();
        const { serviceId, environmentId, name, type, params, severity, cooldownSeconds } = json;

        if (!name || !type || !severity) {
            return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Missing required fields' } }, { status: 400 });
        }

        // Validate Type
        if (!['error_count', 'deployment_failure'].includes(type)) {
            return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Invalid rule type' } }, { status: 400 });
        }

        // Scope Check if Svc/Env provided
        if (serviceId) {
            const svcCheck = await sql`SELECT id FROM services WHERE id = ${serviceId} AND org_id = ${orgId}`;
            if (svcCheck.rows.length === 0) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Service not found' } }, { status: 404 });
        }
        if (environmentId) {
            const envCheck = await sql`
                SELECT e.id FROM environments e 
                JOIN services s ON e.service_id = s.id 
                WHERE e.id = ${environmentId} AND s.org_id = ${orgId}
             `;
            if (envCheck.rows.length === 0) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Environment not found' } }, { status: 404 });
        }

        const result = await sql`
            INSERT INTO alert_rules (
                org_id, service_id, environment_id, name, type, params_json, severity, cooldown_seconds, enabled
            )
            VALUES (
                ${orgId}, ${serviceId || null}, ${environmentId || null}, 
                ${name}, ${type}, ${params || {}}, ${severity}, ${cooldownSeconds || 300}, true
            )
            RETURNING id
        `;

        const ruleId = result.rows[0].id;

        await logAuditEvent(orgId, user.id, 'alert_rule.created', 'alert_rule', ruleId, { name, type });

        return NextResponse.json(
            { data: { id: ruleId } },
            { status: 201, headers }
        );

    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json(
                { error: { code: err.code, message: err.message }, correlationId },
                { status: err.code === 'UNAUTHORIZED' ? 401 : 403, headers }
            );
        }
        console.error('[Create Alert Rule Error]', err);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, correlationId },
            { status: 500, headers }
        );
    }
}
