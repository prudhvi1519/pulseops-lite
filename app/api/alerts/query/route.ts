import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireOrgRole, AuthError } from '@/lib/auth/rbac';
import { getCorrelationId, withCorrelationId } from '@/app/api/_utils/correlation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const correlationId = getCorrelationId(request);
    const headers = withCorrelationId(correlationId);

    try {
        const { orgId } = await requireOrgRole('viewer');

        const searchParams = request.nextUrl.searchParams;
        const serviceId = searchParams.get('serviceId');
        const environmentId = searchParams.get('environmentId');
        const type = searchParams.get('type');
        const enabled = searchParams.get('enabled'); // 'true' or 'false'

        const conditions: string[] = [`r.org_id = $1`];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params: any[] = [orgId];
        let paramIndex = 2;

        if (serviceId) {
            conditions.push(`r.service_id = $${paramIndex++}`);
            params.push(serviceId);
        }

        if (environmentId) {
            conditions.push(`r.environment_id = $${paramIndex++}`);
            params.push(environmentId);
        }

        if (type) {
            conditions.push(`r.type = $${paramIndex++}`);
            params.push(type);
        }

        if (enabled) {
            conditions.push(`r.enabled = $${paramIndex++}`);
            params.push(enabled === 'true');
        }

        const query = `
            SELECT 
                r.id, r.org_id, r.service_id, r.environment_id, 
                r.name, r.type, r.params_json, r.severity, r.enabled, r.cooldown_seconds, r.created_at,
                s.name as service_name,
                e.name as environment_name
            FROM alert_rules r
            LEFT JOIN services s ON r.service_id = s.id
            LEFT JOIN environments e ON r.environment_id = e.id
            WHERE ${conditions.join(' AND ')}
            ORDER BY r.created_at DESC
        `;

        const result = await sql.query(query, params);

        const rules = result.rows.map((row) => ({
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
        }));

        return NextResponse.json(
            { data: rules },
            { status: 200, headers }
        );

    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json(
                { error: { code: err.code, message: err.message }, correlationId },
                { status: err.code === 'UNAUTHORIZED' ? 401 : 403, headers }
            );
        }
        console.error('[Alert Rules Query Error]', err);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, correlationId },
            { status: 500, headers }
        );
    }
}
