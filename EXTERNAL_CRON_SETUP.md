# External Cron Setup Guide (Free Tier)

Since Vercel's Hobby plan limits cron jobs to **once per day**, you must use an external service to trigger your 10-minute jobs.

**Selected Provider**: [cron-job.org](https://cron-job.org/)
-   **Why?**: It is free and supports **Custom Headers** (required for our `x-internal-cron-secret` auth).
-   **Cost**: $0

## Setup Checklist

### 1. Get Your Secret
1.  Go to your Vercel Project Settings > Environment Variables.
2.  Reveal and copy the value of `INTERNAL_CRON_SECRET`.
    *   *If you haven't set this yet, generate a long random string and set it now.*

### 2. Create "Notifications" Job
1.  Log in to [cron-job.org](https://cron-job.org/).
2.  Click **"Create Cronjob"**.
3.  **Title**: `PulseOps - Notifications`
4.  **URL**: `https://pulseops-lite.vercel.app/api/internal/cron/notifications`
    *   *Note: Ensure you use your actual production domain.*
5.  **Execution Schedule**: `Every 10 minutes` (User defined).
6.  **Advanced / Headers**:
    *   **Method**: `POST` (Default is GET, you MUST change this).
    *   **Headers**: Click "Add Header".
        *   Key: `x-internal-cron-secret`
        *   Value: *(Paste your secret here)*
7.  **Save**.

### 3. Create "Evaluate Rules" Job
1.  Click **"Create Cronjob"**.
2.  **Title**: `PulseOps - Evaluate Rules`
3.  **URL**: `https://pulseops-lite.vercel.app/api/internal/cron/evaluate`
4.  **Execution Schedule**: `Every 10 minutes`.
5.  **Advanced / Headers**:
    *   **Method**: `POST`
    *   **Headers**:
        *   Key: `x-internal-cron-secret`
        *   Value: *(Paste your secret here)*
6.  **Save**.

### 4. Verify
1.  On cron-job.org dashboard, click "Run Now" (or Test) for each job.
2.  Check the "History" tab.
    *   **Success**: HTTP 200 via `POST`.
    *   **Failure**: HTTP 401 (Bad Secret), 405 (Wrong Method), or 500 (Server Error).

## Vercel Native Cron
*   The **Daily Cleanup** job is still handled by Vercel (`vercel.json`) because it runs once daily, which is allowed on the Hobby plan.
*   No external setup needed for Cleanup.
