import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

async function verifySignature(req: NextRequest, body: string): Promise<boolean> {
    const signature = req.headers.get('X-Hub-Signature-256');
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!signature || !secret) return false;

    const parts = signature.split('=');
    if (parts.length !== 2 || parts[0] !== 'sha256') return false;

    const sigHex = parts[1];
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body);
    const digest = hmac.digest('hex');

    // Timing safe compare
    return crypto.timingSafeEqual(
        Buffer.from(sigHex),
        Buffer.from(digest)
    );
}

export async function POST(req: NextRequest) {
    try {
        const bodyText = await req.text();

        // 1. Verify Signature
        if (!(await verifySignature(req, bodyText))) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const deliveryId = req.headers.get('X-GitHub-Delivery');
        const event = req.headers.get('X-GitHub-Event');

        if (!deliveryId || !event) {
            return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
        }

        // 2. Deduplication (Idempotency)
        // We calculate a hash of the payload to ensure integrity if needed, but strict dedupe is by delivery_id
        const payloadHash = crypto.createHash('sha256').update(bodyText).digest('hex');

        try {
            await sql`
                INSERT INTO webhook_deliveries (provider, delivery_id, event, payload_hash)
                VALUES ('github', ${deliveryId}, ${event}, ${payloadHash})
            `;
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            // Unique constraint violation code 23505
            if (err.code === '23505') {
                return NextResponse.json({ data: { ok: true, deduped: true } });
            }
            throw err;
        }

        // 3. Process Event
        const payload = JSON.parse(bodyText);

        if (event === 'workflow_run') {
            await handleWorkflowRun(payload);
        }

        return NextResponse.json({ data: { ok: true } });

    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function handleWorkflowRun(payload: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const { workflow_run, repository } = payload;

    // Status mapping
    // conclusion: success, failure, cancelled, timed_out, skipped, neutral
    // status: requested, in_progress, completed

    let deploymentStatus = 'in_progress';
    if (workflow_run.status === 'completed') {
        if (workflow_run.conclusion === 'success') {
            deploymentStatus = 'success';
        } else if (['failure', 'cancelled', 'timed_out'].includes(workflow_run.conclusion)) {
            deploymentStatus = 'fail';
        } else {
            // neutral/skipped -> ignore or treat as success? 
            // Application policy: ignore or track?
            // User requirement: check in ('success','fail','in_progress')
            // If skipped, maybe we don't want a deployment record?
            // For now, mapping skipped to 'success' might be misleading.
            // Let's only map definite states.
            if (workflow_run.conclusion === 'skipped') return; // Skip
            deploymentStatus = 'fail'; // Default to fail for unknown bad states
        }
    } else {
        deploymentStatus = 'in_progress';
    }

    // Lookup Integration
    const owner = repository.owner.login;
    const name = repository.name;

    const integrationResult = await sql`
        SELECT * FROM service_github_integrations 
        WHERE repo_owner = ${owner} AND repo_name = ${name}
    `;

    if (integrationResult.rowCount === 0) return; // No Mapping

    const integration = integrationResult.rows[0];
    const mapping = integration.environment_mapping as Record<string, string>;

    // Determine Environment
    const branch = workflow_run.head_branch;
    const envName = mapping[branch];

    if (!envName) return; // No env map for this branch

    // Lookup Environment ID
    const envResult = await sql`
        SELECT e.id, e.service_id, s.org_id
        FROM environments e
        JOIN services s ON e.service_id = s.id
        WHERE e.service_id = ${integration.service_id} 
        AND e.name = ${envName}
    `;

    if (envResult.rowCount === 0) return; // Env not found

    const { id: envId, service_id: serviceId, org_id: orgId } = envResult.rows[0];

    // Data for Deployment
    const commitSha = workflow_run.head_sha;
    const commitMsg = workflow_run.head_commit?.message?.substring(0, 255); // Truncate
    const actor = workflow_run.actor?.login;
    const url = workflow_run.html_url;
    const startedAt = workflow_run.run_started_at ? new Date(workflow_run.run_started_at).toISOString() : null;
    const finishedAt = workflow_run.updated_at ? new Date(workflow_run.updated_at).toISOString() : null;

    // Dedupe/Upsert Deployment
    // Unique key: (org_id, url) implies same run
    // Check if exists
    const existing = await sql`
        SELECT id FROM deployments 
        WHERE org_id = ${orgId} AND url = ${url}
    `;

    if ((existing.rowCount ?? 0) > 0) {
        // Update status
        await sql`
            UPDATE deployments 
            SET status = ${deploymentStatus}, 
                finished_at = ${finishedAt}
            WHERE id = ${existing.rows[0].id}
        `;
    } else {
        // Insert
        await sql`
            INSERT INTO deployments (
                org_id, service_id, environment_id, status, 
                commit_sha, commit_message, actor, url, started_at, finished_at
            ) VALUES (
                ${orgId}, ${serviceId}, ${envId}, ${deploymentStatus},
                ${commitSha}, ${commitMsg}, ${actor}, ${url}, ${startedAt}, ${finishedAt}
            )
        `;
    }
}
