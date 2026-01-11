# PulseOps Lite - UI Specification

> Page-by-page UI documentation with component inventory and UX improvements.

## Navigation Map

```
┌─────────────────────────────────────────────────────────────┐
│                         HEADER                              │
│  [PulseOps Lite]                           [User ▼] [Sign Out]
└─────────────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    ▼                         ▼                         ▼
┌─────────┐            ┌─────────────┐           ┌──────────┐
│Dashboard│────────────│  Services   │───────────│   Logs   │
└─────────┘            └─────────────┘           └──────────┘
    │                         │
    ▼                         ▼
┌─────────┐            ┌─────────────┐
│Incidents│            │ Deployments │
└─────────┘            └─────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│         ADMIN SECTION                  │
│  [Audit Logs] [Diagnostics] [Notif.]  │
└────────────────────────────────────────┘
```

---

## Page Specifications

### 1. Landing Page (`/`)
- **Route**: `/`
- **Auth**: Public
- **Content**: Marketing/info page with login CTA
- **API Calls**: None

### 2. Login Page (`/login`)
- **Route**: `/login`
- **Auth**: Public
- **Content**: Email/password form
- **API Calls**: `POST /api/auth/login`
- **States**:
  - Default: Form with email/password inputs
  - Loading: Button shows spinner
  - Error: Red alert with message
- **Redirects**: → `/dashboard` on success

### 3. Signup Page (`/signup`)
- **Route**: `/signup`
- **Auth**: Public
- **Content**: Registration form (email, password, name, org name)
- **API Calls**: `POST /api/auth/signup`

### 4. Dashboard (`/dashboard`)
- **Route**: `/dashboard`
- **Auth**: Session+Org
- **Content**:
  - Current organization card with role badge
  - System health metrics (open incidents, failed notifications)
  - Quick links (Services, Logs Explorer)
  - Latest deployments list
  - Empty state for incidents
- **API Calls**:
  - `GET /api/me`
  - `GET /api/diagnostics/summary`
  - `GET /api/deployments/query?limit=5`
- **Components**: `AppShell`, `Card`, `Badge`, `PageHeader`, `LatestDeployments`, `EmptyState`, `SkeletonLoader`

### 5. Services List (`/services`)
- **Route**: `/services`
- **Auth**: Session+Org
- **Content**:
  - Service cards with name, description, retention days
  - Create service button (Developer+)
- **API Calls**: `GET /api/services`

### 6. Service Detail (`/services/[serviceId]`)
- **Route**: `/services/[serviceId]`
- **Auth**: Session+Org
- **Content**:
  - Service info (name, description, retention)
  - Environments list with create button
  - API keys list with create/revoke
  - GitHub integration config (Admin only)
- **API Calls**:
  - `GET /api/services/[serviceId]`
  - `GET /api/services/[serviceId]/environments`
  - `GET /api/services/[serviceId]/keys`
  - `GET /api/services/[serviceId]/github`
- **Dialogs**: Create environment, Create API key

### 7. Logs Explorer (`/logs`)
- **Route**: `/logs`
- **Auth**: Session+Org
- **Content**:
  - Filter bar (service, environment, level, time range, search)
  - Logs table with virtualization
  - Log detail drawer on row click
- **API Calls**: `GET /api/logs/query`
- **Components**: `FilterBar`, `LogsTable`, `LogDrawer`
- **States**:
  - Loading: Skeleton table
  - Empty: "No logs found" with suggestions
  - Error: Alert with retry button

### 8. Incidents List (`/incidents`)
- **Route**: `/incidents`
- **Auth**: Session+Org
- **Content**:
  - Incident table with status, severity, service, time
  - Status filter tabs (All, Open, Investigating, Resolved)
  - Create incident button (Developer+)
- **API Calls**: `GET /api/incidents/query`
- **Components**: `IncidentsClient`

### 9. Incident Detail (`/incidents/[id]`)
- **Route**: `/incidents/[id]`
- **Auth**: Session+Org
- **Content**:
  - Incident header (title, status badge, severity badge)
  - Description card
  - Status change buttons (Investigate, Resolve)
  - Events timeline
- **API Calls**:
  - `GET /api/incidents/[id]`
  - `PATCH /api/incidents/[id]` (status updates)
- **Components**: `IncidentDetailClient`

### 10. Deployments (`/deployments`)
- **Route**: `/deployments`
- **Auth**: Session+Org
- **Content**: Deployment history table with service, env, commit, status, time
- **API Calls**: `GET /api/deployments/query`
- **Components**: `DeploymentsClient`

### 11. Organization Switcher (`/orgs`)
- **Route**: `/orgs`
- **Auth**: Session
- **Content**: List of user's organizations with switch button
- **API Calls**: `GET /api/orgs`, `PUT /api/orgs/[orgId]/meta`

### 12. Admin: Audit Logs (`/admin/audit`)
- **Route**: `/admin/audit`
- **Auth**: Session+Org (Admin)
- **Content**: Searchable audit log table
- **API Calls**: `GET /api/audit/query`
- **Components**: `AuditLogsClient`

### 13. Admin: Diagnostics (`/admin/diagnostics`)
- **Route**: `/admin/diagnostics`
- **Auth**: Session+Org (Admin)
- **Content**: System health dashboard, cron job status
- **API Calls**: `GET /api/diagnostics/summary`
- **Components**: `DiagnosticsClient`

### 14. Admin: Notifications (`/admin/notifications`)
- **Route**: `/admin/notifications`
- **Auth**: Session+Org (Admin)
- **Content**:
  - Notification channels list (Discord/Slack)
  - Recent notification jobs with status
  - Create/edit channel dialogs
- **API Calls**:
  - `GET /api/notifications/channels/query`
  - `GET /api/notifications/jobs/recent`
- **Components**: `NotificationsAdminClient`

---

## Design System Inventory

### Core Components (`components/ui/`)

| Component | File | Variants/Props |
|-----------|------|----------------|
| Badge | `Badge.tsx` | `success`, `warning`, `error`, `info`, `neutral` |
| Button | `button.tsx` | `primary`, `secondary`, `ghost`, `size` |
| Card | `Card.tsx` | `padding: sm|md|lg` |
| Dialog | `dialog.tsx` | `open`, `onClose`, `title` |
| Input | `input.tsx` | Standard HTML input |
| Label | `label.tsx` | Standard HTML label |
| Select | `select.tsx` | Standard HTML select |
| Alert | `alert.tsx` | `info`, `warning`, `error`, `success` |
| CodeBlock | `CodeBlock.tsx` | `code`, `language` |
| EmptyState | `EmptyState.tsx` | `icon`, `title`, `description` |
| PageHeader | `PageHeader.tsx` | `title`, `description`, `children` |
| SkeletonLoader | `SkeletonLoader.tsx` | `height`, `width` |

### Design Tokens (`lib/design/tokens.ts`)

```css
/* Colors */
--color-background: #0a0a0a
--color-surface: #1a1a1a
--color-border: #2a2a2a
--color-text-primary: #fafafa
--color-text-secondary: #a1a1aa
--color-text-muted: #71717a
--color-success: #22c55e
--color-warning: #f59e0b
--color-error: #ef4444
--color-info: #3b82f6

/* Spacing */
--spacing-xs: 0.25rem
--spacing-sm: 0.5rem
--spacing-md: 1rem
--spacing-lg: 1.5rem
--spacing-xl: 2rem

/* Typography */
--text-xs: 0.75rem
--text-sm: 0.875rem
--text-base: 1rem
--text-lg: 1.125rem
--text-xl: 1.25rem
--text-2xl: 1.5rem

/* Radius */
--radius-sm: 0.25rem
--radius-md: 0.375rem
--radius-lg: 0.5rem
```

---

## UX Improvement Recommendations

### P1 - High Impact

| # | Issue | File | Change |
|---|-------|------|--------|
| 1 | **No loading indicator on login** | `app/login/page.tsx` | Add `loading` state to button, show spinner during auth |
| 2 | **Missing form validation feedback** | `app/signup/page.tsx` | Add inline field errors from Zod schema |
| 3 | **No confirmation on destructive actions** | `components/ui/Dialog.tsx` | Add `confirmDestructive` variant with red CTA |
| 4 | **Empty states lack CTAs** | `components/ui/EmptyState.tsx` | Add optional `action` prop with button |
| 5 | **No keyboard navigation in log table** | `components/logs/LogsTable.tsx` | Add arrow key navigation, Enter to open drawer |

### P2 - Medium Impact

| # | Issue | File | Change |
|---|-------|------|--------|
| 6 | **Time displayed without timezone** | All pages | Use `Intl.DateTimeFormat` with user locale |
| 7 | **No copy-to-clipboard for API keys** | Service detail page | Add copy button with toast confirmation |
| 8 | **Pagination missing in logs** | `components/logs/LogsExplorerClient.tsx` | Add page size selector (25/50/100) |
| 9 | **No dark/light mode toggle** | `app/layout.tsx` | Add theme provider with system detection |
| 10 | **Missing breadcrumbs** | All detail pages | Add breadcrumb component above PageHeader |

### P3 - Polish

| # | Issue | File | Change |
|---|-------|------|--------|
| 11 | **No relative time for recent items** | Dashboard, Lists | Use "2 minutes ago" format with `timeago.js` |
| 12 | **Cards lack hover state** | `components/ui/Card.tsx` | Add subtle scale/shadow transform on hover |
| 13 | **No toast notifications** | Global | Add toast provider for success/error feedback |
| 14 | **Missing favicon** | `app/` | Add favicon.ico and apple-touch-icon |
| 15 | **No skeleton for charts** | Dashboard | Add chart skeleton component |

---

## Accessibility Checklist

| Area | Status | Notes |
|------|--------|-------|
| Focus indicators | ⚠️ | Need visible focus rings on all interactive elements |
| ARIA labels | ⚠️ | Missing on icon-only buttons |
| Keyboard navigation | ⚠️ | Table rows not focusable |
| Color contrast | ✅ | Dark theme meets WCAG AA |
| Screen reader | ⚠️ | Need aria-live regions for async updates |
| Skip links | ❌ | Missing skip-to-content link |

---

## Performance Notes

| Issue | Impact | Recommendation |
|-------|--------|----------------|
| Logs table renders all rows | High memory on large datasets | Implement virtual scrolling (react-window) |
| Dashboard makes 3 waterfall requests | Slow initial load | Combine into single `/api/dashboard` endpoint |
| No request caching | Repeated fetches | Add SWR or React Query with stale-while-revalidate |
| Large bundle size | Slow FCP | Audit with `next build --analyze`, code-split admin pages |
| No image optimization | N/A | No images currently used |
