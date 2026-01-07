-- Migration: 0005_github_integrations
-- Creates service_github_integrations table for mapping GitHub repos to services

CREATE TABLE IF NOT EXISTS service_github_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  repo_owner TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  environment_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT uq_service_github_integration_service UNIQUE(service_id)
);

-- Index for looking up integrations by repo when webhook arrives
CREATE INDEX IF NOT EXISTS idx_service_github_integrations_repo ON service_github_integrations(repo_owner, repo_name);
