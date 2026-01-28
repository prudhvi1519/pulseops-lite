import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { runRulesEvaluationJob } from '@/lib/cron/jobs/rules';
import { getCorrelationId, withCorrelationId } from '@/app/api/_utils/correlation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const correlationId = getCorrelationId(request);
    const headers = withCorrelationId(correlationId, { 'Content-Type': 'application/json' });

    // 1. Security Check (Legacy Header)
    const INTERNAL_SECRET = process.env.INTERNAL_CRON_SECRET || 'super-secret-cron-key';
    const secret = request.headers.get('x-internal-cron-secret');
    if (secret !== INTERNAL_SECRET) {
        return NextResponse.json(
            { error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' }, correlationId },
            { status: 401, headers }
        );
    }

    try {
        const result = await runRulesEvaluationJob();
        return NextResponse.json({ data: result }, { status: 200, headers });

    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error('[Evaluator Error]', err);
        try {
            await sql`
                INSERT INTO cron_runs (name, status, started_at, finished_at, meta_json)
                VALUES ('rules.evaluate', 'failed', ${new Date().toISOString()}, NOW(), ${JSON.stringify({ error: err.message })})
            `;
        } catch { /* ignore */ }

        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Evaluation failed' }, correlationId },
            { status: 500, headers }
        );
    }
}
