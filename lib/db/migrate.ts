/**
 * Simple migration runner for /db/migrations.
 * Migrations are .sql files named with a numeric prefix (e.g., 0000_schema_migrations.sql).
 * Safe to re-run - skips already applied migrations.
 */

import { sql } from './index';
import * as fs from 'fs';
import * as path from 'path';

const MIGRATIONS_DIR = path.join(process.cwd(), 'db', 'migrations');

interface MigrationRecord {
    id: string;
    applied_at: Date;
}

/**
 * Ensure the schema_migrations table exists.
 */
async function ensureMigrationsTable(): Promise<void> {
    await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

/**
 * Get list of applied migrations.
 */
async function getAppliedMigrations(): Promise<Set<string>> {
    const result = await sql<MigrationRecord>`
    SELECT id FROM schema_migrations
  `;
    return new Set(result.rows.map((r) => r.id));
}

/**
 * Get list of pending migrations.
 */
function getPendingMigrations(applied: Set<string>): string[] {
    if (!fs.existsSync(MIGRATIONS_DIR)) {
        console.log('No migrations directory found');
        return [];
    }

    const files = fs.readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort();

    return files.filter((f) => {
        const id = f.replace('.sql', '');
        return !applied.has(id);
    });
}

/**
 * Run a single migration.
 */
async function runMigration(filename: string): Promise<void> {
    const id = filename.replace('.sql', '');
    const filepath = path.join(MIGRATIONS_DIR, filename);
    const content = fs.readFileSync(filepath, 'utf-8');

    console.log(`Running migration: ${id}`);

    // Execute the migration SQL
    await sql.query(content);

    // Record the migration as applied
    await sql`
    INSERT INTO schema_migrations (id) VALUES (${id})
  `;

    console.log(`Completed migration: ${id}`);
}

/**
 * Run all pending migrations.
 */
export async function migrate(): Promise<void> {
    console.log('Starting migrations...');

    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();
    const pending = getPendingMigrations(applied);

    if (pending.length === 0) {
        console.log('No pending migrations');
        return;
    }

    console.log(`Found ${pending.length} pending migration(s)`);

    for (const migration of pending) {
        await runMigration(migration);
    }

    console.log('All migrations complete');
}

// Run migrations if this file is executed directly
if (require.main === module) {
    migrate()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Migration failed:', err);
            process.exit(1);
        });
}
