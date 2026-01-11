# PulseOps Lite - Security Review

> Security audit with hardening recommendations.

## Authentication Model

### Session-Based Auth
- **Token Generation**: 32 random bytes → hex string
- **Storage**: SHA-256 hash stored in `sessions` table
- **Cookie**: `pulseops_session` with httpOnly, sameSite=lax, secure (prod)
- **Expiry**: 7 days, checked on every request

### Password Security
- **Hashing**: bcrypt with default cost factor
- **Verification**: Constant-time comparison via bcrypt

### API Key Auth
- **Format**: `pol_<64-hex-chars>` (32 random bytes)
- **Storage**: Salted SHA-256 hash
- **Salt**: `API_KEY_SALT` environment variable (required)
- **Revocation**: `revoked_at` timestamp check on verification

---

## RBAC Enforcement

### Role Hierarchy
```
admin (3) > developer (2) > viewer (1)
```

### Enforcement Points

| Endpoint Type | Enforcement Location | Mechanism |
|---------------|---------------------|-----------|
| Session-protected | Route handler | `requireSession()` |
| Org-scoped | Route handler | `requireOrgRole()` |
| Role-gated | Route handler | `requireOrgRole('developer')` |
| API Key | Route handler | `verifyApiKey()` |
| GitHub Webhook | Route handler | HMAC signature verification |
| Internal/Cron | Route handler | `x-internal-cron-secret` header |

### Coverage Audit

| Route | Auth | Server-Side Enforcement |
|-------|------|------------------------|
| `/api/auth/*` | Public | ✅ N/A |
| `/api/me` | Session | ✅ `requireSession()` |
| `/api/services/*` | Session+Org | ✅ `requireOrgRole()` |
| `/api/services/*/keys` POST | Dev+ | ✅ `requireOrgRole('developer')` |
| `/api/services/*/github` PUT | Admin | ✅ `requireOrgRole('admin')` |
| `/api/logs/query` | Session+Org | ✅ org_id scoping |
| `/api/v1/logs/ingest` | API Key | ✅ key → org_id scoping |
| `/api/incidents/*` | Session+Org | ✅ org_id scoping |
| `/api/incidents/create` | Dev+ | ✅ `requireOrgRole('developer')` |
| `/api/alerts/*` | Admin | ✅ `requireOrgRole('admin')` |
| `/api/notifications/channels/*` | Admin | ✅ `requireOrgRole('admin')` |
| `/api/audit/query` | Admin | ✅ `requireOrgRole('admin')` |
| `/api/v1/github/webhook` | HMAC | ✅ Signature verification |
| `/api/internal/*` | Cron | ✅ Header secret check |

---

## Tenant Isolation

### Data Scoping Strategy

All multi-tenant data queries include `org_id` filter:

```sql
-- Example: Services query
SELECT * FROM services WHERE org_id = ${orgId}

-- Example: Logs query (triple-scoped)
SELECT * FROM logs 
WHERE org_id = ${orgId} 
  AND service_id = ${serviceId}
  AND environment_id = ${environmentId}
```

### Isolation Risks

| Risk | Status | Notes |
|------|--------|-------|
| Missing org_id in query | ⚠️ Low | All queries reviewed, scoping consistent |
| Cross-org service access | ✅ Prevented | Service lookups validated against session org |
| API key scoped to wrong org | ✅ Prevented | Key lookup returns org_id from key record |
| Incident cross-org access | ✅ Prevented | org_id validation in routes |

---

## API Key Security

### Key Lifecycle
1. **Generation**: `generateApiKey()` - crypto.getRandomValues
2. **Display**: Shown once to user after creation (plaintext)
3. **Storage**: Salted SHA-256 hash only
4. **Verification**: Hash input with salt, lookup in DB
5. **Revocation**: Set `revoked_at` timestamp

### Security Properties
- ✅ Keys not recoverable from database
- ✅ Salt prevents rainbow table attacks
- ✅ Revocation immediate (checked on every request)
- ⚠️ No key rotation workflow (manual revoke + create)

---

## Internal Endpoint Protection

### Cron Secret Header
- **Header**: `x-internal-cron-secret`
- **Validation**: Direct string comparison
- **Endpoints**: `/api/internal/*`, `/api/v1/rules/evaluate`, `/api/v1/notifications/process`

### GitHub Webhook HMAC
- **Header**: `x-hub-signature-256`
- **Algorithm**: HMAC-SHA256
- **Secret**: Stored as hash in `github_integrations`
- **Verification**: Constant-time comparison

---

## Rate Limiting

| Endpoint | Limit | Window | Implementation |
|----------|-------|--------|----------------|
| `/api/v1/logs/ingest` | 1200 logs | 60 seconds | `api_key_rate_buckets` atomic upsert |
| Other endpoints | None | N/A | ⚠️ Missing |

---

## Input Validation

### Zod Schema Enforcement

| Endpoint | Validation |
|----------|-----------|
| `/api/auth/login` | ✅ `loginSchema` |
| `/api/auth/signup` | ✅ `signupSchema` |
| `/api/v1/logs/ingest` | ✅ `IngestBodySchema` |
| Other endpoints | ⚠️ Manual JSON parsing |

---

## Sensitive Data Logging

### Current Status
- ✅ API keys never logged (only "request started")
- ✅ Passwords not logged
- ⚠️ User IPs not logged (no audit trail)
- ⚠️ Error stacks logged to console (OK for Vercel, may expose internals)

---

## Top 10 Hardening Recommendations

| Priority | Issue | Impact | Effort | Recommendation |
|----------|-------|--------|--------|----------------|
| **P0** | No rate limiting on auth endpoints | Brute force risk | Medium | Add rate limiting to `/api/auth/login` (5 attempts/min) |
| **P0** | Session fixation possible | Session hijacking | Low | Regenerate session ID on login |
| **P1** | No CSRF protection | State-changing POSTs vulnerable | Medium | Add SameSite=Strict or CSRF tokens |
| **P1** | Missing Content-Security-Policy | XSS mitigation | Low | Add CSP header in `next.config.ts` |
| **P1** | No request logging with IPs | Audit trail gaps | Low | Add structured logging with IP (hashed) |
| **P2** | Webhook secret stored as hash only | Can't verify without raw | N/A | Expected behavior - document rotation process |
| **P2** | No API key expiration | Long-lived credentials | Medium | Add optional `expires_at` column |
| **P2** | Missing rate limits on most endpoints | DoS risk | Medium | Add global rate limiter |
| **P3** | Error messages may leak info | Information disclosure | Low | Standardize error responses |
| **P3** | No security headers | Various attacks | Low | Add X-Frame-Options, X-Content-Type-Options |

---

## Security Headers (Missing)

Add to `next.config.ts`:

```typescript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
        },
      ],
    },
  ];
}
```

---

## Dependency Security

### Key Dependencies
| Package | Version | Known Vulnerabilities |
|---------|---------|----------------------|
| `next` | 15.1.3 | ✅ Latest stable |
| `react` | 19.0.0 | ✅ Latest stable |
| `bcryptjs` | 3.0.2 | ✅ No known issues |
| `zod` | 3.24.1 | ✅ No known issues |
| `@vercel/postgres` | 0.10.0 | ✅ No known issues |

### Recommended Audit
```bash
pnpm audit
```

---

## Summary

| Category | Score | Notes |
|----------|-------|-------|
| Authentication | 🟢 Good | Session and API key handling solid |
| Authorization | 🟢 Good | RBAC enforcement consistent |
| Tenant Isolation | 🟢 Good | org_id scoping throughout |
| Input Validation | 🟡 Fair | Zod on critical paths, gaps elsewhere |
| Rate Limiting | 🟡 Fair | Only on log ingest |
| Security Headers | 🔴 Missing | Need CSP, X-Frame-Options |
| Logging/Audit | 🟡 Fair | Basic logging, no IP tracking |
