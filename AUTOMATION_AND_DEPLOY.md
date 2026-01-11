# PulseOps Lite - Automation & Deployment

> CI/CD workflows, cron jobs, and deployment guide.

## GitHub Actions Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Trigger**: Push/PR to `main` branch

**Jobs**:
```yaml
ci:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:16
      env:
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: postgres
        POSTGRES_DB: pulseops_test
  env:
    POSTGRES_URL: postgres://postgres:postgres@localhost:5432/pulseops_test?sslmode=disable
    NODE_ENV: test
  steps:
    - Checkout
    - Setup Node.js 20
    - Setup pnpm 9
    - Install dependencies (--frozen-lockfile)
    - Lint (pnpm lint)
    - Type check (pnpm typecheck)
    - Run migrations (pnpm tsx lib/db/migrate.ts)
    - Test (pnpm test)
```

**Duration**: ~2-3 minutes

---

### 2. Logs Cleanup Cron (`.github/workflows/cron-logs-cleanup.yml`)

**Schedule**: Daily at midnight UTC (`0 0 * * *`)

**Target**: `POST /api/internal/logs/cleanup`

**Required Secrets**:
- `CRON_BASE_URL` - Production URL (e.g., `https://pulseops-lite.vercel.app`)
- `INTERNAL_CRON_SECRET` - Header value for `x-internal-cron-secret`
- `VERCEL_PROTECTION_BYPASS` - Bypass deployment protection if enabled

**Behavior**:
- Deletes logs older than each service's `retention_days` setting
- Logs deletion count to `cron_runs` table

---

### 3. Notifications Process Cron (`.github/workflows/cron-notifications-process.yml`)

**Schedule**: Every 5 minutes

**Target**: `POST /api/v1/notifications/process`

**Required Secrets**: Same as above

**Behavior**:
- Polls `notification_jobs` for pending jobs
- Delivers to Discord/Slack webhooks
- Implements exponential backoff for failures
- Max 5 attempts before marking as `failed`

---

### 4. Rules Evaluate Cron (`.github/workflows/cron-rules-evaluate.yml`)

**Schedule**: Every 5 minutes

**Target**: `POST /api/v1/rules/evaluate`

**Required Secrets**: Same as above

**Behavior**:
- Evaluates enabled `alert_rules`
- Counts errors in log tables within time windows
- Creates incidents when thresholds exceeded
- Respects cooldown periods to prevent duplicate alerts

---

## Deployment to Vercel

### Prerequisites
1. Vercel account with project linked
2. Vercel Postgres database provisioned
3. GitHub repository connected

### Environment Variables (Vercel Dashboard)

| Variable | Required | Source |
|----------|----------|--------|
| `POSTGRES_URL` | Yes | Vercel Postgres integration (auto-populated) |
| `AUTH_SECRET` | Yes | Generate: `openssl rand -base64 32` |
| `API_KEY_SALT` | Yes | Generate: `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_NAME` | No | Custom app name |
| `INTERNAL_CRON_SECRET` | Yes | Generate: `openssl rand -base64 32` |

### Deployment Steps

1. **Link Repository**:
   ```bash
   vercel link
   ```

2. **Set Environment Variables**:
   ```bash
   vercel env add AUTH_SECRET production
   vercel env add API_KEY_SALT production
   vercel env add INTERNAL_CRON_SECRET production
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

4. **Run Migrations** (one-time):
   ```bash
   # Connect to Vercel Postgres and run migrations
   vercel env pull .env.local
   pnpm db:migrate
   ```

5. **Configure GitHub Secrets** for cron workflows:
   - `CRON_BASE_URL`: Your production URL
   - `INTERNAL_CRON_SECRET`: Same value as Vercel env
   - `VERCEL_PROTECTION_BYPASS`: Get from Vercel dashboard if protection enabled

---

## Local Development

### Quick Start
```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local
# Edit .env.local with your values

# Run migrations
pnpm db:migrate

# Start dev server
pnpm dev
```

### With Local Postgres
```bash
# Start Postgres container
docker run -d \
  --name pulseops-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pulseops_dev \
  -p 5432:5432 \
  postgres:16

# Set connection string
export POSTGRES_URL="postgres://postgres:postgres@localhost:5432/pulseops_dev"
```

---

## Preview vs Production

| Aspect | Preview | Production |
|--------|---------|------------|
| Database | Shared Vercel Postgres (dev branch) | Production branch |
| Cookies | `secure: false` in dev | `secure: true` |
| Cron Jobs | Not executed | Scheduled via GitHub |
| Rate Limiting | Active | Active |
| Logging | Console | Console (Vercel logs) |

---

## Common Failure Modes & Debug Playbook

### 1. Database Connection Errors
**Symptoms**: 500 errors, "connection refused"
**Debug**:
```bash
# Check Vercel Postgres status
vercel postgres list

# Test connection
pnpm tsx -e "import { sql } from '@vercel/postgres'; console.log(await sql\`SELECT 1\`)"
```
**Fix**: Check `POSTGRES_URL` env var, verify Vercel Postgres is running

### 2. Auth Cookie Not Set
**Symptoms**: Login succeeds but redirects back to login
**Debug**: Check browser DevTools → Network → Response Headers for `Set-Cookie`
**Fix**: Ensure `NODE_ENV` is set, check HTTPS in production

### 3. Cron Jobs Failing
**Symptoms**: Logs not cleaned, notifications not sent
**Debug**:
```bash
# Manual trigger
curl -X POST "https://your-app.vercel.app/api/internal/logs/cleanup" \
  -H "x-internal-cron-secret: YOUR_SECRET"
```
**Fix**: Verify GitHub secrets, check Actions run logs

### 4. Rate Limit Hit
**Symptoms**: 429 responses from log ingest
**Debug**: Check `api_key_rate_buckets` table for current counts
**Fix**: Wait for window to reset (60 seconds) or increase limit

### 5. GitHub Webhook Failures
**Symptoms**: Deployments not appearing
**Debug**:
```bash
# Check GitHub → Repo → Settings → Webhooks → Recent Deliveries
```
**Fix**: Verify webhook secret matches `github_integrations.webhook_secret_hash`

---

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `pnpm dev` | Start Next.js dev server |
| Build | `pnpm build` | Production build |
| Lint | `pnpm lint` | ESLint check |
| Type check | `pnpm typecheck` | TypeScript check |
| Test | `pnpm test` | Run Vitest |
| Migrate | `pnpm db:migrate` | Run SQL migrations |
| Smoke check | `pnpm tsx scripts/smoke-prod-check.ts` | Verify production |
| E2E verify | `pnpm tsx scripts/verify-e2e.ts` | End-to-end verification |
