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
    // 1. Check Method (Allow GET for Vercel Cron, POST for manual)
    // Vercel Cron sends GET requests. We must allow GET.
    if (req.method !== 'POST' && req.method !== 'GET') {
        return NextResponse.json({ error: 'Method Not Allowed', message: 'Only POST and GET are allowed' }, { status: 405 });
    }

    const CRON_SECRET = process.env.CRON_SECRET;
    const INTERNAL_SECRET = process.env.INTERNAL_CRON_SECRET;
    if (!INTERNAL_SECRET) {
        console.warn('INTERNAL_CRON_SECRET is not set');
    }

    // 2. Check Vercel Native Cron Secret (Authorization Header)
    const authHeader = req.headers.get('authorization');
    if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) {
        return null; // Authorized
    }

    const url = new URL(req.url);
    const querySecret = url.searchParams.get('cron_secret');

    if (querySecret) {
        if (!INTERNAL_SECRET) {
            console.error('INTERNAL_CRON_SECRET is not configured on server');
            return NextResponse.json({ error: 'Server Configuration Error', message: 'Cron secret not configured' }, { status: 500 });
        }
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
