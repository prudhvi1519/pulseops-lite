CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL,
  actor_user_id UUID NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NULL,
  meta_json JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created_at ON audit_logs (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_action_created_at ON audit_logs (org_id, action, created_at DESC);
