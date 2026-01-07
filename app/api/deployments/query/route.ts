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
        // 1. Auth & Scoping (Viewer+ can read deployments)
        const { orgId } = await requireOrgRole('viewer');

        // 2. Parse Query Params
        const searchParams = request.nextUrl.searchParams;
        const serviceId = searchParams.get('serviceId');
        const environmentId = searchParams.get('environmentId');
        const status = searchParams.get('status');
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const cursor = searchParams.get('cursor');
        const limitParam = parseInt(searchParams.get('limit') || '30', 10);
        const limit = Math.min(Math.max(limitParam, 1), 100);

        // 3. Construct Query
        const conditions: string[] = [`d.org_id = $1`];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params: any[] = [orgId];
        let paramIndex = 2;

        if (serviceId) {
            conditions.push(`d.service_id = $${paramIndex++}`);
            params.push(serviceId);
        }

        if (environmentId) {
            conditions.push(`d.environment_id = $${paramIndex++}`);
            params.push(environmentId);
        }

        if (status) {
            conditions.push(`d.status = $${paramIndex++}`);
            params.push(status);
        }

        if (from) {
            conditions.push(`d.created_at >= $${paramIndex++}`);
            params.push(from);
        }

        if (to) {
            conditions.push(`d.created_at <= $${paramIndex++}`);
            params.push(to);
        }

        // Pagination Cursor
        if (cursor) {
            const decoded = parseCursor(cursor);
            if (decoded) {
                // (created_at < cursorCreatedAt) OR (created_at = cursorCreatedAt AND id < cursorId) for DESC sort
                conditions.push(`(d.created_at < $${paramIndex} OR (d.created_at = $${paramIndex++} AND d.id < $${paramIndex++}))`);
                params.push(decoded.createdAt);
                params.push(decoded.id);
            }
        }

        const query = `
            SELECT 
                d.id, d.org_id, d.service_id, d.environment_id, 
                d.status, d.created_at, d.started_at, d.finished_at,
                d.commit_sha, d.commit_message, d.actor, d.url,
                s.name as service_name,
                e.name as environment_name
            FROM deployments d
            JOIN services s ON d.service_id = s.id
            JOIN environments e ON d.environment_id = e.id
            WHERE ${conditions.join(' AND ')}
            ORDER BY d.created_at DESC, d.id DESC
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

        const deployments = rows.map((row) => ({
            id: row.id,
            orgId: row.org_id,
            serviceId: row.service_id,
            serviceName: row.service_name,
            environmentId: row.environment_id,
            environmentName: row.environment_name,
            status: row.status,
            createdAt: row.created_at,
            startedAt: row.started_at,
            finishedAt: row.finished_at,
            commitSha: row.commit_sha,
            commitMessage: row.commit_message,
            actor: row.actor,
            url: row.url
        }));

        return NextResponse.json(
            { data: deployments, meta: { nextCursor } },
            { status: 200, headers }
        );

    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json(
                { error: { code: err.code, message: err.message }, correlationId },
                { status: err.code === 'UNAUTHORIZED' ? 401 : 403, headers }
            );
        }
        console.error('[Deployments Query Error]', err);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, correlationId },
            { status: 500, headers }
        );
    }
}
