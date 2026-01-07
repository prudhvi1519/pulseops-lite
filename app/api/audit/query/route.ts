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
        // 1. Auth & Scoping (Admin only)
        const { orgId } = await requireOrgRole('admin');

        // 2. Parse Query Params
        const searchParams = request.nextUrl.searchParams;
        const action = searchParams.get('action');
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const cursor = searchParams.get('cursor');
        const limitParam = parseInt(searchParams.get('limit') || '30', 10);
        const limit = Math.min(Math.max(limitParam, 1), 100);

        // 3. Construct Query
        const conditions: string[] = [`org_id = $1`];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params: any[] = [orgId];
        let paramIndex = 2;

        if (action) {
            conditions.push(`action = $${paramIndex++}`);
            params.push(action);
        }

        if (from) {
            conditions.push(`created_at >= $${paramIndex++}`);
            params.push(from);
        }

        if (to) {
            conditions.push(`created_at <= $${paramIndex++}`);
            params.push(to);
        }

        // Pagination Cursor
        if (cursor) {
            const decoded = parseCursor(cursor);
            if (decoded) {
                conditions.push(`(created_at < $${paramIndex} OR (created_at = $${paramIndex++} AND id < $${paramIndex++}))`);
                params.push(decoded.createdAt);
                params.push(decoded.id);
            }
        }

        const query = `
            SELECT 
                id, org_id, actor_user_id, action, target_type, target_id, meta_json, created_at
            FROM audit_logs
            WHERE ${conditions.join(' AND ')}
            ORDER BY created_at DESC, id DESC
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

        const logs = rows.map((row) => ({
            id: row.id,
            orgId: row.org_id,
            actorUserId: row.actor_user_id,
            action: row.action,
            targetType: row.target_type,
            targetId: row.target_id,
            meta: row.meta_json,
            createdAt: row.created_at
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
        console.error('[Audit Logs Query Error]', err);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, correlationId },
            { status: 500, headers }
        );
    }
}
