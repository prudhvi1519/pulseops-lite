# Threat Model

## Assumptions
*   **TLS**: All traffic (Ingest, UI, API) is served over HTTPS.
*   **Database**: Postgres connection is encrypted.
*   **Vercel/Host**: The hosting platform provides isolation for the runtime environment.

## Critical Risks & Mitigations

### 1. Webhook Replay Attacks
*   **Risk**: Attacker captures a GitHub webhook payload and replays it to create fake deployments.
*   **Mitigation**:
    *   All webhooks MUST have `X-Hub-Signature-256`.
    *   Server validates signature using `GITHUB_WEBHOOK_SECRET`.
    *   `webhook_deliveries` table tracks `delivery_id` to prevent processing the same event twice (Idempotency).

### 2. API Key Leakage
*   **Risk**: Malicious actor gains access to a Service API Key and floods ingest.
*   **Mitigation**:
    *   API Keys should be rotated immediately via the Service Settings UI.
    *   Rate limiting (planned) to prevent DoS.
    *   Ingest endpoint validates Key existence and active status.

### 3. Cross-Tenant Data Leakage
*   **Risk**: User from Org A sees logs from Org B.
*   **Mitigation**:
    *   **Application Level**: All DB queries MUST include `where org_id = ?`.
    *   **RLS (Optional)**: Postgres Row Level Security can be enabled for defense-in-depth (not currently enforced by app code defaults).

### 4. Internal Cron Exposure
*   **Risk**: Attacker triggers `rules/evaluate` excessively, causing DB load or duplicate alerts.
*   **Mitigation**:
    *   Endpoints check `Authorization` header against `INTERNAL_CRON_SECRET`.
    *   Edge/WAF rules should restrict access to these paths if possible.

### 5. Audit Log Integrity
*   **Risk**: Admin performs malicious action and deletes the audit log.
*   **Mitigation**:
    *   `audit_logs` table should be append-only (soft delete or strict DB permissions).
    *   Application code does not expose a "Delete Audit Log" API.
