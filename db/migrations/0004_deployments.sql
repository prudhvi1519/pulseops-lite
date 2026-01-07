-- Migration: 0004_deployments
-- Creates deployments and webhook_deliveries tables

-- Deployments Table
CREATE TABLE IF NOT EXISTS deployments (
    id BIGSERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    environment_id UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('success', 'fail', 'in_progress', 'queued')),
    commit_sha TEXT,
    commit_message TEXT,
    actor TEXT,
    url TEXT,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient dashboard queries
-- 1. Get recent deployments for a specific environment
CREATE INDEX IF NOT EXISTS idx_deployments_org_svc_env_created 
ON deployments(org_id, service_id, environment_id, created_at DESC);

-- 2. Get recent deployments for an org (activity feed)
CREATE INDEX IF NOT EXISTS idx_deployments_org_created 
ON deployments(org_id, created_at DESC);

-- Webhook Idempotency Table
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id BIGSERIAL PRIMARY KEY,
    provider TEXT NOT NULL, -- e.g. 'github'
    delivery_id TEXT NOT NULL,
    event TEXT NOT NULL,
    payload_hash TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(provider, delivery_id)
);

-- Index for delivery lookup
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_provider_id 
ON webhook_deliveries(provider, delivery_id);
