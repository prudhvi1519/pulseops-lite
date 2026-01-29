# Vercel Cron Limits Verification (PulseOps Lite)

## Actual Limits (Hobby Plan)
Based on direct deployment evidence (Step 3982) and documentation:

1.  **Frequency Limit**: **Once per day maximum**.
    *   *Evidence*: Deployment failed with error: `Upgrade to the Pro plan to unlock all Cron Jobs features... more than once per day.` when attempting to schedule `*/10 * * * *`.
2.  **Job Count**: Up to 100 (Nominal), but constrained by the frequency limit.
3.  **Execution Window**: 10 seconds (default) to 60 seconds (max).

## Decision & Recommendation

### 1. Frequent Jobs (Notifications, Rules)
*   **Requirement**: Every 10 minutes.
*   **Vercel Hobby Capability**: ❌ **Not Supported** (Limit: Once/Day).
*   **Decision**: **Move to External Cron Service**.
    *   Use a free external service (e.g., `cron-job.org`, `EasyCron`) to trigger the Proxy Routes:
        *   `POST /api/internal/cron/notifications?cron_secret=...`
        *   `POST /api/internal/cron/evaluate?cron_secret=...`

### 2. Daily Jobs (Cleanup)
*   **Requirement**: Once Daily.
*   **Vercel Hobby Capability**: ✅ **Supported**.
*   **Decision**: **Keep on Vercel Cron**.
    *   Configured in `vercel.json` as `0 0 * * *`.

## Action Plan
1.  **Modify `vercel.json`**: Remove the 10-minute schedules (they will cause deployment failure). Keep only the Daily Cleanup.
2.  **External Setup**: User must manually configure the 10-minute triggers in an external tool using the Proxy Routes.
