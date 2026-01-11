# PulseOps Lite - Database Schema

> Complete schema documentation with relationships, indexes, and security analysis.

## Schema Source

- **ORM**: Raw SQL with `@vercel/postgres`
- **Migrations**: 13 files in `db/migrations/` (0000-0012)
- **Database**: Vercel Postgres (Neon-backed)

---

## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│    users     │       │     orgs     │       │   org_members    │
├──────────────┤       ├──────────────┤       ├──────────────────┤
│ id (PK)      │◄──────┤ id (PK)      │◄──────┤ org_id (FK)      │
│ email        │       │ name         │       │ user_id (FK)     │
│ name         │       │ created_at   │       │ role             │
│ password_hash│       └──────────────┘       │ created_at       │
│ created_at   │              ▲               └──────────────────┘
└──────────────┘              │                       │
       ▲                      │                       │
       │                      │                       ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│   sessions   │       │   services   │       │  environments    │
├──────────────┤       ├──────────────┤       ├──────────────────┤
│ id (PK)      │       │ id (PK)      │◄──────┤ id (PK)          │
│ user_id (FK) │       │ org_id (FK)  │       │ service_id (FK)  │
│ token_hash   │       │ name         │       │ name             │
│ active_org_id│───────│ description  │       │ created_at       │
│ expires_at   │       │ retention_days       └──────────────────┘
└──────────────┘       │ created_at   │              │
                       └──────────────┘              │
                              │                      ▼
                              │               ┌──────────────────┐
                              │               │    api_keys      │
                              │               ├──────────────────┤
                              └──────────────►│ id (PK)          │
                                              │ org_id (FK)      │
                                              │ service_id (FK)  │
                                              │ environment_id(FK│
                                              │ key_hash         │
                                              │ revoked_at       │
                                              └──────────────────┘
```

---

## Table Definitions

### Identity Tables

#### `orgs`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Org identifier |
| `name` | TEXT | NOT NULL | Organization name |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |

#### `users`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | User identifier |
| `email` | TEXT | NOT NULL, UNIQUE | Login email |
| `name` | TEXT | - | Display name |
| `password_hash` | TEXT | NOT NULL | bcrypt hash |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Registration time |

#### `org_members`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `org_id` | UUID | PK, FK → orgs(id) CASCADE | Organization |
| `user_id` | UUID | PK, FK → users(id) CASCADE | User |
| `role` | TEXT | NOT NULL, CHECK (admin/developer/viewer) | RBAC role |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Join time |

**Indexes**: `idx_org_members_user_id`

#### `sessions`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Session identifier |
| `user_id` | UUID | FK → users(id) CASCADE | Session owner |
| `session_token_hash` | TEXT | NOT NULL, UNIQUE | SHA-256 hash |
| `active_org_id` | UUID | FK → orgs(id) | Current org context |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Session start |
| `expires_at` | TIMESTAMPTZ | NOT NULL | Expiration (7 days) |

**Indexes**: `idx_sessions_user_id`, `idx_sessions_expires_at`

---

### Service Tables

#### `services`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Service identifier |
| `org_id` | UUID | FK → orgs(id) CASCADE | Owner org |
| `name` | TEXT | NOT NULL, UNIQUE(org_id, name) | Service name |
| `description` | TEXT | - | Optional description |
| `repo_url` | TEXT | - | GitHub repo URL |
| `retention_days` | INT | NOT NULL, DEFAULT 7 | Log retention |
| `created_by` | UUID | FK → users(id) | Creator |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation time |

**Indexes**: `idx_services_org_created`

#### `environments`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Environment identifier |
| `service_id` | UUID | FK → services(id) CASCADE | Parent service |
| `name` | TEXT | NOT NULL, UNIQUE(service_id, name) | Env name |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation time |

**Indexes**: `idx_environments_service`

#### `api_keys`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Key identifier |
| `org_id` | UUID | FK → orgs(id) CASCADE | Owner org |
| `service_id` | UUID | FK → services(id) CASCADE | Associated service |
| `environment_id` | UUID | FK → environments(id) CASCADE | Associated env |
| `key_hash` | TEXT | NOT NULL, UNIQUE | Salted SHA-256 |
| `revoked_at` | TIMESTAMPTZ | - | Revocation timestamp |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation time |

**Indexes**: `idx_api_keys_org_service_env`

---

### Logs Tables

#### `logs`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PK | Log entry ID |
| `org_id` | UUID | FK → orgs(id) CASCADE | Owner org |
| `service_id` | UUID | FK → services(id) CASCADE | Source service |
| `environment_id` | UUID | FK → environments(id) CASCADE | Source env |
| `ts` | TIMESTAMPTZ | NOT NULL | Log timestamp |
| `level` | TEXT | NOT NULL, CHECK (debug/info/warn/error) | Log level |
| `message` | TEXT | NOT NULL | Log message |
| `meta_json` | JSONB | - | Structured metadata |
| `trace_id` | TEXT | - | Distributed trace ID |
| `request_id` | TEXT | - | Request correlation |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Ingestion time |

**Indexes**:
- `logs_scope_ts_idx` → (org_id, service_id, environment_id, ts DESC) - Primary query
- `logs_org_ts_idx` → (org_id, ts DESC) - Org-wide queries
- `logs_level_idx` → (org_id, level, ts DESC) - Level filtering
- `logs_message_fts_idx` → GIN(to_tsvector('simple', message)) - Full-text search
- `logs_meta_gin_idx` → GIN(meta_json) - JSONB queries

#### `api_key_rate_buckets`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `api_key_id` | UUID | PK, FK → api_keys(id) CASCADE | API key |
| `window_start` | TIMESTAMPTZ | PK | 60-second window start |
| `count` | INT | NOT NULL, DEFAULT 0 | Logs in window |

---

### Deployment Tables

#### `deployments`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PK | Deployment ID |
| `org_id` | UUID | FK → orgs(id) CASCADE | Owner org |
| `service_id` | UUID | FK → services(id) CASCADE | Target service |
| `environment_id` | UUID | FK → environments(id) | Target env |
| `commit_sha` | TEXT | NOT NULL | Git commit |
| `commit_message` | TEXT | - | Commit message |
| `author` | TEXT | - | Commit author |
| `branch` | TEXT | - | Git branch |
| `status` | TEXT | NOT NULL, CHECK (pending/success/failure) | Deploy status |
| `github_delivery_id` | TEXT | - | Webhook delivery ID |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Deploy time |

**Indexes**: `idx_deployments_org_svc_ts`

#### `github_integrations`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Integration ID |
| `service_id` | UUID | FK → services(id) CASCADE, UNIQUE | Linked service |
| `repo_owner` | TEXT | NOT NULL | GitHub owner |
| `repo_name` | TEXT | NOT NULL | GitHub repo |
| `webhook_secret_hash` | TEXT | NOT NULL | HMAC secret hash |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation time |

#### `webhook_deliveries`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Delivery ID |
| `delivery_id` | TEXT | NOT NULL, UNIQUE | GitHub delivery ID |
| `integration_id` | UUID | FK → github_integrations(id) | Source integration |
| `event_type` | TEXT | NOT NULL | push/deployment/etc |
| `payload_hash` | TEXT | - | Payload hash for debugging |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Received time |

---

### Incident Tables

#### `incidents`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PK | Incident ID |
| `org_id` | UUID | FK → orgs(id) CASCADE | Owner org |
| `service_id` | UUID | FK → services(id) CASCADE | Affected service |
| `environment_id` | UUID | FK → environments(id) CASCADE | Affected env |
| `title` | TEXT | NOT NULL | Incident title |
| `description` | TEXT | - | Detailed description |
| `severity` | TEXT | NOT NULL, CHECK (low/med/high) | Severity level |
| `status` | TEXT | NOT NULL, CHECK (open/investigating/resolved) | Current status |
| `source` | TEXT | NOT NULL, CHECK (alert/manual/deployment) | Creation source |
| `fingerprint` | TEXT | - | Deduplication key |
| `rule_id` | BIGINT | - | Triggering alert rule |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation time |
| `resolved_at` | TIMESTAMPTZ | - | Resolution time |

**Indexes**: `idx_incidents_org_status_ts`, `idx_incidents_org_svc_env_ts`

#### `incident_events`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PK | Event ID |
| `incident_id` | BIGINT | FK → incidents(id) CASCADE | Parent incident |
| `actor_user_id` | UUID | FK → users(id) | Actor (null for system) |
| `type` | TEXT | NOT NULL | Event type |
| `message` | TEXT | NOT NULL | Event message |
| `meta_json` | JSONB | - | Additional data |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Event time |

**Indexes**: `idx_incident_events_incident_ts`

---

### Alert Tables

#### `alert_rules`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PK | Rule ID |
| `org_id` | UUID | FK → orgs(id) CASCADE | Owner org |
| `service_id` | UUID | FK → services(id) CASCADE | Optional service scope |
| `environment_id` | UUID | FK → environments(id) CASCADE | Optional env scope |
| `name` | TEXT | NOT NULL | Rule name |
| `type` | TEXT | NOT NULL, CHECK (error_count/deployment_failure) | Rule type |
| `params_json` | JSONB | NOT NULL, DEFAULT '{}' | Rule parameters |
| `severity` | TEXT | NOT NULL, CHECK (low/med/high) | Incident severity |
| `enabled` | BOOLEAN | NOT NULL, DEFAULT true | Active flag |
| `cooldown_seconds` | INT | NOT NULL, DEFAULT 300 | Re-fire cooldown |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation time |

**Indexes**: `idx_alert_rules_org_enabled`

#### `alert_firings`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PK | Firing ID |
| `rule_id` | BIGINT | FK → alert_rules(id) CASCADE | Triggering rule |
| `fired_at` | TIMESTAMPTZ | NOT NULL | Fire timestamp |
| `resolved_at` | TIMESTAMPTZ | - | Resolution time |
| `last_notified_at` | TIMESTAMPTZ | - | Last notification |
| `fingerprint` | TEXT | NOT NULL, UNIQUE(rule_id) | Dedup key |

**Indexes**: `idx_alert_firings_rule_fired`

---

### Notification Tables

#### `notification_channels`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Channel ID |
| `org_id` | UUID | FK → orgs(id) CASCADE | Owner org |
| `type` | VARCHAR(50) | NOT NULL, CHECK (discord/slack) | Channel type |
| `config_json` | JSONB | NOT NULL | { webhook_url: "..." } |
| `enabled` | BOOLEAN | DEFAULT true | Active flag |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation time |

**Indexes**: `idx_notification_channels_org_id`

#### `notification_jobs`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Job ID |
| `org_id` | UUID | FK → orgs(id) CASCADE | Owner org |
| `type` | VARCHAR(50) | NOT NULL | incident.created, etc |
| `payload_json` | JSONB | NOT NULL | Job payload |
| `status` | VARCHAR(50) | NOT NULL, CHECK (pending/processing/sent/failed) | Job status |
| `attempts` | INT | DEFAULT 0 | Retry count |
| `next_attempt_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Next attempt time |
| `last_error` | TEXT | - | Last error message |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation time |

**Indexes**: `idx_notification_jobs_status_next_attempt`

---

### Audit Tables

#### `audit_logs`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PK | Log ID |
| `org_id` | UUID | FK → orgs(id) CASCADE | Owner org |
| `actor_user_id` | UUID | FK → users(id) | Acting user |
| `action` | TEXT | NOT NULL | Action type |
| `resource_type` | TEXT | NOT NULL | Resource type |
| `resource_id` | TEXT | - | Resource ID |
| `meta_json` | JSONB | - | Additional data |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Event time |

#### `cron_runs`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PK | Run ID |
| `job_name` | TEXT | NOT NULL | Job identifier |
| `status` | TEXT | NOT NULL | success/failure |
| `duration_ms` | INT | - | Execution time |
| `meta_json` | JSONB | - | Run details |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Run time |

---

## Multi-Tenant Scoping Strategy

All data tables include `org_id` foreign key for tenant isolation:

| Table | Scoped By | Enforcement |
|-------|-----------|-------------|
| `services` | org_id | API layer via `requireOrgRole()` |
| `environments` | service_id → org_id | Cascading from service |
| `api_keys` | org_id + service_id | Double-scoped |
| `logs` | org_id + service_id + environment_id | Triple-scoped |
| `incidents` | org_id | API layer |
| `alert_rules` | org_id | API layer |
| `notification_channels` | org_id | API layer |
| `notification_jobs` | org_id | API layer |
| `audit_logs` | org_id | API layer |

---

## Danger Zones ⚠️

| Issue | Table | Risk | Recommendation |
|-------|-------|------|----------------|
| Missing org_id validation | `/api/v1/logs/ingest` | API key could write to wrong org | ✅ Already scoped via key lookup |
| No cascade on environment delete | `logs` | Orphaned logs | Logs table has CASCADE |
| Unbounded log growth | `logs` | Storage exhaustion | ✅ Cron cleanup respects retention_days |
| No index on logs.ts alone | `logs` | Slow org-wide time range queries | Consider adding if needed |
| webhook_secret stored as hash | `github_integrations` | Cannot verify without raw secret | Expected behavior - hash compared at verification |
