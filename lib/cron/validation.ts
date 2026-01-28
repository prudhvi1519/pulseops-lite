import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates the request authentication for Cron Jobs.
 * Supports:
 * 1. Vercel Cron (Authorization: Bearer <CRON_SECRET>)
 * 2. Manual/Legacy (x-internal-cron-secret header)
 * 3. Query Param (secret=<INTERNAL_CRON_SECRET>) - for Vercel Cron via proxy
 */
export async function validateCronRequest(req: NextRequest): Promise<NextResponse | null> {
    const CRON_SECRET = process.env.CRON_SECRET;
    const INTERNAL_SECRET = process.env.INTERNAL_CRON_SECRET || 'super-secret-cron-key';

    // 1. Check Vercel Native Cron Secret (Authorization Header)
    const authHeader = req.headers.get('authorization');
    if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) {
        return null; // Authorized
    }

    // 2. Check Legacy Header (x-internal-cron-secret)
    const headerSecret = req.headers.get('x-internal-cron-secret');
    if (headerSecret === INTERNAL_SECRET) {
        return null; // Authorized
    }

    // 3. Check Query Parameter (secret)
    const url = new URL(req.url);
    const querySecret = url.searchParams.get('secret');
    if (querySecret === INTERNAL_SECRET) {
        return null; // Authorized
    }

    // Unauthorized
    return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing or invalid cron credentials' },
        { status: 401 }
    );
}
