# PulseOps Lite - Landing Page Copy Pack

> **PULSEOPS_LANDING_03_COPY_PACK_CUTE**  
> UX writer + career coach output

---

## 1. Navbar Labels

| Element | Label |
|---------|-------|
| Logo | **PulseOps** (with subtle "Lite" badge) |
| Link 1 | Features |
| Link 2 | Demo |
| Link 3 | Under the Hood |
| Link 4 | Stack |
| Button (Secondary) | Log in |
| Button (Primary) | Get Started |

---

## 2. Hero Section

### Headline
```
Ship with confidence.
Debug with context.
```

### Subheadline
```
PulseOps Lite is an open-source operations platform for logs, incidents, and deployments. Multi-tenant by design. Built like a real production system—because it is one.
```

### Primary CTA
```
Open App →
```
*Links to: /login (or /signup if not authenticated)*

### Secondary CTA
```
View PRD Showcase ↓
```
*Scrolls to: #prd-showroom*

### Trust Badges (6)

| Badge | Icon |
|-------|------|
| `Open Source` | GitHub icon |
| `Multi-Tenant` | Users icon |
| `RBAC Enforced` | Shield icon |
| `Rate Limited` | Gauge icon |
| `Vercel Deployed` | Vercel logo |
| `Neon Postgres` | Database icon |

---

## 3. Credibility Strip ("Built Like a Real System")

```
✓ 13 SQL Migrations  •  ✓ 37 API Routes  •  ✓ 16 DB Tables  •  ✓ 25+ Tests  •  ✓ 4 Cron Jobs
```

**Hover tooltips** (optional):
- "13 SQL Migrations" → "Identity, services, logs, incidents, alerts, notifications..."
- "37 API Routes" → "Auth, CRUD, webhooks, internal cron endpoints"
- "16 DB Tables" → "All scoped by org_id for multi-tenancy"
- "25+ Tests" → "API integration + UI smoke tests"
- "4 Cron Jobs" → "Rules eval, notifications, cleanup, webhooks"

---

## 4. Feature Grid (8 Cards)

### Card 1: Multi-Tenant Orgs
**Title**: Organizations & Teams  
**Description**: Create orgs, invite members, switch contexts. Every row scoped by `org_id`.  
**Proof Hook**: See migration → `0001_identity.sql`

### Card 2: Role-Based Access
**Title**: RBAC Built In  
**Description**: Admin, Developer, Viewer. Checked server-side on every request. No client-only gates.  
**Proof Hook**: Inspect → `lib/auth/rbac.ts`

### Card 3: Log Ingestion API
**Title**: Log Ingestion  
**Description**: POST logs with `x-api-key`. Rate limited to 1,200/min. Keys shown once, stored hashed.  
**Proof Hook**: Try the cURL → #proof-section

### Card 4: Logs Explorer
**Title**: Search & Filter Logs  
**Description**: Filter by service, environment, level. Full-text search. Paginated results.  
**Proof Hook**: View endpoint → `API_SPEC.md#logs-query`

### Card 5: GitHub Deployments
**Title**: Deployment Tracking  
**Description**: GitHub webhook integration. HMAC signature verified. Idempotent delivery tracking.  
**Proof Hook**: Check test → `github.webhook.signature.test.ts`

### Card 6: Alert Rules
**Title**: Automated Alerts  
**Description**: Set error thresholds. Cron evaluates every 5 minutes. Incidents auto-created.  
**Proof Hook**: See evaluator → `app/api/v1/rules/evaluate`

### Card 7: Incident Timeline
**Title**: Incident Management  
**Description**: Open → Investigating → Resolved. Full event timeline with actor attribution.  
**Proof Hook**: Browse schema → `DB_SCHEMA.md#incidents`

### Card 8: Notifications
**Title**: Slack & Discord  
**Description**: Configure webhook channels. Jobs queued with retries. Exponential backoff.  
**Proof Hook**: Read processor → `app/api/v1/notifications/process`

---

## 5. How It Works (4 Steps)

### Step 1: Get Your Key
**Icon**: Key  
**Title**: Create a service & grab an API key  
**Description**: Keys are shown once and stored hashed. Scoped to org + service + environment.

### Step 2: Send Logs
**Icon**: Terminal  
**Title**: POST logs from your app  
**Description**: Batch up to 100 logs per request. Rate limited to protect your quota.

### Step 3: Rules Fire
**Icon**: AlertTriangle  
**Title**: Alert rules evaluate automatically  
**Description**: Cron checks every 5 minutes. Thresholds breached? Incident created.

### Step 4: Get Notified
**Icon**: Bell  
**Title**: Slack or Discord pings you  
**Description**: Notification jobs retry with backoff. Never miss a critical event.

---

## 6. PRD Showroom Tab Copy

### Tab: Overview

**Intro**:
```
PulseOps Lite is a lightweight operations monitoring platform. It's a real codebase you can explore, fork, and learn from.
```

**Bullets**:
- Multi-tenant architecture with org-scoped data isolation
- Session-based auth with hashed tokens + RBAC
- GitHub Actions cron jobs calling internal API endpoints

**Link**: See full architecture → `PROJECT_ATLAS.md`

---

### Tab: Core Flows

**Intro**:
```
Three flows power the system: authentication, log ingestion, and incident creation.
```

**Accordion 1: Auth Flow**
```
1. User signs up → password hashed with bcrypt
2. Session token generated → SHA-256 hashed → stored in DB
3. Cookie set (httpOnly, secure in prod)
4. Every request: getSessionFromCookies() → requireOrgRole()
```

**Accordion 2: Log Ingestion**
```
1. Client sends POST /api/v1/logs/ingest with x-api-key
2. Key validated → hashed with salt → lookup in api_keys
3. Rate limit checked (1200/min per key)
4. Logs batch-inserted into logs table
```

**Accordion 3: Incident Lifecycle**
```
1. Alert rule evaluates (cron every 5min)
2. Error threshold breached → incident created
3. Event logged: "Incident opened by alert rule"
4. Notification job queued → Slack/Discord webhook
5. User changes status → event logged with actor
```

---

### Tab: API Surface

**Intro**:
```
37 endpoints. Auth, services, logs, incidents, alerts, notifications, and internal cron.
```

**Example Card**:
```
POST /api/v1/logs/ingest
├── Auth: x-api-key header
├── Rate Limit: 1200 logs/minute
├── Payload: { logs: [{ timestamp, level, message, meta? }] }
└── Response: { data: { accepted: 5 } }
```

**Link**: View full spec → `API_SPEC.md`

---

### Tab: Database Schema

**Intro**:
```
16 tables. All tenant-scoped with org_id. Proper indexes for query performance.
```

**Key Tables**:
- `orgs`, `users`, `org_members` — Identity layer
- `services`, `environments`, `api_keys` — Service registry
- `logs`, `api_key_rate_buckets` — Log storage + rate limiting
- `incidents`, `incident_events` — Incident tracking
- `alert_rules`, `alert_firings` — Alerting engine
- `notification_channels`, `notification_jobs` — Delivery queue

**Link**: View full schema → `DB_SCHEMA.md`

---

### Tab: Security

**Intro**:
```
Security isn't an afterthought. Here's how PulseOps protects data.
```

**Bullets**:
- Session tokens: SHA-256 hashed before storage
- API keys: Salted SHA-256 (requires `API_KEY_SALT` env)
- GitHub webhooks: HMAC-SHA256 signature verification
- Cron endpoints: Protected by `x-internal-cron-secret` header

**Top Recommendations**:
1. Add rate limiting to `/api/auth/login`
2. Add Content-Security-Policy header
3. Implement API key expiration dates

**Link**: View full review → `SECURITY_REVIEW.md`

---

### Tab: Ops Proof

**Intro**:
```
CI/CD, cron jobs, and deployment. All automated.
```

**CI Pipeline** (GitHub Actions):
```
checkout → pnpm install → lint → typecheck → migrate → test
```

**Cron Jobs**:
- `cron-rules-evaluate.yml` — Every 5 minutes
- `cron-notifications-process.yml` — Every 5 minutes
- `cron-logs-cleanup.yml` — Daily at midnight UTC

**Deployment**:
- Platform: Vercel (Next.js 15)
- Database: Neon Postgres (Vercel integration)
- Env vars: `POSTGRES_URL`, `AUTH_SECRET`, `API_KEY_SALT`, `INTERNAL_CRON_SECRET`

**Link**: View full guide → `AUTOMATION_AND_DEPLOY.md`

---

## 7. Proof Section

### E2E Checklist
```
□ Sign up at /signup
□ Create a service at /services
□ Copy the API key (shown once!)
□ POST logs using the cURL below
□ View logs at /logs
□ Create an incident at /incidents
□ Resolve the incident
□ Check the event timeline
```

### Example cURL (No Secrets)
```bash
# Replace YOUR_API_KEY with the key from step 3
curl -X POST https://pulseops-lite.vercel.app/api/v1/logs/ingest \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "logs": [
      {
        "timestamp": "2026-01-11T22:00:00Z",
        "level": "error",
        "message": "Database connection failed",
        "meta": { "host": "db-prod-01", "retries": 3 }
      }
    ]
  }'
```

**Expected Response**:
```json
{ "data": { "accepted": 1 } }
```

---

## 8. Tech Stack + Engineering Highlights

### Tech Stack Logos
- Next.js 15 (App Router)
- React 19
- TypeScript
- Vercel
- Neon Postgres
- GitHub Actions
- Vitest
- Zod

### Engineering Highlights (10 Bullets)

1. **App Router only** — No pages/ directory. Server components by default.
2. **Raw SQL** — No ORM. Direct `@vercel/postgres` queries. Full control.
3. **Migrations in order** — 13 SQL files in `db/migrations/`. Idempotent.
4. **Session tokens hashed** — Never stored in plaintext. SHA-256.
5. **API keys salted** — Requires `API_KEY_SALT` env. Can't reverse-engineer.
6. **Rate limiting** — Atomic upsert to bucket table. 1200/min per key.
7. **Webhook idempotency** — `webhook_deliveries` table prevents replays.
8. **Cron via GitHub Actions** — No external scheduler. Just YAML + curl.
9. **Correlation IDs** — Every request tagged. Easy to trace across logs.
10. **No mock data** — All flows hit real database. What you see is real.

---

## 9. FAQ (6 Questions)

### Q1: Is this a real product or a demo?
**A**: It's a real, functioning codebase deployed on Vercel. You can sign up, create services, ingest logs, and manage incidents. The goal is to showcase production-like patterns.

### Q2: Can I use this in production?
**A**: You could, but it's designed as a learning/portfolio project. Some hardening (rate limiting on auth, CSP headers) is still TODO. See `SECURITY_REVIEW.md`.

### Q3: Where's the data stored?
**A**: Neon Postgres via Vercel integration. All data is scoped by `org_id` for multi-tenancy. Logs older than `retention_days` are auto-deleted.

### Q4: How do API keys work?
**A**: When you create a key, you see it once. We store only a salted SHA-256 hash. Lost your key? Revoke and create a new one.

### Q5: What triggers an incident?
**A**: Two ways: (1) Manually via UI or API. (2) Automatically when an alert rule fires during the 5-minute cron evaluation.

### Q6: Can I fork this?
**A**: Absolutely. It's open source. Clone it, swap the branding, deploy your own. Just don't ship it with the same secrets. 😉

---

## Next Step

Run **PULSEOPS_LANDING_04_IMPLEMENTATION_CUTE** to implement the landing page, including this copy in a structured JSON-like object for easy consumption by React components.
