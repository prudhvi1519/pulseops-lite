# PulseOps Lite - Code Map

> File-by-file logic map with auth boundaries, dependencies, and hotspots.

## Quick Scan Table

| File | Purpose | Auth Boundary | Hotspots |
|------|---------|---------------|----------|
| `app/api/auth/login/route.ts` | Email/password authentication | Public | Password verification timing |
| `app/api/auth/signup/route.ts` | User registration + org creation | Public | - |
| `app/api/v1/logs/ingest/route.ts` | Log ingestion endpoint | API Key | Rate limiting, batch insert |
| `app/api/v1/github/webhook/route.ts` | GitHub webhook receiver | HMAC Signature | Idempotency, sig verification |
| `app/api/v1/rules/evaluate/route.ts` | Alert rule evaluation | Cron Secret | Complex query, incident creation |
| `app/api/internal/logs/cleanup/route.ts` | Log retention cleanup | Cron Secret | Batch deletion |
| `lib/auth/session.ts` | Session management | - | Token hashing, cookie security |
| `lib/auth/rbac.ts` | Role-based access control | - | Role hierarchy enforcement |
| `lib/keys/apiKey.ts` | API key hashing/verification | - | Salt requirement |

---

## API Layer (`app/api/`)

### Shared Utilities (`app/api/_utils/`)

#### `withApiHandler.ts`
- **Purpose**: Wrap route handlers with error handling, logging, correlation IDs
- **Key Exports**: `withApiHandler(handler, options)`
- **Dependencies**: `correlation.ts`, `logger.ts`, `response.ts`, `AuthError`
- **Lines**: ~100

#### `response.ts`
- **Purpose**: Standardized JSON response helpers
- **Key Exports**: `successResponse()`, `errorResponse()`, `ErrorCodes`
- **Lines**: ~50

#### `correlation.ts`
- **Purpose**: Extract/generate correlation IDs for request tracing
- **Key Exports**: `getCorrelationId()`, `withCorrelationId()`
- **Lines**: ~30

#### `logger.ts`
- **Purpose**: Structured logging with correlation context
- **Key Exports**: `createLogger()`, `logRequestComplete()`
- **Lines**: ~40

---

### Authentication Routes (`app/api/auth/`)

#### `login/route.ts`
- **Purpose**: Authenticate user with email/password
- **Method**: `POST /api/auth/login`
- **Auth**: Public
- **Request Schema**: `{ email: string, password: string }`
- **DB**: `users` (read), `org_members` (read), `sessions` (write)
- **Key Logic**: Password verification via bcrypt, session creation with SHA-256 hashed token
- **Lines**: 90

#### `signup/route.ts`
- **Purpose**: Register new user + create default org
- **Method**: `POST /api/auth/signup`
- **Auth**: Public
- **DB**: `users` (write), `orgs` (write), `org_members` (write)
- **Lines**: ~80

#### `logout/route.ts`
- **Purpose**: Destroy session and clear cookie
- **Method**: `POST /api/auth/logout`
- **Auth**: Authenticated
- **DB**: `sessions` (delete)
- **Lines**: ~30

---

### External APIs (`app/api/v1/`)

#### `logs/ingest/route.ts` ⚠️ HOTSPOT
- **Purpose**: High-volume log ingestion endpoint
- **Method**: `POST /api/v1/logs/ingest`
- **Auth**: API Key (`x-api-key` header)
- **Request Schema**: `{ logs: Array<{ timestamp, level, message, meta?, trace_id?, request_id? }> }`
- **Rate Limiting**: 1200 logs/minute per API key (atomic bucket upsert)
- **Payload Limit**: 256KB max
- **DB**: `api_keys` (read), `api_key_rate_buckets` (upsert), `logs` (batch insert)
- **Idempotency**: No built-in deduplication
- **Lines**: 156

#### `github/webhook/route.ts` ⚠️ HOTSPOT
- **Purpose**: Receive GitHub push/deployment webhooks
- **Method**: `POST /api/v1/github/webhook`
- **Auth**: HMAC-SHA256 signature (`x-hub-signature-256`)
- **DB**: `github_integrations`, `deployments`, `webhook_deliveries`
- **Idempotency**: Checks `webhook_deliveries` for duplicate `delivery_id`
- **Lines**: ~200

#### `rules/evaluate/route.ts` ⚠️ HOTSPOT
- **Purpose**: Cron-triggered alert rule evaluation
- **Method**: `POST /api/v1/rules/evaluate`
- **Auth**: Internal cron secret (`x-internal-cron-secret`)
- **DB**: `alert_rules`, `logs`, `alert_firings`, `incidents`
- **Key Logic**: Error count queries, cooldown checks, incident creation
- **Lines**: 253

#### `notifications/process/route.ts`
- **Purpose**: Cron-triggered notification job processor
- **Method**: `POST /api/v1/notifications/process`
- **Auth**: Internal cron secret
- **DB**: `notification_jobs`, `notification_channels`
- **Key Logic**: Exponential backoff retries, webhook delivery
- **Lines**: ~150

---

### Internal Routes (`app/api/internal/`)

#### `logs/cleanup/route.ts`
- **Purpose**: Delete logs older than retention period
- **Method**: `POST /api/internal/logs/cleanup`
- **Auth**: Internal cron secret
- **DB**: `services` (read retention_days), `logs` (batch delete)
- **Audit**: Logs deleted count to `cron_runs`
- **Lines**: ~80

---

### Resource Routes (`app/api/`)

#### Services (`app/api/services/`)
| Route | Method | Auth | DB Tables |
|-------|--------|------|-----------|
| `/api/services` | GET | Session+Org | `services` |
| `/api/services` | POST | Session+Org (Developer+) | `services`, `environments` |
| `/api/services/[serviceId]` | GET | Session+Org | `services` |
| `/api/services/[serviceId]/environments` | GET/POST | Session+Org | `environments` |
| `/api/services/[serviceId]/keys` | GET/POST | Session+Org | `api_keys` |
| `/api/services/[serviceId]/github` | GET/PUT | Session+Org (Admin) | `github_integrations` |

#### Incidents (`app/api/incidents/`)
| Route | Method | Auth | DB Tables |
|-------|--------|------|-----------|
| `/api/incidents/query` | GET | Session+Org | `incidents` |
| `/api/incidents/create` | POST | Session+Org (Developer+) | `incidents`, `incident_events` |
| `/api/incidents/[id]` | GET/PATCH | Session+Org | `incidents`, `incident_events` |

#### Alerts (`app/api/alerts/`)
| Route | Method | Auth | DB Tables |
|-------|--------|------|-----------|
| `/api/alerts/query` | GET | Session+Org | `alert_rules` |
| `/api/alerts/create` | POST | Session+Org (Admin) | `alert_rules` |
| `/api/alerts/[id]` | GET/PATCH/DELETE | Session+Org (Admin) | `alert_rules` |

#### Notifications (`app/api/notifications/`)
| Route | Method | Auth | DB Tables |
|-------|--------|------|-----------|
| `/api/notifications/channels/query` | GET | Session+Org | `notification_channels` |
| `/api/notifications/channels/create` | POST | Session+Org (Admin) | `notification_channels` |
| `/api/notifications/channels/[id]` | PATCH/DELETE | Session+Org (Admin) | `notification_channels` |
| `/api/notifications/jobs/recent` | GET | Session+Org (Admin) | `notification_jobs` |

---

## Lib Layer (`lib/`)

### `lib/auth/session.ts`
- **Purpose**: Session token generation, hashing, cookie management
- **Key Exports**: `createSession()`, `getSessionFromCookies()`, `setSessionCookie()`, `destroySession()`
- **Security**: SHA-256 hashing, httpOnly cookies, secure in production
- **Config**: 7-day expiry, `sameSite: 'lax'`
- **Lines**: 159

### `lib/auth/rbac.ts`
- **Purpose**: Role-based access control
- **Key Exports**: `requireSession()`, `requireOrgRole()`, `requireOrgMembership()`, `AuthError`
- **Role Hierarchy**: `admin (3) > developer (2) > viewer (1)`
- **DB**: `users`, `org_members`, `sessions`
- **Lines**: 213

### `lib/auth/password.ts`
- **Purpose**: Password hashing with bcrypt
- **Key Exports**: `hashPassword()`, `verifyPassword()`
- **Lines**: ~30

### `lib/keys/apiKey.ts`
- **Purpose**: API key generation and verification
- **Key Exports**: `generateApiKey()`, `hashApiKey()`, `verifyApiKey()`, `maskApiKey()`
- **Format**: `pol_<64-hex-chars>`
- **Security**: Salted SHA-256 hashing (requires `API_KEY_SALT` env)
- **Lines**: 91

### `lib/db/index.ts`
- **Purpose**: Database connector
- **Key Exports**: `sql` (re-exported from `@vercel/postgres`)
- **Lines**: 9

### `lib/db/migrate.ts`
- **Purpose**: Run SQL migrations in order
- **Usage**: `pnpm db:migrate` or `tsx lib/db/migrate.ts`
- **Lines**: ~60

### `lib/logs/types.ts`
- **Purpose**: Zod schemas for log ingestion
- **Key Exports**: `IngestBodySchema`, `BATCH_LIMITS`, `RATE_LIMIT`
- **Constants**: Max 100 logs/batch, 256KB payload, 1200 logs/minute
- **Lines**: ~50

---

## Components Layer (`components/`)

### UI Components (`components/ui/`)
| Component | Purpose | Props |
|-----------|---------|-------|
| `Badge.tsx` | Status/role badges | `variant`, `children` |
| `Button.tsx` | Primary/secondary buttons | `variant`, `size`, `loading` |
| `Card.tsx` | Content containers | `padding` |
| `CodeBlock.tsx` | Syntax-highlighted code | `code`, `language` |
| `Dialog.tsx` | Modal dialogs | `open`, `onClose`, `title` |
| `EmptyState.tsx` | Empty list placeholders | `title`, `description`, `icon` |
| `PageHeader.tsx` | Page titles | `title`, `description`, `children` |
| `SkeletonLoader.tsx` | Loading placeholders | `height`, `width` |
| `input.tsx` | Text inputs | Standard HTML props |
| `select.tsx` | Dropdown selects | Standard HTML props |
| `label.tsx` | Form labels | Standard HTML props |
| `alert.tsx` | Alert/info banners | `variant` |

### Feature Components

#### `AppShell.tsx`
- **Purpose**: Main layout wrapper (header/main/footer)
- **Lines**: 94

#### `components/logs/`
- `LogsExplorerClient.tsx` - Main logs page with filters
- `LogsTable.tsx` - Virtualized log table
- `FilterBar.tsx` - Level/time/search filters
- `LogDrawer.tsx` - Log detail side panel

#### `components/incidents/`
- `IncidentsClient.tsx` - Incident list with filters
- `IncidentDetailClient.tsx` - Single incident with events timeline

#### `components/deployments/`
- `DeploymentsClient.tsx` - Deployment history table

#### `components/admin/`
- `AuditLogsClient.tsx` - Audit log viewer (admin-only)
- `DiagnosticsClient.tsx` - System health diagnostics
- `NotificationsAdminClient.tsx` - Notification channel management

---

## Tests (`tests/`)

### API Tests (`tests/api/`) - 17 files
| Test File | Coverage |
|-----------|----------|
| `auth-tenancy.test.ts` | Auth flow, multi-org scoping |
| `services-keys.test.ts` | Service CRUD, API key management |
| `logs.test.ts` | Log ingestion edge cases |
| `logs.ingest.smoke.test.ts` | Happy path ingestion |
| `logs.query.smoke.test.ts` | Query filtering/pagination |
| `logs.cleanup.smoke.test.ts` | Retention cleanup |
| `incidents.smoke.test.ts` | Incident CRUD |
| `alerts.smoke.test.ts` | Alert rule CRUD |
| `alerts.to.incidents.smoke.test.ts` | Alert → Incident flow |
| `github.webhook.*.test.ts` | Webhook signature, idempotency |
| `notifications.process.smoke.test.ts` | Job processing |
| `rules.evaluate.smoke.test.ts` | Rule evaluation |
| `audit.smoke.test.ts` | Audit log recording |
| `health.test.ts` | Health endpoint |

### UI Tests (`tests/ui/`) - 8 files
| Test File | Coverage |
|-----------|----------|
| `home.test.tsx` | Landing page render |
| `logs.page.smoke.test.tsx` | Logs explorer |
| `incidents.page.smoke.test.tsx` | Incidents list |
| `incident.detail.smoke.test.tsx` | Incident detail |
| `deployments.page.smoke.test.tsx` | Deployments page |
| `admin.*.smoke.test.tsx` | Admin pages (audit, diagnostics, notifications) |
