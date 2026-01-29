# PulseOps Lite

**PulseOps Lite** is a lightweight, multi-tenant observability and incident management platform built for modern engineering teams. It provides log ingestion, automated alert rules, and incident tracking in a clean, developer-centric UI.

**Live Demo**: [https://pulseops-lite.vercel.app](https://pulseops-lite.vercel.app)

---

## 🚀 Features

*   **Multi-Tenant Architecture**: Support for multiple organizations with role-based access (Admin/Developer).
*   **Log Ingestion**: High-volume log ingestion with tagging (Service, Environment, Level).
*   **Automated Alerts**: Real-time evaluation of error rates and deployment statuses.
    *   *Triggers incidents automatically when thresholds are breached.*
*   **Incident Management**: Track lifecycle state (Open, Investigating, Resolved) with audit trails.
*   **Cron-Driven Workflows**: Robust background processing for rules evaluation and notification delivery.
*   **Free-Tier Friendly**: Optimized to run on Vercel Hobby + Neon/Supabase (Postgres) + External Cron (Free).

## 🛠️ Tech Stack

*   **Framework**: Next.js 15 (App Router, Server Actions)
*   **Language**: TypeScript
*   **Database**: PostgreSQL (via `postgres.js`)
*   **Styling**: Tailwind CSS
*   **Deployment**: Vercel
*   **Auth**: Custom JWT / Session-based (lightweight)

## ⚙️ Architecture & Scheduling

PulseOps Lite uses a hybrid scheduling approach to overcome serverless limits on free tiers.

### 1. Cron Workflows
*   **Notifications Processor**: Delivers alerts to Webhooks (Slack/Discord) with retry backoff.
*   **Rules Evaluator**: Checks log metrics against configured thresholds every 10 minutes.
*   **Data Cleanup**: Retention policy enforcement (Daily).

### 2. Free-Tier "Proxy" Pattern
To bypass Vercel Hobby's "One Cron Per Day" limit while keeping the site active:

*   **Daily Jobs**: Natively handled by Vercel Cron (`vercel.json`) -> `/api/internal/cron/cleanup`.
*   **Frequent Jobs (10m)**: Triggered by an external free provider (e.g., cron-job.org) hitting our secured proxy endpoints.

**Proxy Endpoints (POST Only):**
*   `POST /api/internal/cron/notifications`
*   `POST /api/internal/cron/evaluate`
*   `POST /api/internal/cron/cleanup`

**Security:**
These endpoints are secured by a custom header check to prevent unauthorized execution.
*   **Header**: `x-internal-cron-secret`
*   **Value**: Must match server-side `INTERNAL_CRON_SECRET` env var.
*   *Query parameters and GET requests are strictly disabled for security.*

## 🩺 Diagnostics

Admins can monitor the health of background jobs via the built-in Diagnostics page.
*   **URL**: `/diagnostics` (Requires Admin role)
*   **Data**: Tracks execution history, duration, and success/failure status in the `cron_runs` table.

## 💻 Local Development

1.  **Clone & Install**
    ```bash
    git clone https://github.com/prudhvi1519/pulseops-lite.git
    cd pulseops-lite
    pnpm install
    ```

2.  **Environment Setup**
    Copy `.env.example` to `.env.local` and populate:
    ```bash
    POSTGRES_URL="postgres://..."
    INTERNAL_CRON_SECRET="your-local-secret"
    JWT_SECRET="your-jwt-secret"
    ```

3.  **Run Development Server**
    ```bash
    pnpm dev
    ```

4.  **Trigger Crons Locally**
    You can create a `POST` request to localhost:
    ```bash
    curl -X POST "http://localhost:3000/api/internal/cron/evaluate" \
      -H "x-internal-cron-secret: your-local-secret"
    ```

## 📦 Deployment (Vercel)

1.  Push to GitHub.
2.  Import project in Vercel.
3.  Set Environment Variables (`POSTGRES_URL`, `INTERNAL_CRON_SECRET`, etc.).
4.  **Important**: For 10-minute schedules, follow the [External Cron Setup Guide](./EXTERNAL_CRON_SETUP.md) to query the proxy routes.
    *   *Vercel Native Cron is only configured for the daily cleanup job to remain within Hobby limits.*
