-- Up Migration
CREATE TABLE alert_rules (
    id BIGSERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    environment_id UUID REFERENCES environments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('error_count', 'deployment_failure')),
    params_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'med', 'high')),
    enabled BOOLEAN NOT NULL DEFAULT true,
    cooldown_seconds INT NOT NULL DEFAULT 300,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE alert_firings (
    id BIGSERIAL PRIMARY KEY,
    rule_id BIGINT NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
    fired_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    last_notified_at TIMESTAMPTZ,
    fingerprint TEXT NOT NULL,
    UNIQUE(rule_id, fingerprint)
);

CREATE INDEX idx_alert_rules_org_enabled ON alert_rules(org_id, enabled);
CREATE INDEX idx_alert_firings_rule_fired ON alert_firings(rule_id, fired_at DESC);

-- Down Migration
-- DROP TABLE alert_firings;
-- DROP TABLE alert_rules;
