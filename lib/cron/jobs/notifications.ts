import { sql } from '@/lib/db';

const BATCH_SIZE = 10;
const MAX_ATTEMPTS = 5;
const BACKOFF_MINUTES = [1, 2, 5, 10, 30];

export async function runNotificationsJob() {
    // 2. Fetch Pending Jobs
    const jobs = await sql`
        SELECT id, type, payload_json, attempts 
        FROM notification_jobs 
        WHERE status IN ('pending', 'failed')
          AND next_attempt_at <= NOW() 
          AND attempts < ${MAX_ATTEMPTS}
        ORDER BY next_attempt_at ASC
        LIMIT ${BATCH_SIZE}
    `;

    if (jobs.rowCount === 0) {
        return { processed: 0, results: [] };
    }

    const results = [];

    for (const job of jobs.rows) {
        try {
            const payload = job.payload_json;
            const webhookUrl = payload.webhookUrl;

            if (!webhookUrl) throw new Error('No webhookUrl in payload');

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

    return { processed: jobs.rowCount, results };
}
