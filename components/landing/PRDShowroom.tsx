'use client';

import { useState } from 'react';

const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'flows', label: 'Core Flows' },
    { id: 'api', label: 'API' },
    { id: 'db', label: 'Database' },
    { id: 'security', label: 'Security' },
    { id: 'ops', label: 'Ops Proof' },
];

const TAB_CONTENT: Record<string, { intro: string; items: string[] }> = {
    overview: {
        intro: 'PulseOps Lite is a lightweight operations platform. A real codebase you can explore, fork, and learn from.',
        items: [
            'Multi-tenant architecture with org-scoped data isolation',
            'Session-based auth with hashed tokens + RBAC',
            'GitHub Actions cron jobs calling internal API endpoints',
        ],
    },
    flows: {
        intro: 'Three flows power the system: authentication, log ingestion, and incident creation.',
        items: [
            'Auth: Signup → bcrypt hash → session token → SHA-256 → cookie',
            'Logs: x-api-key → validate → rate limit → batch insert',
            'Incidents: Alert evaluates → threshold breach → incident + events → notification job',
        ],
    },
    api: {
        intro: '37 endpoints across auth, services, logs, incidents, alerts, and notifications.',
        items: [
            'POST /api/v1/logs/ingest — Auth: x-api-key, Rate: 1200/min',
            'GET /api/logs/query — Filters: service, env, level, search',
            'POST /api/incidents/create — Auth: Session (Developer+)',
        ],
    },
    db: {
        intro: '16 tables. All tenant-scoped with org_id. Proper indexes for performance.',
        items: [
            'Identity: orgs, users, org_members, sessions',
            'Services: services, environments, api_keys',
            'Data: logs, incidents, incident_events, alert_rules, alert_firings',
            'Notifications: notification_channels, notification_jobs',
        ],
    },
    security: {
        intro: 'Security is built in, not bolted on.',
        items: [
            'Session tokens: SHA-256 hashed before storage',
            'API keys: Salted SHA-256 (requires API_KEY_SALT env)',
            'GitHub webhooks: HMAC-SHA256 signature verification',
            'Cron endpoints: Protected by x-internal-cron-secret header',
        ],
    },
    ops: {
        intro: 'CI/CD, cron jobs, and deployment. All automated.',
        items: [
            'CI pipeline: checkout → install → lint → typecheck → migrate → test',
            'Cron jobs: rules eval (5min), notifications (5min), cleanup (daily)',
            'Deployment: Vercel + Neon Postgres, env vars managed securely',
        ],
    },
};

export function PRDShowroom() {
    const [activeTab, setActiveTab] = useState('overview');

    const content = TAB_CONTENT[activeTab];

    return (
        <section
            id="prd-showroom"
            style={{
                padding: 'var(--spacing-2xl) var(--spacing-lg)',
                backgroundColor: 'var(--color-background)',
            }}
        >
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
                    <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
                        Under the Hood
                    </h2>
                    <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)' }}>
                        The PRD showroom. Real architecture, real decisions, real code.
                    </p>
                </div>

                {/* Tabs */}
                <div
                    style={{
                        display: 'flex',
                        gap: 'var(--spacing-xs)',
                        marginBottom: 'var(--spacing-lg)',
                        overflowX: 'auto',
                        paddingBottom: 'var(--spacing-sm)',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                fontSize: 'var(--text-sm)',
                                fontWeight: 500,
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                transition: 'all 150ms',
                                backgroundColor: activeTab === tab.id ? '#6366f1' : 'var(--color-surface)',
                                color: activeTab === tab.id ? '#fff' : 'var(--color-text-secondary)',
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div
                    style={{
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--spacing-xl)',
                    }}
                >
                    <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                        {content.intro}
                    </p>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        {content.items.map((item, i) => (
                            <li
                                key={i}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 'var(--spacing-sm)',
                                    fontSize: 'var(--text-sm)',
                                    fontFamily: 'var(--font-mono)',
                                    color: 'var(--color-text-primary)',
                                    padding: 'var(--spacing-sm)',
                                    backgroundColor: 'var(--color-background)',
                                    borderRadius: 'var(--radius-sm)',
                                }}
                            >
                                <span style={{ color: '#22c55e' }}>→</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Links */}
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)', justifyContent: 'center' }}>
                    <a
                        href="https://github.com/prudhvi1519/pulseops-lite"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            fontSize: 'var(--text-sm)',
                            color: '#6366f1',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-xs)',
                        }}
                    >
                        View on GitHub ↗
                    </a>
                </div>
            </div>
        </section>
    );
}
