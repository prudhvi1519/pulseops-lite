# Runbook

## Local Development

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL database (or Vercel Postgres)

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your database connection
```

### Running the Application

```bash
# Development server
pnpm dev

# Production build
pnpm build
pnpm start
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Code Quality

```bash
# Lint check
pnpm lint

# Type check
pnpm typecheck
```

---

## Database Migrations

```bash
# Run pending migrations
pnpm tsx lib/db/migrate.ts
```

Migrations are located in `db/migrations/` and are applied in alphabetical order.

---

## Debugging

### Request Tracing with Correlation IDs

All API requests include a correlation ID for tracing:

1. **Incoming requests**: If the client sends `x-correlation-id` header, it's preserved
2. **Generated IDs**: If no correlation ID is provided, a UUID is generated
3. **Response headers**: All responses include `x-correlation-id`
4. **Error responses**: The correlation ID is also included in the error body

**Example request with custom correlation ID:**
```bash
curl -H "x-correlation-id: my-trace-123" http://localhost:3000/api/health
```

**Example response:**
```json
{
  "data": { "ok": true }
}
```
Response headers will include: `x-correlation-id: my-trace-123`

### Structured Logs

All API routes produce structured JSON logs including:
- `timestamp`: ISO 8601 timestamp
- `correlationId`: Request correlation ID
- `route`: API route path
- `method`: HTTP method
- `durationMs`: Request duration in milliseconds

---

## Health Check

```bash
# Check system health
curl http://localhost:3000/api/health

# Expected response
{"data":{"ok":true}}
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
npx kill-port 3000
```

### Database Connection### Deployment
- **Vercel**: `git push` to `main` triggers deployment
- **Database**: Schema changes managed by `drizzle-kit`

## Debugging Guide

### Logs Not Appearing
1.  **Check API Key**: Ensure the script/agent is using a valid, active API Key.
2.  **Check Filters**: Clear all UI filters in `Limits` or `Time Range`.
3.  **Check Retention**: Are the logs older than the query window?
4.  **Inspect Response**: Use the "Curl" snippet in the empty state to manually send a log and check the HTTP 200 response.

### Incidents Not Created
1.  **Check Rule Status**: Is the alert rule enabled?
2.  **Check Diagnostics**: Go to `/admin/diagnostics`.
    *   Is `rules.evaluate` running successfully?
    *   Does it show `evaluated > 0` and `triggered > 0`?
3.  **Thresholds**: Verify the query actually produces count > threshold.
4.  **Cooldown**: If an incident is already OPEN, a new one won't be created until it is resolved or the cooldown period passes.

### Notifications Not Sent
1.  **Queue Depth**: Check `/admin/diagnostics` for "Notification Queue".
    *   High "Pending"? The cron `notifications.process` might be stuck or not running.
    *   High "Failed"? Check the `last_error` in the diagnostics table.
2.  **Channel Config**: Test the Discord/Slack webhook URL manually with `curl`.
3.  **Job Status**: Check the `notification_jobs` table (via Admin UI if available, or DB).

### GitHub Deployments Missing
1.  **Webhook Config**: Ensure GitHub Repo -> Settings -> Webhooks is pointing to `https://<your-domain>/api/webhooks/github`.
2.  **Content Type**: Must be `application/json`.
3.  **Secret**: The `Secret` field in GitHub must match `GITHUB_WEBHOOK_SECRET` env var.
4.  **Events**: Ensure `Deployment` and `Deployment Status` events are checked.

### Diagnostics Page Interpretation
*   **Cron Status**: "Success" means the job ran without throwing.
*   **Meta JSON**: Click to see details like `deleted_count` or `processed_count`.
*   **Red Flags**:
    *   "Last Run" > 10 minutes ago (Cron failure).
    *   "Failed" status consistently.
    *   Notification Queue > 100 (Backlog).
- For Vercel Postgres, ensure you're using the correct connection string

---

## Production Setup

### 1. Environment Variables
Configure these in your Hosting Platform (e.g., Vercel) and local `.env.production`.

| Variable | Description |
| :--- | :--- |
| `POSTGRES_URL` | Connection string for PostgreSQL (e.g. Vercel Postgres) |
| `INTERNAL_CRON_SECRET` | Strong random string to secure internal cron endpoints |
| `NEXTAUTH_SECRET` | (If Auth is used) Random string for session encryption |
| `GITHUB_WEBHOOK_SECRET` | Secret used to verify GitHub Webhook signatures |
| `CRON_BASE_URL` | The public URL of your deployed app (e.g., `https://pulseops.vercel.app`) - Used by GitHub Actions |

### 2. Vercel / Hosting Setup
1.  **Import Project**: Connect your GitHub repository to Vercel.
2.  **Env Vars**: Add the variables listed above in Project Settings -> Environment Variables.
3.  **Database**: Ensure migration is applied (`pnpm tsx lib/db/migrate.ts`).

### 3. GitHub Actions (Cron) Setup
To enable background jobs (Log Cleanup, Notification Processing, Rule Evaluation), you must configure Secrets in your GitHub Repository.
1.  Go to **Settings** -> **Secrets and variables** -> **Actions**.
2.  Add `CRON_BASE_URL`: Your production URL (no trailing slash).
3.  Add `INTERNAL_CRON_SECRET`: Must match the value in your Vercel env vars.

### 4. GitHub Webhook Setup
To receive deployment status updates:
1.  Go to GitHub Repo -> **Settings** -> **Webhooks** -> **Add webhook**.
2.  **Payload URL**: `https://<your-domain>/api/webhooks/github`
3.  **Content type**: `application/json`
4.  **Secret**: Must match `GITHUB_WEBHOOK_SECRET`.
5.  **Events**: Select "Let me select individual events" -> Check **Deployments** and **Deployment statuses**.

### 5. Verification (Smoke Check)
We provide a script to valid a running deployment.

**Usage:**
```bash
# Basic Health Check
BASE_URL=https://your-app.com npx tsx scripts/smoke-prod-check.ts

# Full Check (including Cron endpoints)
BASE_URL=https://your-app.com INTERNAL_CRON_SECRET=xyz npx tsx scripts/smoke-prod-check.ts
```

---

## Logs Cleanup

We enforce a retention policy (default 7 days) on all logs to manage storage costs.

### Automated Cleanup
- **Mechanism**: GitHub Action `cron-logs-cleanup.yml` runs daily.
- **Endpoint**: `POST /api/internal/logs/cleanup`
- **Auth**: Requires `x-internal-cron-secret` header.

### Manual Cleanup
If storage fills up or cron fails, trigger manually:
1. Go to GitHub Actions -> Logs Retention Cleanup -> Run workflow.
2. OR run via curl:
   ```bash
   curl -X POST https://your-domain.com/api/internal/logs/cleanup \
     -H "x-internal-cron-secret: YOUR_SECRET"
   ```

---

## GitHub Webhooks

We receive webhooks from GitHub for deployment automation.

### Secret Rotation
1. Update `GITHUB_WEBHOOK_SECRET` in `.env.local` (and Vercel).
2. Update the Webhook Secret in GitHub Repository Settings.

### Handling Retries
- GitHub may deliver the same webhook multiple times.
- We use the `webhook_deliveries` table to track `X-GitHub-Delivery` ID.
- Duplicate deliveries are processed idempotently (ignored if already successful or returned 2xx).
