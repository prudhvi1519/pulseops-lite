import { NextRequest, NextResponse } from 'next/server';
import { validateCronRequest } from '@/lib/cron/validation';
import { runNotificationsJob } from '@/lib/cron/jobs/notifications';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const error = await validateCronRequest(req);
    if (error) return error;

    try {
        const result = await runNotificationsJob();
        return NextResponse.json({ success: true, data: result });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}


