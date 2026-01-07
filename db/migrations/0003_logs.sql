-- Migration: 0003_logs
-- Creates logs table and rate limiting buckets

-- Logs table
CREATE TABLE IF NOT EXISTS logs (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  environment_id UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  meta_json JSONB,
  trace_id TEXT,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Primary query index: scope + time descending
CREATE INDEX IF NOT EXISTS logs_scope_ts_idx 
  ON logs(org_id, service_id, environment_id, ts DESC);

-- Org-wide time query index
CREATE INDEX IF NOT EXISTS logs_org_ts_idx 
  ON logs(org_id, ts DESC);

-- Level filtering index
CREATE INDEX IF NOT EXISTS logs_level_idx 
  ON logs(org_id, level, ts DESC);

-- Full-text search on message
CREATE INDEX IF NOT EXISTS logs_message_fts_idx 
  ON logs USING GIN (to_tsvector('simple', message));

-- Optional: JSONB index for meta queries
CREATE INDEX IF NOT EXISTS logs_meta_gin_idx 
  ON logs USING GIN (meta_json);

-- Rate limiting buckets (60-second windows)
CREATE TABLE IF NOT EXISTS api_key_rate_buckets (
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL,
  count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (api_key_id, window_start)
);
