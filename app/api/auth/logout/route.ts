import { withApiHandler } from '../../_utils/withApiHandler';
import { successResponse } from '../../_utils/response';
import {
    getSessionFromCookies,
    destroySession,
    clearSessionCookie,
} from '@/lib/auth/session';

/**
 * POST /api/auth/logout
 * Destroy the current session and clear the cookie.
 */
export const POST = withApiHandler(
    async (_request, { correlationId }) => {
        const session = await getSessionFromCookies();

        if (session) {
            await destroySession(session.id);
        }

        await clearSessionCookie();

        return successResponse({ ok: true }, correlationId);
    },
    { route: '/api/auth/logout' }
);
