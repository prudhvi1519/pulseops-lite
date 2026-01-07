# Prompt Orchestration

## Overview

This project uses a **packet-based prompt orchestration** system to manage development in structured, reviewable increments.

## Packet Schema

Each packet follows this structure:

```yaml
Packet ID: PKT-XX-NAME
Packet Type: FOUNDATION | FEATURE | BUGFIX | REFACTOR
Goal: One-sentence description

Inputs:
  - Current repo state
  - Dependencies from previous packets

Anti-chaos constraints:
  - Scope boundaries
  - What NOT to do

Tasks:
  - File-by-file changes required

Output requirements:
  - Verification steps
  - Acceptance criteria
```

## Phase Gates

### PKT-00: Skeleton (FOUNDATION)
- Basic project structure
- Health endpoints
- Test infrastructure
- CI pipeline

### PKT-01: Auth (FEATURE) - Planned
- Authentication system
- User management

### PKT-02: Core Features (FEATURE) - Planned
- Primary application functionality

## Packet Execution Rules

1. **Single-packet scope**: Completed Packets:
- PKT-00: Project Initialization (Next.js, Tailwind, Postgres, Shadcn)
- PKT-01: Logging System (Ingest API, TimescaleDB schema, querying)
- PKT-02: Logs UI (Explorer, Drawers, Filters, Histogram)
- PKT-03: Alerting Engine (Rules CRUD, Evaluation Logic, Incident DB)
- PKT-04: Incident Management (Status flow, Severity, assignment)
- PKT-05: Notifications (Channels, Webhook Integration, Queues)
- PKT-06: Deployments Tracking (GitHub Webhook, Timeline UI)
- PKT-07: Admin & Security (RBAC, Audit Logs, API Keys)
- PKT-08: Observability & Polish (Diagnostics UI, UX standardisation, Docs)
2. **Verification required**: All tests must pass before packet completion
3. **No scope creep**: Stay within packet boundaries
4. **Deterministic outputs**: Document all created/modified files

## Location

Packet definitions are stored in: `docs/prompt-packets/`
