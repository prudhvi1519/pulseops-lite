# Production Proof Screens

**Project**: PulseOps Lite
**URL**: [https://pulseops-lite.vercel.app](https://pulseops-lite.vercel.app)
**Commit**: `9ec5e1c`
**Timestamp**: 2026-01-12T19:25:00+05:30

## Screenshot Manifest

| Route | Desktop (1440x900) | Mobile (390x844) | Integrity Check |
| :--- | :--- | :--- | :--- |
| **Landing** (`/`) | [01_landing.png](prod/desktop/01_landing.png) | [01_landing.png](prod/mobile/01_landing.png) | Centered hero, responsive nav |
| **Login** (`/login`) | [02_login.png](prod/desktop/02_login.png) | [02_login.png](prod/mobile/02_login.png) | Clean stack, focused inputs |
| **Signup** (`/signup`) | [03_signup.png](prod/desktop/03_signup.png) | [03_signup.png](prod/mobile/03_signup.png) | Consistent auth layout |
| **Dashboard** (`/dashboard`) | [04_dashboard.png](prod/desktop/04_dashboard.png) | [04_dashboard.png](prod/mobile/04_dashboard.png) | 2-col vs 1-col grid, gap-6 |
| **Services** (`/services`) | [05_services.png](prod/desktop/05_services.png) | [05_services.png](prod/mobile/05_services.png) | space-y-6 rhythm, card stack |
| **Logs** (`/logs`) | [06_logs.png](prod/desktop/06_logs.png) | [06_logs.png](prod/mobile/06_logs.png) | Full-width centered container |
| **Incidents** (`/incidents`) | [07_incidents.png](prod/desktop/07_incidents.png) | [07_incidents.png](prod/mobile/07_incidents.png) | Consistent PageHeader |
| **Orgs** (`/orgs`) | [08_orgs.png](prod/desktop/08_orgs.png) | [08_orgs.png](prod/mobile/08_orgs.png) | Card list, active badge |

## Notes
- **Privacy**: No live secrets are displayed. Dashboard data is from "E2E Tester" (Demo) account.
- **Rhythm**: All interior pages verified to use `space-y-6` vertical rhythm.
- **Navigation**: Desktop header centered. Mobile menu closes on click.
