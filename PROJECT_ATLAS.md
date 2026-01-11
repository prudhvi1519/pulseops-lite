# PulseOps Lite - Project Atlas

> **Generated**: 2026-01-11 | **Mode**: Audit-Only | **Repo**: [prudhvi1519/pulseops-lite](https://github.com/prudhvi1519/pulseops-lite)

## 1. Overview

**PulseOps Lite** is a lightweight operations monitoring platform built with Next.js 15 + React 19. It provides:

- **Log Ingestion & Exploration** - Ingest logs via API keys, search/filter with full-text search
- **Incident Management** - Manual/auto-created incidents with timeline events
- **Alert Rules** - Error count and deployment failure triggers
- **Deployment Tracking** - GitHub webhook integration for deployment events
- **Notification Delivery** - Discord/Slack webhook channels with retry queue
- **Multi-Tenant Architecture** - Org-scoped data with RBAC (admin/developer/viewer)

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  ┌────────────────────┐   │
│  │ Browser  │  │ CLI/SDK  │  │ GitHub Webhooks  │  │ Cron Workflows     │   │
│  │ (React)  │  │ (x-api-key)│  │ (HMAC signature)│  │ (x-internal-cron)  │   │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  └─────────┬──────────┘   │
└───────┼─────────────┼─────────────────┼──────────────────────┼──────────────┘
        │             │                 │                      │
        ▼             ▼                 ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            NEXT.JS APP (Vercel)                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌────────────────────┐   │
│  │   UI PAGES (.tsx)   │  │  API ROUTES (.ts)   │  │ INTERNAL ROUTES    │   │
│  │  /dashboard         │  │  /api/auth/*        │  │ /api/internal/*    │   │
│  │  /services          │  │  /api/services/*    │  │ /api/v1/rules/*    │   │
│  │  /logs              │  │  /api/v1/logs/*     │  │ /api/v1/notif/*    │   │
│  │  /incidents         │  │  /api/incidents/*   │  └────────────────────┘   │
│  │  /deployments       │  │  /api/v1/github/*   │                           │
│  │  /admin/*           │  │  /api/alerts/*      │                           │
│  └─────────────────────┘  └─────────────────────┘                           │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                           LIB LAYER                                     ││
│  │  lib/auth/session.ts   - Session token hashing & cookies                ││
│  │  lib/auth/rbac.ts      - Role checks: admin > developer > viewer        ││
│  │  lib/keys/apiKey.ts    - API key generation & salted hashing            ││
│  │  lib/db/index.ts       - Vercel Postgres connector                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │        VERCEL POSTGRES (Neon)       │
                    │  ┌─────────────────────────────────┐│
                    │  │ orgs, users, org_members        ││
                    │  │ sessions, services, environments││
                    │  │ api_keys, logs, deployments     ││
                    │  │ incidents, incident_events      ││
                    │  │ alert_rules, alert_firings      ││
                    │  │ notification_channels/jobs      ││
                    │  │ audit_logs, cron_runs           ││
                    │  └─────────────────────────────────┘│
                    └─────────────────────────────────────┘
```

---

## 3. Key Flows

### 3.1 Authentication Flow
1. User submits email/password to `POST /api/auth/login`
2. Server verifies password via bcrypt, creates session token (SHA-256 hashed)
3. Session stored in `sessions` table, cookie set with 7-day expiry
4. Subsequent requests use `getSessionFromCookies()` → `requireOrgRole()` for RBAC

### 3.2 Log Ingestion Flow
1. Client sends `POST /api/v1/logs/ingest` with `x-api-key` header
2. Server validates key format (`pol_*`), hashes with salt, looks up in `api_keys`
3. Rate limiting via atomic upsert to `api_key_rate_buckets` (1200 logs/minute)
4. Batch insert into `logs` table
5. Cron job `/api/v1/rules/evaluate` checks alert rules, fires incidents

### 3.3 Incident Lifecycle
1. Created via manual API or alert rule trigger
2. Events logged to `incident_events` timeline
3. Status transitions: `open` → `investigating` → `resolved`
4. Notification jobs queued for Discord/Slack webhooks

### 3.4 GitHub Integration
1. Configure webhook URL in GitHub repo settings
2. `POST /api/v1/github/webhook` receives push/deployment events
3. HMAC signature verified, deployment record created
4. Optionally triggers `deployment_failure` alert rules

---

## 4. Related Documentation

| Document | Description |
|----------|-------------|
| [CODEMAP.md](CODEMAP.md) | File-by-file logic map with auth boundaries |
| [API_SPEC.md](API_SPEC.md) | Route-by-route API specification |
| [UI_SPEC.md](UI_SPEC.md) | UI pages, components, and UX improvements |
| [DB_SCHEMA.md](DB_SCHEMA.md) | Database schema with indexes and constraints |
| [AUTOMATION_AND_DEPLOY.md](AUTOMATION_AND_DEPLOY.md) | CI/CD, cron jobs, and deployment guide |
| [SECURITY_REVIEW.md](SECURITY_REVIEW.md) | Security audit with hardening recommendations |
| [STATUS_AND_NEXT_STEPS.md](STATUS_AND_NEXT_STEPS.md) | Completion status and roadmap |

---

## 5. How to Navigate the Repo

```
pulseops-lite/
├── app/                  # Next.js App Router
│   ├── api/              # API routes (37 route handlers)
│   │   ├── _utils/       # Shared utilities (withApiHandler, response, logger)
│   │   ├── auth/         # Login, signup, logout
│   │   ├── v1/           # External APIs (logs/ingest, github/webhook)
│   │   └── internal/     # Cron-only endpoints
│   ├── dashboard/        # Main dashboard page
│   ├── services/         # Service management pages
│   ├── logs/             # Logs explorer
│   ├── incidents/        # Incident list and detail
│   └── admin/            # Admin pages (audit, diagnostics, notifications)
├── components/           # React components
│   ├── ui/               # Design system (Button, Card, Badge, etc.)
│   └── [feature]/        # Feature-specific components
├── lib/                  # Core utilities
│   ├── auth/             # Session, password, RBAC
│   ├── db/               # Database connector and migrator
│   └── keys/             # API key utilities
├── db/migrations/        # SQL migration files (0001-0012)
├── tests/                # Vitest tests
│   ├── api/              # API integration tests (17 files)
│   └── ui/               # Component smoke tests (8 files)
├── scripts/              # Utility scripts
└── .github/workflows/    # CI and cron workflows
```

---

## 6. Quick Start Commands

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev

# Run tests
pnpm test

# Lint and typecheck
pnpm lint && pnpm typecheck
```

---

## 7. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_URL` | Yes | Vercel Postgres connection string |
| `AUTH_SECRET` | Yes | Secret for session signing |
| `API_KEY_SALT` | Yes | Salt for API key hashing |
| `NEXT_PUBLIC_APP_NAME` | No | Displayed app name (default: PulseOps Lite) |
| `INTERNAL_CRON_SECRET` | Yes (prod) | Secret header for cron endpoints |
| `VERCEL_PROTECTION_BYPASS` | No | Bypass Vercel deployment protection |
