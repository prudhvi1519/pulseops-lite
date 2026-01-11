# PulseOps Lite — Project Full Details

## 1. Technology Stack
- **Framework**: Next.js 15.1.3 (App Router)
- **Language**: TypeScript 5.7.2
- **UI Library**: React 19, Tailwind CSS
- **Database**: Postgres (Neon / Vercel Postgres)
- **ORM/Query**: Raw SQL via `@vercel/postgres` + Custom Migration System
- **Auth**: Custom RBAC (Session-based), `bcryptjs` for passwords
- **Validation**: `zod`
- **Testing**: `vitest`, `@testing-library/react`
- **Package Manager**: `pnpm`

## 2. Directory Structure & Key Files
- `app/`: Next.js App Router (UI + API)
  - `admin/`: Admin UI (Audit, Diagnostics, Notifications)
  - `dashboard/`: Main User Dashboard
  - `api/`: API Routes
    - `v1/`: Public/Core API (Logs, Rules, Notifications, GitHub)
    - `internal/`: Internal/Cron API (Cleanup, etc.)
- `lib/`: Shared Logic
  - `db/`: Database connection (`index.ts`) and migration runner (`migrate.ts`)
  - `auth/`: RBAC (`rbac.ts`), Session (`session.ts`), Password (`password.ts`)
- `db/`: Database Assets
  - `migrations/`: .sql migration files (0000-0011)
- `.github/workflows/`: Cron Jobs (GitHub Actions)

## 3. Database Schema (Postgres)
Migration-defined tables:
- `orgs`, `users`, `org_members`, `sessions` (Identity & RBAC)
- `services`, `environments`, `api_keys` (Core entities)
- `logs` (Time-series data, Partitioning capable, Indexed on `ts`, `level`, `scope`)
- `alert_rules`, `alert_firings` (Monitoring)
- `api_key_rate_buckets` (Rate limiting)
- `audit_logs`
- `deployments` (GitHub integration)

## 4. API Endpoints
### Ingestion & Monitoring (v1)
- `POST /api/v1/logs/ingest` (Verified: `app/api/v1/logs/ingest` exists)
- `POST /api/v1/rules/evaluate` (Cron triggered)
- `POST /api/v1/notifications/process` (Cron triggered)
- `POST /api/v1/github/webhook` (Deployment tracking)

### Internal
- `POST /api/internal/logs/cleanup`

### Admin/UI-Support
- `GET /api/diagnostics/summary`
- `GET /api/deployments/query`
- `GET /api/audit/query`

## 5. Security & Auth
- **User Auth**: Session-based, stored in `sessions` table.
- **Ingestion Auth**: API Key (hashed in DB).
- **Internal/Cron Auth**: `x-internal-cron-secret` header.
- **Deployment Bypass**: `x-vercel-protection-bypass` header/cookie.

## 6. GitHub Actions (Cron)
- `cron-rules-evaluate.yml`: Runs every 5 mins -> `/api/v1/rules/evaluate`
- `cron-notifications-process.yml`: Runs every 1 min -> `/api/v1/notifications/process`
- `cron-logs-cleanup.yml`: Runs daily? -> `/api/internal/logs/cleanup`

## 7. Configuration (Environment)
- `POSTGRES_URL`: DB Connection
- `AUTH_SECRET`: Session signing/encryption
- `API_KEY_SALT`: Hashing salt for API keys
- `CRON_SECRET` / `INTERNAL_CRON_SECRET`: Inter-service auth
- `VERCEL_PROTECTION_BYPASS`: For bypassing Vercel Authentication

## 8. Current Deployment
- **Platform**: Vercel
- **URL**: (Not yet linked/detected) -> Needs `vercel link` or check.
- **Status**: Fix-and-Ship mode active.
