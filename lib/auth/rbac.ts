/**
 * RBAC (Role-Based Access Control) utilities.
 * Provides role definitions and access control helpers.
 */

import { sql } from '@/lib/db';
import { getSessionFromCookies, Session } from './session';

export type Role = 'admin' | 'developer' | 'viewer';

// Role hierarchy: admin > developer > viewer
const ROLE_LEVELS: Record<Role, number> = {
    admin: 3,
    developer: 2,
    viewer: 1,
};

export interface User {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
}

export interface OrgMembership {
    orgId: string;
    orgName: string;
    role: Role;
}

export interface AuthContext {
    session: Session;
    user: User;
}

export interface OrgContext extends AuthContext {
    orgId: string;
    orgName: string;
    role: Role;
}

/**
 * Check if a role meets the minimum required role.
 */
export function hasMinRole(userRole: Role, minRole: Role): boolean {
    return ROLE_LEVELS[userRole] >= ROLE_LEVELS[minRole];
}

/**
 * Get user by ID.
 */
export async function getUserById(userId: string): Promise<User | null> {
    const result = await sql`
    SELECT id, email, name, created_at
    FROM users
    WHERE id = ${userId}
  `;

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];
    return {
        id: row.id,
        email: row.email,
        name: row.name,
        createdAt: new Date(row.created_at),
    };
}

/**
 * Get user's membership for a specific org.
 */
export async function getOrgMembership(
    userId: string,
    orgId: string
): Promise<{ role: Role; orgName: string } | null> {
    const result = await sql`
    SELECT om.role, o.name as org_name
    FROM org_members om
    JOIN orgs o ON o.id = om.org_id
    WHERE om.user_id = ${userId} AND om.org_id = ${orgId}
  `;

    if (result.rows.length === 0) {
        return null;
    }

    return {
        role: result.rows[0].role as Role,
        orgName: result.rows[0].org_name,
    };
}

/**
 * Get all orgs a user is a member of.
 */
export async function getUserOrgs(userId: string): Promise<OrgMembership[]> {
    const result = await sql`
    SELECT o.id, o.name, om.role
    FROM org_members om
    JOIN orgs o ON o.id = om.org_id
    WHERE om.user_id = ${userId}
    ORDER BY om.created_at ASC
  `;

    return result.rows.map((row) => ({
        orgId: row.id,
        orgName: row.name,
        role: row.role as Role,
    }));
}

/**
 * Require an authenticated session.
 * Throws an error if not authenticated.
 */
export async function requireSession(): Promise<AuthContext> {
    const session = await getSessionFromCookies();

    if (!session) {
        throw new AuthError('UNAUTHORIZED', 'Authentication required');
    }

    const user = await getUserById(session.userId);

    if (!user) {
        throw new AuthError('UNAUTHORIZED', 'User not found');
    }

    return { session, user };
}

/**
 * Require an authenticated session with active org context.
 * Validates that the user is a member of the active org.
 * Optionally requires a minimum role.
 */
export async function requireOrgRole(minRole?: Role): Promise<OrgContext> {
    const { session, user } = await requireSession();

    if (!session.activeOrgId) {
        throw new AuthError('FORBIDDEN', 'No active organization');
    }

    const membership = await getOrgMembership(user.id, session.activeOrgId);

    if (!membership) {
        throw new AuthError('FORBIDDEN', 'Not a member of this organization');
    }

    if (minRole && !hasMinRole(membership.role, minRole)) {
        throw new AuthError(
            'FORBIDDEN',
            `Requires ${minRole} role or higher`
        );
    }

    return {
        session,
        user,
        orgId: session.activeOrgId,
        orgName: membership.orgName,
        role: membership.role,
    };
}

/**
 * Require membership in a specific org (different from active org).
 * Used for explicit [orgId] route parameters.
 */
export async function requireOrgMembership(
    orgId: string,
    minRole?: Role
): Promise<OrgContext> {
    const { session, user } = await requireSession();

    const membership = await getOrgMembership(user.id, orgId);

    if (!membership) {
        throw new AuthError('FORBIDDEN', 'Not a member of this organization');
    }

    if (minRole && !hasMinRole(membership.role, minRole)) {
        throw new AuthError(
            'FORBIDDEN',
            `Requires ${minRole} role or higher`
        );
    }

    return {
        session,
        user,
        orgId,
        orgName: membership.orgName,
        role: membership.role,
    };
}

/**
 * Custom error class for authentication/authorization errors.
 */
export class AuthError extends Error {
    constructor(
        public code: 'UNAUTHORIZED' | 'FORBIDDEN',
        message: string
    ) {
        super(message);
        this.name = 'AuthError';
    }
}
