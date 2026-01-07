-- Up Migration
CREATE TABLE incidents (
    id BIGSERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    environment_id UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'med', 'high')),
    status TEXT NOT NULL CHECK (status IN ('open', 'investigating', 'resolved')),
    source TEXT NOT NULL CHECK (source IN ('alert', 'manual', 'deployment')),
    rule_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE incident_events (
    id BIGSERIAL PRIMARY KEY,
    incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    actor_user_id UUID, -- Nullable for system events
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    meta_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_incidents_org_status_ts ON incidents(org_id, status, created_at DESC);
CREATE INDEX idx_incidents_org_svc_env_ts ON incidents(org_id, service_id, environment_id, created_at DESC);
CREATE INDEX idx_incident_events_incident_ts ON incident_events(incident_id, created_at ASC);

-- Down Migration
-- DROP TABLE incident_events;
-- DROP TABLE incidents;
