import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireOrgRole, AuthError } from '@/lib/auth/rbac';
import { getCorrelationId, withCorrelationId } from '@/app/api/_utils/correlation';
import { LogRow } from '@/lib/logs/types';

export const dynamic = 'force-dynamic';

function parseCursor(cursor: string): { ts: string; id: string } | null {
    try {
        const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
        const [ts, id] = JSON.parse(decoded);
        return { ts, id };
    } catch {
        return null;
    }
}

function encodeCursor(ts: Date | string, id: string): string {
    return Buffer.from(JSON.stringify([ts, id])).toString('base64');
}

export async function GET(request: NextRequest) {
    const correlationId = getCorrelationId(request);
    const headers = withCorrelationId(correlationId, { 'Content-Type': 'application/json' });

    try {
        // 1. Auth & Scoping (Viewer+ can read logs)
        const { orgId } = await requireOrgRole('viewer');

        // 2. Parse Query Params
        const searchParams = request.nextUrl.searchParams;
        const serviceId = searchParams.get('serviceId');
        const environmentId = searchParams.get('environmentId');
        const level = searchParams.get('level');
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const q = searchParams.get('q');
        const cursor = searchParams.get('cursor');
        const limitParam = parseInt(searchParams.get('limit') || '50', 10);
        const limit = Math.min(Math.max(limitParam, 1), 200);

        // 3. Construct Query
        const conditions: string[] = [`l.org_id = $1`];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params: any[] = [orgId];
        let paramIndex = 2;

        if (serviceId) {
            conditions.push(`l.service_id = $${paramIndex++}`);
            params.push(serviceId);
        }

        if (environmentId) {
            conditions.push(`l.environment_id = $${paramIndex++}`);
            params.push(environmentId);
        }

        if (level) {
            conditions.push(`l.level = $${paramIndex++}`);
            params.push(level);
        }

        if (from) {
            conditions.push(`l.ts >= $${paramIndex++}`);
            params.push(from);
        }

        if (to) {
            conditions.push(`l.ts <= $${paramIndex++}`);
            params.push(to);
        }

        if (q) {
            // Hybrid search: FTS ('simple') OR ILIKE for special chars
            // Note: websearch_to_tsquery('simple', ...) allows "quoted phrases" and -negation
            const ftsCondition = `to_tsvector('simple', l.message) @@ websearch_to_tsquery('simple', $${paramIndex++})`;
            const likeCondition = `l.message ILIKE $${paramIndex++}`;
            conditions.push(`(${ftsCondition} OR ${likeCondition})`);

            params.push(q);
            params.push(`%${q}%`);
        }

        // Pagination Cursor
        if (cursor) {
            const decoded = parseCursor(cursor);
            if (decoded) {
                // (ts < cursorTs) OR (ts = cursorTs AND id < cursorId) for DESC sort
                conditions.push(`(l.ts < $${paramIndex} OR (l.ts = $${paramIndex++} AND l.id < $${paramIndex++}))`);
                params.push(decoded.ts);
                params.push(decoded.id);
            }
        }

        const query = `
            SELECT 
                l.id, l.org_id, l.service_id, l.environment_id, l.ts, l.level, l.message, l.meta_json, l.trace_id, l.request_id,
                s.name as service_name,
                e.name as environment_name
            FROM logs l
            JOIN services s ON l.service_id = s.id
            JOIN environments e ON l.environment_id = e.id
            WHERE ${conditions.join(' AND ')}
            ORDER BY l.ts DESC, l.id DESC
            LIMIT $${paramIndex}
        `;
        params.push(limit + 1); // Fetch one extra to check for next page

        const result = await sql.query(query, params);

        const rows = result.rows;
        let nextCursor: string | null = null;

        if (rows.length > limit) {
            rows.pop(); // Remove the extra item
            const lastItem = rows[rows.length - 1];
            nextCursor = encodeCursor(lastItem.ts, lastItem.id);
        }

        const logs: LogRow[] = rows.map((row) => ({
            id: row.id.toString(),
            orgId: row.org_id,
            serviceId: row.service_id,
            serviceName: row.service_name,
            environmentId: row.environment_id,
            environmentName: row.environment_name,
            ts: new Date(row.ts),
            level: row.level,
            message: row.message,
            metaJson: row.meta_json,
            traceId: row.trace_id,
            requestId: row.request_id,
        }));

        return NextResponse.json(
            { data: logs, meta: { nextCursor } },
            { status: 200, headers }
        );

    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json(
                { error: { code: err.code, message: err.message }, correlationId },
                { status: err.code === 'UNAUTHORIZED' ? 401 : 403, headers }
            );
        }
        console.error('[Logs Query Error]', err);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, correlationId },
            { status: 500, headers }
        );
    }
}
