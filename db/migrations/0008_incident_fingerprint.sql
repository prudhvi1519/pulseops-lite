-- Up Migration
ALTER TABLE incidents ADD COLUMN fingerprint TEXT;

-- Index for finding duplicate OPEN/INVESTIGATING incidents for a specific rule/org
CREATE INDEX idx_incidents_dedupe ON incidents (org_id, rule_id, fingerprint, status)
WHERE status IN ('open', 'investigating');

-- Down Migration
-- DROP INDEX idx_incidents_dedupe;
-- ALTER TABLE incidents DROP COLUMN fingerprint;
