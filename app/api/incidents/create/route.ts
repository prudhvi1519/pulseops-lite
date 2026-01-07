import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireOrgRole, AuthError } from '@/lib/auth/rbac';
import { getCorrelationId, withCorrelationId } from '@/app/api/_utils/correlation';

export async function POST(request: NextRequest) {
    const correlationId = getCorrelationId(request);
    const headers = withCorrelationId(correlationId, { 'Content-Type': 'application/json' });

    try {
        // 1. Auth & Scoping (Developer+ can create incidents)
        const { orgId, user } = await requireOrgRole('developer');

        // 2. Parse Body
        const json = await request.json();
        const { serviceId, environmentId, title, description, severity } = json;

        if (!serviceId || !environmentId || !title || !severity) {
            return NextResponse.json(
                { error: { code: 'BAD_REQUEST', message: 'Missing required fields' }, correlationId },
                { status: 400, headers }
            );
        }

        // 3. Verify Service/Env ownership (Tenant Scoping)
        // Ensure service belongs to org
        const serviceCheck = await sql`SELECT id FROM services WHERE id = ${serviceId} AND org_id = ${orgId}`;
        if (serviceCheck.rows.length === 0) {
            return NextResponse.json(
                { error: { code: 'NOT_FOUND', message: 'Service not found' }, correlationId },
                { status: 404, headers }
            );
        }

        // Ensure env belongs to service (implies org ownership via service)
        const envCheck = await sql`SELECT id FROM environments WHERE id = ${environmentId} AND service_id = ${serviceId}`;
        if (envCheck.rows.length === 0) {
            return NextResponse.json(
                { error: { code: 'NOT_FOUND', message: 'Environment not found' }, correlationId },
                { status: 404, headers }
            );
        }

        // 4. Create Incident (Transaction-like)
        // We'll trust simple sequential inserts here or use begin.
        // pg-promise or similar usually used for tx, but here we use neon/vercel storage.
        // We'll just do sequential awaiting.

        const incidentRes = await sql`
            INSERT INTO incidents (org_id, service_id, environment_id, title, description, severity, status, source)
            VALUES (${orgId}, ${serviceId}, ${environmentId}, ${title}, ${description || null}, ${severity}, 'open', 'manual')
            RETURNING id
        `;
        const incidentId = incidentRes.rows[0].id;

        await sql`
            INSERT INTO incident_events (incident_id, actor_user_id, type, message, meta_json)
            VALUES (${incidentId}, ${user.id}, 'created', 'Incident created manually', ${JSON.stringify({ actor: user.email })})
        `;

        return NextResponse.json(
            { data: { id: incidentId, status: 'open' } },
            { status: 201, headers }
        );

    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json(
                { error: { code: err.code, message: err.message }, correlationId },
                { status: err.code === 'UNAUTHORIZED' ? 401 : 403, headers }
            );
        }
        console.error('[Create Incident Error]', err);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }, correlationId },
            { status: 500, headers }
        );
    }
}
