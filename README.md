# PulseOps Lite

[![CI](https://github.com/prudhvi1519/pulseops-lite/actions/workflows/ci.yml/badge.svg)](https://github.com/prudhvi1519/pulseops-lite/actions/workflows/ci.yml)
[![Demo](https://img.shields.io/badge/demo-live-success)](https://pulseops-lite.vercel.app)
[![Repo](https://img.shields.io/badge/repo-github-gray)](https://github.com/prudhvi1519/pulseops-lite)

> **Logs + Alerts + Incidents** for small teams on free-tier infrastructure.

PulseOps Lite is a multi-tenant observability platform that runs entirely on **Vercel Hobby** and **Vercel Postgres**. It fills the gap between "console.log" and Enterprise tools, offering structured logging, automated alert rules, and incident management without the fixed costs.

*   **Multi-Tenant**: Role-based access for multiple organizations.
*   **Cron-Driven**: Reliable background processing for rules and notifications.
*   **Admin Diagnostics**: Built-in health dashboard for system operators.

**Live Demo**: [https://pulseops-lite.vercel.app](https://pulseops-lite.vercel.app)

---

## Table of Contents
*   [Screenshots](#screenshots)
*   [Features](#-features)
*   [Tech Stack](#tech-stack)
*   [Architecture](#-architecture)
*   [API Endpoints](#-api-endpoints)
*   [Scheduling](#-scheduling)
*   [Security](#-security)
*   [Project Status](#project-status)
*   [Quickstart](#-quickstart)
*   [Deployment](#deployment)
*   [Related Documentation](#related-documentation)

---

## Screenshots

| **Dashboard** | **Log Explorer** |
|:---:|:---:|
| ![][dashboard] | ![][logs] |
| **Incidents** | **Organization** |
| ![][incidents] | ![][orgs] |

[dashboard]: ./docs/screens/prod/desktop/04_dashboard.png
[logs]: ./docs/screens/prod/desktop/06_logs.png
[incidents]: ./docs/screens/prod/desktop/07_incidents.png
[orgs]: ./docs/screens/prod/desktop/08_orgs.png

_See `docs/screens/` for mobile views._

## ✨ Features
*   **Log Ingestion**: High-throughput HTTP API for structured JSON logs.
*   **Automated Rules**: Configurable error rate thresholds and deployment failure checks.
*   **Incident Lifecycle**: Track state (Open, Investigating, Resolved) with audit trails.
*   **Notifications**: Webhook integration (Slack/Discord) with retry logic.
*   **Data Retention**: Automated daily cleanup of old logs.
*   **Diagnostics**: Admin-only view to monitor cron job success/failure.

## Tech Stack
*   **Framework**: Next.js 15 (App Router, Server Actions)
*   **Database**: Vercel Postgres (`@vercel/postgres`)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Deploy**: Vercel Serverless

## 🧱 Architecture

```mermaid
graph TD
    Client[Client Apps] -->|POST JSON| Ingest[/api/v1/logs/ingest]
    Ingest -->|Insert| DB[(Vercel Postgres)]
    
    subgraph "Background Processing"
        ExtCron[External Cron] -->|POST 10m| Proxy[Proxy Endpoints]
        VercelCron[Vercel Native] -->|Daily| Cleanup[Cleanup Job]
        
        Proxy -->|Trigger| Logic[Job Logic]
        Logic -->|Read logs| DB
        Logic -->|Create Incident| DB
        Logic -->|Notify| Webhook[Slack / Discord]
    end
    
    UI[Next.js Dashboard] -->|Read| DB
```

## 🔌 API Endpoints

### Ingestion
*   `POST /api/v1/logs/ingest`
    *   Accepts JSON log events with `level`, `message`, `service_id`, `environment_id`.

### Operations (Protected)
These endpoints drive the background logic. They are protected by strict header authentication.
*   `POST /api/internal/cron/notifications` (Process alerts)
*   `POST /api/internal/cron/evaluate` (Check rules)
*   `POST /api/internal/cron/cleanup` (Delete old logs)

## ⏱️ Scheduling
To operate effectively on the **Vercel Hobby Plan** (which limits Cron Jobs to 1/day), we use a hybrid model:

1.  **Frequent Jobs (10m)**: Triggered by a free external service (like [cron-job.org](https://cron-job.org)) hitting the internal proxy endpoints.
2.  **Daily Jobs**: Handled natively by `vercel.json` for data cleanup.

## 🔐 Security
*   **Header Auth**: Internal routes require `x-internal-cron-secret`.
*   **No Query Secrets**: Credentials are never passed in URLs.
*   **Method Locking**: Sensitive endpoints reject non-POST requests.
*   **Environment**: All secrets managed via `.env`.

## Project Status
**Active / Stable**.
This project demonstrates how to build a production-grade observability tool using cost-effective "scale-to-zero" infrastructure. It is designed to be free-tier friendly while supporting multi-tenant scale.

**Known Limitations**:
*   Vercel Hobby functions have execution timeouts (10s default), so data processing is batched.
*   Relies on an external pinger for < 24h cron schedules.

## 🚀 Quickstart

```bash
# 1. Clone
git clone https://github.com/prudhvi1519/pulseops-lite.git
cd pulseops-lite

# 2. Install
pnpm install

# 3. Setup Environment
# Create .env.local and add your Vercel Postgres credentials + Cron Secret
cp .env.example .env.local

# 4. Migrate Database
pnpm db:migrate

# 5. Run Locally
pnpm dev
```

## Deployment
1.  Push to GitHub.
2.  Import to Vercel.
3.  Connect Vercel Postgres storage.
4.  Configure Environment Variables (`INTERNAL_CRON_SECRET`, `JWT_SECRET`, etc.).
5.  Set up [External Cron](./EXTERNAL_CRON_SETUP.md) for the 10-minute jobs.

## Related Documentation
*   [EXTERNAL_CRON_SETUP.md](./EXTERNAL_CRON_SETUP.md) - How to configure the 10m triggers.
*   [SECURITY_WARNING.md](./SECURITY_WARNING.md) - Secrets management policy.
*   [VERCEL_LIMITS.md](./VERCEL_LIMITS.md) - Analysis of Hobby tier constraints.
