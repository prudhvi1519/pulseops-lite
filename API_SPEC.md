# PulseOps Lite - API Specification

> Route-by-route, method-by-method API documentation.

## Authentication Methods

| Method | Header/Cookie | Used By |
|--------|---------------|---------|
| Session | `pulseops_session` cookie | Browser clients |
| API Key | `x-api-key` header | SDKs, log ingestion |
| HMAC Signature | `x-hub-signature-256` header | GitHub webhooks |
| Cron Secret | `x-internal-cron-secret` header | Scheduled jobs |

---

## Auth Endpoints (`/api/auth/`)

### POST `/api/auth/signup`
- **Purpose**: Register new user and create default organization
- **Auth**: Public
- **Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "Optional Name",
  "orgName": "My Organization"
}
```
- **Response** (201):
```json
{
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "name": "..." },
    "activeOrgId": "uuid"
  }
}
```
- **Errors**: `400 VALIDATION_ERROR`, `409 EMAIL_EXISTS`

### POST `/api/auth/login`
- **Purpose**: Authenticate with email/password
- **Auth**: Public
- **Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```
- **Response** (200):
```json
{
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "name": "..." },
    "activeOrgId": "uuid"
  }
}
```
- **Side Effect**: Sets `pulseops_session` cookie (7-day expiry)
- **Errors**: `401 UNAUTHORIZED`

### POST `/api/auth/logout`
- **Purpose**: Destroy session and clear cookie
- **Auth**: Session
- **Response** (200): `{ "data": { "success": true } }`

---

## User Endpoints

### GET `/api/me`
- **Purpose**: Get current user and active org context
- **Auth**: Session
- **Response** (200):
```json
{
  "data": {
    "user": { "id": "uuid", "email": "...", "name": "..." },
    "activeOrgId": "uuid",
    "activeOrgName": "My Organization",
    "role": "admin"
  }
}
```

---

## Organization Endpoints (`/api/orgs/`)

### GET `/api/orgs`
- **Purpose**: List user's organizations
- **Auth**: Session
- **Response**: `{ "data": [{ "orgId", "orgName", "role" }] }`

### GET `/api/orgs/active`
- **Purpose**: Get active org details with meta
- **Auth**: Session+Org

### PUT `/api/orgs/[orgId]/meta`
- **Purpose**: Update org metadata
- **Auth**: Session+Org (Admin)

---

## Service Endpoints (`/api/services/`)

### GET `/api/services`
- **Purpose**: List services in active org
- **Auth**: Session+Org
- **Query**: `?limit=50&offset=0`
- **Response**:
```json
{
  "data": {
    "services": [
      {
        "id": "uuid",
        "name": "my-service",
        "description": "...",
        "retention_days": 7,
        "created_at": "2026-01-01T00:00:00Z"
      }
    ],
    "total": 10
  }
}
```

### POST `/api/services`
- **Purpose**: Create new service with default environments
- **Auth**: Session+Org (Developer+)
- **Request**:
```json
{
  "name": "my-service",
  "description": "Optional description",
  "retention_days": 7
}
```
- **Side Effect**: Creates `production` and `staging` environments

### GET `/api/services/[serviceId]`
- **Purpose**: Get service details
- **Auth**: Session+Org

### GET `/api/services/[serviceId]/environments`
- **Purpose**: List environments for service
- **Auth**: Session+Org

### POST `/api/services/[serviceId]/environments`
- **Purpose**: Create new environment
- **Auth**: Session+Org (Developer+)

### GET `/api/services/[serviceId]/keys`
- **Purpose**: List API keys for service
- **Auth**: Session+Org

### POST `/api/services/[serviceId]/keys`
- **Purpose**: Create new API key
- **Auth**: Session+Org (Developer+)
- **Request**: `{ "environmentId": "uuid" }`
- **Response**: Returns plaintext key ONCE (not stored)

### PUT `/api/services/[serviceId]/github`
- **Purpose**: Configure GitHub integration
- **Auth**: Session+Org (Admin)
- **Request**: `{ "repo_owner": "...", "repo_name": "...", "webhook_secret": "..." }`

---

## Log Endpoints

### POST `/api/v1/logs/ingest` ⚠️ HIGH VOLUME
- **Purpose**: Ingest log entries
- **Auth**: API Key (`x-api-key`)
- **Rate Limit**: 1200 logs/minute per key
- **Payload Limit**: 256KB
- **Request**:
```json
{
  "logs": [
    {
      "timestamp": "2026-01-01T12:00:00Z",
      "level": "error",
      "message": "Something went wrong",
      "meta": { "user_id": "123" },
      "trace_id": "abc123",
      "request_id": "req-456"
    }
  ]
}
```
- **Response** (200): `{ "data": { "accepted": 5 } }`
- **Errors**: `401 UNAUTHORIZED`, `403 FORBIDDEN`, `413 PAYLOAD_TOO_LARGE`, `429 RATE_LIMITED`

**Example cURL**:
```bash
curl -X POST https://pulseops-lite.vercel.app/api/v1/logs/ingest \
  -H "x-api-key: pol_YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"logs":[{"timestamp":"2026-01-01T00:00:00Z","level":"info","message":"Hello"}]}'
```

### GET `/api/logs/query`
- **Purpose**: Query logs with filters
- **Auth**: Session+Org
- **Query Parameters**:
  - `serviceId` (optional)
  - `environmentId` (optional)
  - `level` (debug|info|warn|error)
  - `search` (full-text search)
  - `from`, `to` (ISO timestamps)
  - `limit`, `offset`
- **Response**: Paginated logs with total count

---

## Deployment Endpoints

### POST `/api/v1/github/webhook`
- **Purpose**: Receive GitHub push/deployment events
- **Auth**: HMAC-SHA256 (`x-hub-signature-256`)
- **Headers**:
  - `x-github-event`: push | deployment | deployment_status
  - `x-github-delivery`: Unique delivery ID (idempotency key)
- **Idempotency**: Duplicate deliveries are skipped

### GET `/api/deployments/query`
- **Purpose**: List deployments
- **Auth**: Session+Org
- **Query**: `?serviceId=...&limit=20`

---

## Incident Endpoints (`/api/incidents/`)

### GET `/api/incidents/query`
- **Purpose**: List incidents with filters
- **Auth**: Session+Org
- **Query**: `?status=open&serviceId=...&severity=high`

### POST `/api/incidents/create`
- **Purpose**: Create manual incident
- **Auth**: Session+Org (Developer+)
- **Request**:
```json
{
  "serviceId": "uuid",
  "environmentId": "uuid",
  "title": "Production outage",
  "description": "Optional details",
  "severity": "high"
}
```

### GET `/api/incidents/[id]`
- **Purpose**: Get incident with events timeline
- **Auth**: Session+Org

### PATCH `/api/incidents/[id]`
- **Purpose**: Update incident status
- **Auth**: Session+Org (Developer+)
- **Request**: `{ "status": "resolved" }` or `{ "status": "investigating" }`

---

## Alert Endpoints (`/api/alerts/`)

### GET `/api/alerts/query`
- **Purpose**: List alert rules
- **Auth**: Session+Org

### POST `/api/alerts/create`
- **Purpose**: Create alert rule
- **Auth**: Session+Org (Admin)
- **Request**:
```json
{
  "name": "High Error Rate",
  "type": "error_count",
  "params": { "threshold": 10, "window_minutes": 5 },
  "severity": "high",
  "serviceId": "uuid",
  "environmentId": "uuid",
  "cooldown_seconds": 300
}
```

### PATCH `/api/alerts/[id]`
- **Purpose**: Update alert rule
- **Auth**: Session+Org (Admin)

### DELETE `/api/alerts/[id]`
- **Purpose**: Delete alert rule
- **Auth**: Session+Org (Admin)

---

## Notification Endpoints (`/api/notifications/`)

### GET `/api/notifications/channels/query`
- **Purpose**: List notification channels
- **Auth**: Session+Org

### POST `/api/notifications/channels/create`
- **Purpose**: Create notification channel
- **Auth**: Session+Org (Admin)
- **Request**:
```json
{
  "type": "discord",
  "config": { "webhook_url": "https://discord.com/api/webhooks/..." }
}
```

### GET `/api/notifications/jobs/recent`
- **Purpose**: List recent notification jobs
- **Auth**: Session+Org (Admin)

---

## Internal/Cron Endpoints

### POST `/api/v1/rules/evaluate`
- **Purpose**: Evaluate alert rules and fire incidents
- **Auth**: Cron Secret (`x-internal-cron-secret`)
- **Schedule**: Every 5 minutes (via GitHub Actions)

### POST `/api/v1/notifications/process`
- **Purpose**: Process pending notification jobs
- **Auth**: Cron Secret
- **Schedule**: Every 5 minutes

### POST `/api/internal/logs/cleanup`
- **Purpose**: Delete logs past retention period
- **Auth**: Cron Secret
- **Schedule**: Daily at midnight UTC

---

## Admin Endpoints

### GET `/api/audit/query`
- **Purpose**: Query audit logs
- **Auth**: Session+Org (Admin)

### GET `/api/diagnostics/summary`
- **Purpose**: Get system health metrics
- **Auth**: Session+Org

### GET `/api/health`
- **Purpose**: Health check
- **Auth**: Public
- **Response**: `{ "status": "ok" }`

---

## Error Response Format

All errors follow this structure:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "path": "email", "message": "Invalid email" }]
  },
  "correlationId": "uuid"
}
```

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Missing/invalid auth |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Server error |
