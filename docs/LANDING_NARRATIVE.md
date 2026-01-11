# PulseOps Lite - Landing Page Narrative Blueprint

> **PULSEOPS_LANDING_01_NARRATIVE_MAP_CUTE**  
> Product strategist + UX writer output

---

## 1. Positioning Statement

**PulseOps Lite is a production-ready operations monitoring platform that tracks logs, deployments, incidents, and alerts across multi-tenant organizations—built with real authentication, real database migrations, and real automation you can inspect.**

---

## 2. Homepage Section Order

| # | Section | Purpose | Visual Hook (Cute/Attention-Grabbing) |
|---|---------|---------|--------------------------------------|
| 1 | **Hero** | Immediate value prop + primary CTA | Animated terminal showing log ingestion → incident creation flow with soft glow effects and a friendly mascot peek |
| 2 | **Credibility Strip** | "Built like a real system" proof | Pill badges with icons: "13 DB Migrations" • "37 API Routes" • "RBAC Enforced" • "Rate Limited" — subtle bounce animation on scroll |
| 3 | **Feature Grid** | Scannable 8-feature showcase | Cards with playful micro-illustrations (line art style), hover reveals a "proof" tooltip |
| 4 | **Live Demo Preview** | Show don't tell | Interactive mockup: click tabs (Dashboard/Logs/Incidents) to see real UI screenshots with soft parallax |
| 5 | **PRD Showroom** | Deep-dive for technical reviewers | Tabbed accordion with syntax-highlighted code snippets, schema diagrams, and "View in Repo" links |
| 6 | **How It Works** | 4-step flow | Numbered cards with connecting dotted lines and friendly icons (key → logs → alert → slack) |
| 7 | **Tech Stack** | Credibility + familiarity | Logo cloud: Next.js, React 19, Vercel, Neon Postgres, GitHub Actions — monochrome with color on hover |
| 8 | **CTA Footer** | Convert | Gradient card with "Start exploring" + secondary "View on GitHub" |

---

## 3. Feature List (8 Items)

| # | Feature Title | Value (1-2 lines) | Proof Hook |
|---|--------------|-------------------|------------|
| 1 | **Multi-Tenant Orgs** | Create organizations, invite members, switch contexts. All data scoped by `org_id`. | "See the migration: 0001_identity.sql" |
| 2 | **Role-Based Access** | Three tiers: Admin, Developer, Viewer. Enforced server-side on every request. | "Inspect RBAC checks in rbac.ts" |
| 3 | **Log Ingestion API** | POST logs with `x-api-key`. Rate limited (1200/min). Keys shown once, stored hashed. | "Try the cURL example" |
| 4 | **Logs Explorer** | Filter by service, environment, level. Full-text search. Paginated results. | "View the query endpoint spec" |
| 5 | **GitHub Deployments** | Webhook receives push events. HMAC signature verified. Idempotent delivery tracking. | "Check the webhook signature test" |
| 6 | **Alert Rules** | Define error thresholds. Cron evaluates rules. Incidents auto-created on breach. | "See rule evaluation in rules/evaluate" |
| 7 | **Incident Timeline** | Manual or auto-created. Status transitions. Event log with actor attribution. | "Browse the incidents schema" |
| 8 | **Slack/Discord Notifications** | Configure channels. Jobs queued with retries. Exponential backoff on failure. | "Read the notification processor" |

---

## 4. PRD Showroom Tab Outline

### Tab 1: Overview
- What PulseOps Lite does (3 bullets)
- Architecture diagram (ASCII or Mermaid)
- "See full PROJECT_ATLAS.md"

### Tab 2: Core Flows
- **Auth Flow**: Signup → session cookie → RBAC check
- **Log Ingestion**: API key → rate limit → batch insert
- **Incident Creation**: Alert fires → incident + events → notification job
- Diagram: swimlane or sequence

### Tab 3: API Surface
- Count: 37 endpoints across auth, services, logs, incidents, alerts, notifications
- Example endpoint card:
  ```
  POST /api/v1/logs/ingest
  Auth: x-api-key
  Rate: 1200/min
  Payload: { logs: [{ timestamp, level, message, meta? }] }
  ```
- "View full API_SPEC.md"

### Tab 4: Database Schema
- 16 tables visualized as ERD
- Highlight: `org_id` on every tenant-scoped table
- Indexes for performance (logs_scope_ts_idx, etc.)
- "View full DB_SCHEMA.md"

### Tab 5: Security
- Session tokens: SHA-256 hashed
- API keys: salted SHA-256
- Webhook: HMAC-SHA256 signature
- Cron: internal secret header
- Top 3 hardening recommendations
- "View full SECURITY_REVIEW.md"

### Tab 6: Ops Proof
- CI pipeline: lint → typecheck → migrate → test
- Cron jobs: logs cleanup (daily), rules eval (5min), notifications (5min)
- Deployment: Vercel + Neon Postgres
- Evidence: GitHub Actions badge, Vercel status
- "View full AUTOMATION_AND_DEPLOY.md"

---

## 5. CTA & Navbar Behavior Rules

### Navbar (Sticky)

| Element | Desktop | Mobile |
|---------|---------|--------|
| Logo | Left, links to hero | Same |
| Anchor Links | Center: Features • Demo • PRD • Tech Stack | Hidden in hamburger |
| Login | Right, secondary style (ghost button) | In hamburger menu |
| Sign Up | Right, primary style (filled button) | Fixed bottom bar OR in hamburger |

**Scroll Behavior**:
- Navbar becomes semi-transparent + blur backdrop on scroll
- Active anchor link highlighted based on scroll position
- Sign Up button gains subtle pulse after 10s on page (attention nudge)

### CTAs

| Location | Primary CTA | Secondary CTA |
|----------|-------------|---------------|
| Hero | "Get Started Free" → /signup | "View on GitHub" → repo |
| Feature Grid | None (cards link to PRD tabs) | — |
| PRD Showroom | "Explore the Code" → repo | "Try Live Demo" → /login |
| Footer | "Start Building" → /signup | "Read the Docs" → /docs |

### Mobile-Specific
- Hamburger menu with slide-in drawer
- PRD Showroom tabs become vertical accordion
- Feature grid becomes single-column scroll
- Floating "Sign Up" button in bottom-right corner (optional, non-intrusive)

---

## Visual Style Notes (for UI Spec)

| Aspect | Guideline |
|--------|-----------|
| **Palette** | Dark mode default. Accent: soft teal (#14b8a6) or coral (#f97316). |
| **Illustrations** | Line art with single accent color. Friendly, not corporate. |
| **Animations** | Subtle. Fade-in on scroll. Hover lifts. No jarring motion. |
| **Typography** | Sans-serif (Inter or similar). Clear hierarchy. |
| **Code Blocks** | Dark theme with syntax highlighting. Copy button. |
| **Cute Factor** | Rounded corners. Soft shadows. Occasional emoji in copy (🔐 ✅ 🚀). |

---

## Next Step

Run **PULSEOPS_LANDING_02_UI_SPEC_CUTE** to convert this narrative into a pixel-level UI specification with:
- Figma-ready component breakdown
- Exact spacing/sizing tokens
- Responsive breakpoints
- Animation timing
- Asset list (icons, illustrations)
