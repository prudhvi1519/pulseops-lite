import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { runCleanupJob } from '@/lib/cron/jobs/cleanup';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-cron-secret');
  if (secret !== process.env.INTERNAL_CRON_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Missing or invalid secret' },
      { status: 401 }
    );
  }

  try {
    const result = await runCleanupJob();
    return NextResponse.json({
      data: result
    });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('Cleanup failed:', error);
    try {
      await sql`
        INSERT INTO cron_runs (name, status, started_at, finished_at, meta_json)
        VALUES ('logs.cleanup', 'failed', ${new Date().toISOString()}, NOW(), ${JSON.stringify({ error: error.message })})
      `;
    } catch { /* ignore secondary failure */ }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Cleanup execution failed' },
      { status: 500 }
    );
  }
}
