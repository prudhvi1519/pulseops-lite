import { NextRequest, NextResponse } from 'next/server';
import { validateCronRequest } from '@/lib/cron/validation';
import { runRulesEvaluationJob } from '@/lib/cron/jobs/rules';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    return POST(req);
}

export async function POST(req: NextRequest) {
    const error = await validateCronRequest(req);
    if (error) return error;

    try {
        const result = await runRulesEvaluationJob();
        return NextResponse.json({ success: true, data: result });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}


