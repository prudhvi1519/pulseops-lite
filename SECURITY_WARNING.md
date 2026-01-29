# Security Policy

## Secrets Management
**NEVER commit secrets to this repository.**

1.  **Environment Variables**: All secrets (API keys, DB credentials, Cron secrets) must be stored in environment variables (e.g., `.env.local` locally, and Vercel Project Settings for production).
2.  **Cron Jobs**:
    *   Do not hardcode secrets in `vercel.json`.
    *   Vercel Cron natively supports secure calls if using `Authorization: Bearer <CRON_SECRET>`.
    *   External Cron tools should use the `cron_secret` query parameter, but the value of this secret should be rotated if exposed.

## Reporting Issues
If you find a hardcoded secret, please rotate it immediately and remove it from the git history.
