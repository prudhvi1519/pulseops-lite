import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireOrgRole, AuthError } from '@/lib/auth/rbac';
import { getCorrelationId, withCorrelationId } from '@/app/api/_utils/correlation';

export const dynamic = 'force-dynamic';

function parseCursor(cursor: string): { createdAt: string; id: string } | null {
    try {
        const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
        const [createdAt, id] = JSON.parse(decoded);
        return { createdAt, id };
    } catch {
        return null;
    }
}

function encodeCursor(createdAt: Date | string, id: string): string {
    return Buffer.from(JSON.stringify([createdAt, id])).toString('base64');
}

export async function GET(request: NextRequest) {
    const correlationId = getCorrelationId(request);
    const headers = withCorrelationId(correlationId);

    try {
        // 1. Auth & Scoping (Viewer+ can read incidents)
        const { orgId } = await requireOrgRole('viewer');

        // 2. Parse Query Params
        const searchParams = request.nextUrl.searchParams;
        const serviceId = searchParams.get('serviceId');
        const environmentId = searchParams.get('environmentId');
        const status = searchParams.get('status');
        const severity = searchParams.get('severity');
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const cursor = searchParams.get('cursor');
        const limitParam = parseInt(searchParams.get('limit') || '30', 10);
        const limit = Math.min(Math.max(limitParam, 1), 100);

        // 3. Construct Query
        const conditions: string[] = [`i.org_id = $1`];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params: any[] = [orgId];
        let paramIndex = 2;

        if (serviceId) {
            conditions.push(`i.service_id = $${paramIndex++}`);
            params.push(serviceId);
        }

        if (environmentId) {
            conditions.push(`i.environment_id = $${paramIndex++}`);
            params.push(environmentId);
        }

        if (status) {
            conditions.push(`i.status = $${paramIndex++}`);
            params.push(status);
        }

        if (severity) {
            conditions.push(`i.severity = $${paramIndex++}`);
            params.push(severity);
        }

        if (from) {
            conditions.push(`i.created_at >= $${paramIndex++}`);
            params.push(from);
        }

        if (to) {
            conditions.push(`i.created_at <= $${paramIndex++}`);
            params.push(to);
        }

        // Pagination Cursor
        if (cursor) {
            const decoded = parseCursor(cursor);
            if (decoded) {
                // (created_at < cursorCreatedAt) OR (created_at = cursorCreatedAt AND id < cursorId) for DESC sort
                conditions.push(`(i.created_at < $${paramIndex} OR (i.created_at = $${paramIndex++} AND i.id < $${paramIndex++}))`);
                params.push(decoded.createdAt);
                params.push(decoded.id);
            }
        }

        const query = `
            SELECT 
                i.id, i.org_id, i.service_id, i.environment_id, 
                i.title, i.description, i.severity, i.status, i.source,
                i.created_at, i.resolved_at,
                s.name as service_name,
                e.name as environment_name
            FROM incidents i
            JOIN services s ON i.service_id = s.id
            JOIN environments e ON i.environment_id = e.id
            WHERE ${conditions.join(' AND ')}
            ORDER BY i.created_at DESC, i.id DESC
            LIMIT $${paramIndex}
        `;
        params.push(limit + 1);

        const result = await sql.query(query, params);

        const rows = result.rows;
        let nextCursor: string | null = null;

        if (rows.length > limit) {
            rows.pop();
            const lastItem = rows[rows.length - 1];
            nextCursor = encodeCursor(lastItem.created_at, lastItem.id);
        }

        const incidents = rows.map((row) => ({
            id: row.id,
            orgId: row.org_id,
            serviceId: row.service_id,
            serviceName: row.service_name,
            environmentId: row.environment_id,
            environmentName: row.environment_name,
            title: row.title,
            description: row.description,
            severity: row.severity,
            status: row.status,
            source: row.source,
            createdAt: row.created_at,
            resolvedAt: row.resolved_at
        }));

        return NextResponse.json(
            { data: incidents, meta: { nextCursor } },
            { status: 200, headers }
        );

    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json(
                { error: { code: err.code, message: err.message }, correlationId },
                { status: err.code === 'UNAUTHORIZED' ? 401 : 403, headers }
            );
        }
        console.error('[Incidents Query Error]', err);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, correlationId },
            { status: 500, headers }
        );
    }
}
