import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Validates the request authentication for Cron Jobs.
 * Request must be POST.
 * Supports:
 * 1. Vercel Cron (Authorization: Bearer <CRON_SECRET>)
 * 2. Query Param (cron_secret=<INTERNAL_CRON_SECRET>)
 */
export async function validateCronRequest(req: NextRequest): Promise<NextResponse | null> {
    // 1. Enforce POST
    if (req.method !== 'POST') {
        return NextResponse.json({ error: 'Method Not Allowed', message: 'Only POST is allowed' }, { status: 405 });
    }

    const CRON_SECRET = process.env.CRON_SECRET;
    const INTERNAL_SECRET = process.env.INTERNAL_CRON_SECRET || 'super-secret-cron-key';

    // 2. Check Vercel Native Cron Secret (Authorization Header)
    const authHeader = req.headers.get('authorization');
    if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) {
        return null; // Authorized
    }

    // 3. Check Query Parameter (cron_secret) with Timing Safe Compare
    const url = new URL(req.url);
    const querySecret = url.searchParams.get('cron_secret');

    if (querySecret) {
        const expected = Buffer.from(INTERNAL_SECRET);
        const actual = Buffer.from(querySecret);

        if (expected.length === actual.length && crypto.timingSafeEqual(expected, actual)) {
            return null; // Authorized
        }
    }

    // Unauthorized
    return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing or invalid cron credentials' },
        { status: 401 }
    );
}
