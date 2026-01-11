/**
 * Database connector.
 * Re-exports sql from @vercel/postgres for use throughout the app.
 * 
 * Supports both POSTGRES_URL (preferred) and DATABASE_URL env vars.
 * @vercel/postgres reads POSTGRES_URL by default, so we alias DATABASE_URL
 * to POSTGRES_URL if only DATABASE_URL is set.
 */

// Ensure POSTGRES_URL is set if only DATABASE_URL is available
if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
    process.env.POSTGRES_URL = process.env.DATABASE_URL;
}

import { sql } from '@vercel/postgres';

export { sql };

