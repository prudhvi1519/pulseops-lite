# PKT-00-SKELETON

**Packet ID**: PKT-00-SKELETON  
**Packet Type**: FOUNDATION  
**Status**: COMPLETE

## Goal

Create a bootable Next.js full-stack skeleton with health endpoint, correlation-id logging, standard error shape, baseline tests + CI, docs scaffolding, and a working "happy path" status page.

## Inputs

- Repo snapshot: empty repo
- Stack: Next.js (App Router) + TypeScript + Vercel Postgres
- Tests: none exist yet (you must create baseline tests)

## Files Created

### Tooling / Config
- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `.gitignore`
- `.env.example`
- `eslint.config.mjs`
- `.prettierrc`
- `README.md`

### App Router Pages
- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`

### Design System
- `lib/design/tokens.ts`
- `components/AppShell.tsx`
- `components/ui/Card.tsx`
- `components/ui/Badge.tsx`
- `components/ui/PageHeader.tsx`
- `components/ui/SkeletonLoader.tsx`
- `components/ui/EmptyState.tsx`

### API Baseline
- `app/api/health/route.ts`
- `app/api/_utils/correlation.ts`
- `app/api/_utils/logger.ts`
- `app/api/_utils/response.ts`
- `app/api/_utils/withApiHandler.ts`

### Database
- `lib/db/index.ts`
- `lib/db/migrate.ts`
- `db/migrations/0000_schema_migrations.sql`

### Tests
- `vitest.config.ts`
- `tests/setup.ts`
- `tests/api/health.test.ts`
- `tests/ui/home.test.tsx`

### CI/CD
- `.github/workflows/ci.yml`

### Documentation
- `docs/PRD.md`
- `docs/prompt-orchestration.md`
- `docs/runbook.md`
- `docs/architecture.md`
- `docs/prompt-packets/PKT-00-SKELETON.md`

## Verification Commands

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm dev
```

## Acceptance Criteria

- [x] Home page shows "System Status: OK (mock)" + version string
- [x] `/api/health` returns `{ data: { ok: true } }` with x-correlation-id header
- [x] Correlation ID read from request or generated
- [x] `pnpm lint` passes
- [x] `pnpm typecheck` passes
- [x] `pnpm test` passes
- [x] CI workflow exists

## Rollback Plan

```bash
git revert HEAD
# If database was touched:
DROP TABLE IF EXISTS schema_migrations;
```
