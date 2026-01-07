/**
 * API Key utilities.
 * Generates, hashes, and verifies API keys.
 */

import { sql } from '@/lib/db';

const KEY_PREFIX = 'pol_';
const KEY_LENGTH = 32;

/**
 * Generate a random API key with prefix.
 */
export function generateApiKey(): string {
    const bytes = new Uint8Array(KEY_LENGTH);
    crypto.getRandomValues(bytes);
    const randomPart = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    return `${KEY_PREFIX}${randomPart}`;
}

/**
 * Get the salt for hashing API keys.
 */
function getSalt(): string {
    const salt = process.env.API_KEY_SALT;
    if (!salt) {
        throw new Error('API_KEY_SALT environment variable is required');
    }
    return salt;
}

/**
 * Hash an API key for storage.
 */
export async function hashApiKey(rawKey: string): Promise<string> {
    const salt = getSalt();
    const encoder = new TextEncoder();
    const data = encoder.encode(rawKey + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify an API key and return the key record if valid.
 * Returns null if key is invalid or revoked.
 */
export async function verifyApiKey(rawKey: string): Promise<{
    id: string;
    orgId: string;
    serviceId: string;
    environmentId: string;
} | null> {
    // Validate key format
    if (!rawKey.startsWith(KEY_PREFIX)) {
        return null;
    }

    const keyHash = await hashApiKey(rawKey);

    const result = await sql`
    SELECT id, org_id, service_id, environment_id
    FROM api_keys
    WHERE key_hash = ${keyHash}
      AND revoked_at IS NULL
  `;

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];
    return {
        id: row.id,
        orgId: row.org_id,
        serviceId: row.service_id,
        environmentId: row.environment_id,
    };
}

/**
 * Mask an API key for display (show only first 8 chars + prefix).
 */
export function maskApiKey(_keyHash: string): string {
    // Since we only store hashes, we can't unmask
    // Return a consistent masked format
    return `${KEY_PREFIX}${'•'.repeat(8)}...`;
}
