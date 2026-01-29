import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Validates the request authentication for Cron Jobs.
 * Strict Mode:
 * 1. Method: POST only.
 * 2. Auth: Header 'x-internal-cron-secret' only.
 */
export async function validateCronRequest(req: NextRequest): Promise<NextResponse | null> {
    // 1. Enforce POST
    if (req.method !== 'POST') {
        return NextResponse.json({ error: 'Method Not Allowed', message: 'Only POST is allowed' }, { status: 405 });
    }

    const INTERNAL_SECRET = process.env.INTERNAL_CRON_SECRET;
    if (!INTERNAL_SECRET) {
        console.error('INTERNAL_CRON_SECRET is not configured on server');
        return NextResponse.json({ error: 'Server Configuration Error', message: 'Cron secret not configured' }, { status: 500 });
    }

    // 2. Check Header (x-internal-cron-secret) with Timing Safe Compare
    const headerSecret = req.headers.get('x-internal-cron-secret');
    if (!headerSecret) {
        return NextResponse.json({ error: 'Unauthorized', message: 'Missing cron credentials' }, { status: 401 });
    }

    const expected = Buffer.from(INTERNAL_SECRET);
    const actual = Buffer.from(headerSecret);

    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
        return NextResponse.json({ error: 'Unauthorized', message: 'Invalid cron credentials' }, { status: 401 });
    }

    return null; // Authorized
}
