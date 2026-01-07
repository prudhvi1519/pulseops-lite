import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCorrelationId, withCorrelationId } from '@/app/api/_utils/correlation';

export const dynamic = 'force-dynamic';
const BATCH_SIZE = 10;
const MAX_ATTEMPTS = 5;

// Backoff: 1m, 2m, 5m, 10m, 30m
const BACKOFF_MINUTES = [1, 2, 5, 10, 30];

export async function POST(request: NextRequest) {
    const INTERNAL_SECRET = process.env.INTERNAL_CRON_SECRET || 'super-secret-cron-key';
    const correlationId = getCorrelationId(request);
    const headers = withCorrelationId(correlationId, { 'Content-Type': 'application/json' });

    // 1. Security Check
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${INTERNAL_SECRET}`) {
        return NextResponse.json(
            { error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' }, correlationId },
            { status: 401, headers }
        );
    }

    try {
        // 2. Fetch Pending Jobs
        // We use FOR UPDATE SKIP LOCKED if possible, but for Lite just separate update is fine or simple selection.
        // Vercel Postgres doesn't strictly guarantee SKIP LOCKED performance in all tiers, but standard PG supports it.
        // Let's stick to simple "select and update status" to 'processing' to avoid concurrency issues if multiple cron hits (rare).

        const jobs = await sql`
            SELECT id, type, payload_json, attempts 
            FROM notification_jobs 
            WHERE status IN ('pending', 'failed') -- failed but eligible for retry will have next_attempt_at set
              AND next_attempt_at <= NOW() 
              AND attempts < ${MAX_ATTEMPTS}
            ORDER BY next_attempt_at ASC
            LIMIT ${BATCH_SIZE}
            -- FOR UPDATE SKIP LOCKED -- Commented out to be safe on potential connection restrictions, but recommended for prod.
        `;

        if (jobs.rowCount === 0) {
            return NextResponse.json({ data: { processed: 0 } }, { status: 200, headers });
        }

        const results = [];

        for (const job of jobs.rows) {
            // Mark processing (optional, but good for visibility if job takes time)
            // await sql`UPDATE notification_jobs SET status='processing' WHERE id=${job.id}`;

            try {
                const payload = job.payload_json;
                const webhookUrl = payload.webhookUrl;

                if (!webhookUrl) throw new Error('No webhookUrl in payload');

                // format message based on type
                let body = {};
                if (job.type === 'discord') {
                    body = {
                        content: `${payload.event === 'incident.created' ? '🚨' : '⚠️'} **${payload.title}**\nStatus: ${payload.status}\nLink: ${payload.link}`
                    };
                } else if (job.type === 'slack') {
                    body = {
                        text: `${payload.event === 'incident.created' ? '🚨' : '⚠️'} *${payload.title}*\nStatus: ${payload.status}\n<${payload.link}|View Incident>`
                    };
                } else {
                    // Fallback
                    body = { text: JSON.stringify(payload) };
                }

                const res = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                if (!res.ok) {
                    throw new Error(`Webhook failed: ${res.status} ${res.statusText}`);
                }

                // Success
                await sql`
                    UPDATE notification_jobs 
                    SET status = 'sent', last_error = null 
                    WHERE id = ${job.id}
                `;
                results.push({ id: job.id, status: 'sent' });

            } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                const attempts = job.attempts + 1;
                const status = attempts >= MAX_ATTEMPTS ? 'failed' : 'pending';
                const backoff = BACKOFF_MINUTES[Math.min(attempts - 1, BACKOFF_MINUTES.length - 1)] || 30;

                await sql`
                    UPDATE notification_jobs 
                    SET 
                        status = ${status}, 
                        attempts = ${attempts},
                        next_attempt_at = NOW() + make_interval(mins => ${backoff}),
                        last_error = ${err.message || 'Unknown error'}
                    WHERE id = ${job.id}
                `;
                results.push({ id: job.id, status, error: err.message });
            }
        }

        if ((jobs.rowCount ?? 0) > 0) {
            await sql`
                INSERT INTO cron_runs (name, status, started_at, finished_at, meta_json)
                VALUES ('notifications.process', 'success', ${new Date().toISOString()}, NOW(), ${JSON.stringify({ processed: jobs.rowCount, results })})
            `;
        }

        return NextResponse.json({ data: { processed: jobs.rowCount, results } }, { status: 200, headers });

    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error('[Processor Error]', error);
        try {
            await sql`
                INSERT INTO cron_runs (name, status, started_at, finished_at, meta_json)
                VALUES ('notifications.process', 'failed', ${new Date().toISOString()}, NOW(), ${JSON.stringify({ error: error.message })})
            `;
        } catch { /* ignore */ }

        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Processing failed' }, correlationId },
            { status: 500, headers }
        );
    }
}
