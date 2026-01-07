import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-cron-secret');
  if (secret !== process.env.INTERNAL_CRON_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Missing or invalid secret' },
      { status: 401 }
    );
  }

  const startTime = new Date();
  try {
    // Delete logs older than service retention period
    // Uses standard 7 days default if null (though schema defaults to 7)
    // Ensure org_id matches for safety
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

    return NextResponse.json({
      data: {
        deleted: result.rowCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('Cleanup failed:', error);
    try {
      await sql`
        INSERT INTO cron_runs (name, status, started_at, finished_at, meta_json)
        VALUES ('logs.cleanup', 'failed', ${startTime.toISOString()}, NOW(), ${JSON.stringify({ error: error.message })})
      `;
    } catch { /* ignore secondary failure */ }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Cleanup execution failed' },
      { status: 500 }
    );
  }
}
