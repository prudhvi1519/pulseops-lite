import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiHandler } from '../../_utils/withApiHandler';
import { successResponse, errorResponse, ErrorCodes } from '../../_utils/response';
import { sql } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, setSessionCookie } from '@/lib/auth/session';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/login
 * Authenticate user with email/password.
 */
export const POST = withApiHandler(
    async (request: NextRequest, { correlationId }) => {
        const body = await request.json();
        const parsed = loginSchema.safeParse(body);

        if (!parsed.success) {
            throw parsed.error;
        }

        const { email, password } = parsed.data;

        // Find user
        const userResult = await sql`
      SELECT id, email, name, password_hash
      FROM users
      WHERE email = ${email}
    `;

        if (userResult.rows.length === 0) {
            return errorResponse(
                ErrorCodes.UNAUTHORIZED,
                'Invalid email or password',
                correlationId,
                401
            );
        }

        const user = userResult.rows[0];

        // Verify password
        const isValid = await verifyPassword(password, user.password_hash);

        if (!isValid) {
            return errorResponse(
                ErrorCodes.UNAUTHORIZED,
                'Invalid email or password',
                correlationId,
                401
            );
        }

        // Get user's first org (by created_at)
        const orgResult = await sql`
      SELECT om.org_id
      FROM org_members om
      WHERE om.user_id = ${user.id}
      ORDER BY om.created_at ASC
      LIMIT 1
    `;

        const activeOrgId = orgResult.rows.length > 0 ? orgResult.rows[0].org_id : null;

        // Create session
        const { token } = await createSession(user.id, activeOrgId);

        // Set cookie
        await setSessionCookie(token);

        return successResponse(
            {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
                activeOrgId,
            },
            correlationId
        );
    },
    { route: '/api/auth/login' }
);
