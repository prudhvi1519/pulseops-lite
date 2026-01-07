import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiHandler } from '../../_utils/withApiHandler';
import { successResponse, errorResponse, ErrorCodes } from '../../_utils/response';
import { sql } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { createSession, setSessionCookie } from '@/lib/auth/session';

const signupSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().optional(),
});

/**
 * POST /api/auth/signup
 * Create a new user account with a default organization.
 */
export const POST = withApiHandler(
    async (request: NextRequest, { correlationId }) => {
        const body = await request.json();
        const parsed = signupSchema.safeParse(body);

        if (!parsed.success) {
            throw parsed.error;
        }

        const { email, password, name } = parsed.data;

        // Check if email already exists
        const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

        if (existingUser.rows.length > 0) {
            return errorResponse(
                ErrorCodes.BAD_REQUEST,
                'Email already registered',
                correlationId,
                400
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const userResult = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${email}, ${name || null}, ${passwordHash})
      RETURNING id, email, name
    `;
        const user = userResult.rows[0];

        // Create default org
        const orgName = name ? `${name}'s Org` : `${email.split('@')[0]}'s Org`;
        const orgResult = await sql`
      INSERT INTO orgs (name)
      VALUES (${orgName})
      RETURNING id, name
    `;
        const org = orgResult.rows[0];

        // Add user as admin of the org
        await sql`
      INSERT INTO org_members (org_id, user_id, role)
      VALUES (${org.id}, ${user.id}, 'admin')
    `;

        // Create session
        const { token } = await createSession(user.id, org.id);

        // Set cookie
        await setSessionCookie(token);

        return successResponse(
            {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
                org: {
                    id: org.id,
                    name: org.name,
                },
            },
            correlationId
        );
    },
    { route: '/api/auth/signup' }
);
