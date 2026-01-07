-- Migration: 0000_schema_migrations
-- Creates the schema_migrations table for tracking applied migrations.

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);
