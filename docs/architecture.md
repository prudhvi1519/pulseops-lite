# PulseOps Lite Architecture

## High-Level Overview

PulseOps Lite is a Next.js application designed for observability and incident management. It ingests logs, evaluates rules, manages incidents, and integrates with external tools like GitHub and Slack/Discord.

```ascii
+----------------+      +------------------+       +-------------------+
|  Traffic / CLI | ---> |  Next.js API     | <---> |  Postgres DB      |
+----------------+      |  (App Router)    |       |  (Supabase/Local) |
                        +------------------+       +-------------------+
                                ^
                                | (Internal Cron)
                        +------------------+
                        |  Background Jobs |
                        |  (Vercel Cron)   |
                        +------------------+
```

## Request Flows

### 1. Log Ingestion
1.  **Client**: `POST /api/v1/logs/ingest` with API Key header.
2.  **Auth**: API Key validated against `api_keys` table (cached/optimized).
3.  **Storage**: Logs inserted into `logs` hypertable (TimescaleDB) or standard table.
4.  **UI**: `LogsExplorerClient` queries `/api/logs/query` with filters.

### 2. Rule Evaluation
1.  **Trigger**: Vercel Cron hits `/api/v1/rules/evaluate` every minute (secured by `INTERNAL_CRON_SECRET`).
2.  **Process**:
    *   Iterates active `alert_rules`.
    *   Queries `logs` table for matches within the lookback window.
    *   If threshold breached -> Create/Update `incidents` record.
    *   Inserts `cron_runs` record for diagnostics.

### 3. Notification Processing
1.  **Trigger**: Vercel Cron hits `/api/v1/notifications/process` every 5 minutes.
2.  **Process**:
    *   Fetches `pending` jobs from `notification_jobs`.
    *   Sends payload to configured Webhook (Discord/Slack).
    *   Updates job status (`sent`/`failed`).
    *   Retries with exponential backoff if failed.

### 4. Deployments (GitHub)
1.  **Trigger**: GitHub Webhook hits `/api/webhooks/github`.
2.  **Verify**: HMAC signature verified against `GITHUB_WEBHOOK_SECRET`.
3.  **Process**:
    *   Extracts commit/status info.
    *   Upserts `deployments` record.
    *   Records delivery in `webhook_deliveries` for idempotency.

## Security Model

### Tenancy & RBAC
*   **Organization Isolation**: All sensitive tables (`logs`, `incidents`) have `org_id`.
*   **RBAC**:
    *   `requireOrgRole('admin')`: Restricts access to Settings, Diagnostics, Audit Logs.
    *   `requireOrgRole('member')`: Access to Logs, Incidents (Read/Write).
*   **API Keys**: Scoped to an Organization. Hashed in DB (if implemented) or stored securely.

### Internal Endpoints
*   Cron endpoints (`/api/internal/*`, `/api/v1/rules/*`, etc.) are protected by checking `Authorization: Bearer <INTERNAL_CRON_SECRET>`.
