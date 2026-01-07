import { NextRequest } from 'next/server';
import { withApiHandler } from '../_utils/withApiHandler';
import { successResponse } from '../_utils/response';

/**
 * GET /api/health
 * Returns system health status.
 */
export const GET = withApiHandler(
    async (_request: NextRequest, { correlationId }) => {
        return successResponse({ ok: true }, correlationId);
    },
    { route: '/api/health' }
);
