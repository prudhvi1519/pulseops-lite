import { sql } from '@/lib/db';

export async function runCleanupJob() {
    const startTime = new Date();

    // Delete logs older than service retention period
    // Uses standard 7 days default if null (though schema defaults to 7)
    const result = await sql`
        DELETE FROM logs l
        USING services s
        WHERE l.service_id = s.id
        AND l.org_id = s.org_id
        AND l.ts < NOW() - (COALESCE(s.retention_days, 7) || ' days')::INTERVAL
    `;

    await sql`
      INSERT INTO cron_runs (name, status, started_at, finished_at, meta_json)
      VALUES ('logs.cleanup', 'success', ${startTime.toISOString()}, NOW(), ${JSON.stringify({ deleted: result.rowCount })})
    `;

    return {
        deleted: result.rowCount,
        timestamp: new Date().toISOString()
    };
}
