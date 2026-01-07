-- Migration: 0009_notifications
-- Description: Adds tables for notification channels and transactional job queue.

-- Notification Channels
-- Stores configuration for external webhooks (Discord, Slack, etc.)
CREATE TABLE IF NOT EXISTS notification_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('discord', 'slack')),
    config_json JSONB NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification Jobs
-- Transactional queue for sending notifications with retries and backoff
CREATE TABLE IF NOT EXISTS notification_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- e.g., 'incident.created', 'high_severity_alert'
    payload_json JSONB NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    attempts INT DEFAULT 0,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient job polling and channel lookups
CREATE INDEX IF NOT EXISTS idx_notification_jobs_status_next_attempt ON notification_jobs(status, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_notification_channels_org_id ON notification_channels(org_id);
