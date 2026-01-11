import { Card } from '@/components/ui/Card';

const FEATURES = [
    {
        title: 'Organizations & Teams',
        description: 'Create orgs, invite members, switch contexts. Every row scoped by org_id.',
        proof: 'See migration → 0001_identity.sql',
        icon: '👥',
    },
    {
        title: 'RBAC Built In',
        description: 'Admin, Developer, Viewer. Checked server-side on every request.',
        proof: 'Inspect → lib/auth/rbac.ts',
        icon: '🔐',
    },
    {
        title: 'Log Ingestion',
        description: 'POST logs with x-api-key. Rate limited to 1,200/min. Keys stored hashed.',
        proof: 'Try the cURL below',
        icon: '📥',
    },
    {
        title: 'Search & Filter Logs',
        description: 'Filter by service, environment, level. Full-text search. Paginated.',
        proof: 'View → API_SPEC.md#logs',
        icon: '🔍',
    },
    {
        title: 'Deployment Tracking',
        description: 'GitHub webhook integration. HMAC verified. Idempotent delivery.',
        proof: 'Check → github.webhook.test.ts',
        icon: '🚀',
    },
    {
        title: 'Automated Alerts',
        description: 'Set error thresholds. Cron evaluates every 5 min. Incidents auto-created.',
        proof: 'See → app/api/v1/rules/evaluate',
        icon: '⚠️',
    },
    {
        title: 'Incident Management',
        description: 'Open → Investigating → Resolved. Full event timeline with actors.',
        proof: 'Browse → DB_SCHEMA.md#incidents',
        icon: '🔔',
    },
    {
        title: 'Slack & Discord',
        description: 'Configure webhook channels. Jobs queued with retries and backoff.',
        proof: 'Read → notifications/process',
        icon: '💬',
    },
];

export function FeatureGrid() {
    return (
        <section
            id="features"
            style={{
                padding: 'var(--spacing-2xl) var(--spacing-lg)',
            }}
        >
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
                    <h2
                        style={{
                            fontSize: 'var(--text-3xl)',
                            fontWeight: 700,
                            marginBottom: 'var(--spacing-sm)',
                        }}
                    >
                        What&apos;s inside
                    </h2>
                    <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)' }}>
                        8 core features. Each one backed by real code you can explore.
                    </p>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 'var(--spacing-lg)',
                    }}
                >
                    {FEATURES.map((feature) => (
                        <Card key={feature.title} padding="lg" hover>
                            <div style={{ marginBottom: 'var(--spacing-sm)', fontSize: '2rem' }}>{feature.icon}</div>
                            <h3
                                style={{
                                    fontSize: 'var(--text-lg)',
                                    fontWeight: 600,
                                    marginBottom: 'var(--spacing-xs)',
                                }}
                            >
                                {feature.title}
                            </h3>
                            <p
                                style={{
                                    fontSize: 'var(--text-sm)',
                                    color: 'var(--color-text-secondary)',
                                    marginBottom: 'var(--spacing-md)',
                                    lineHeight: 1.5,
                                }}
                            >
                                {feature.description}
                            </p>
                            <span
                                style={{
                                    fontSize: 'var(--text-xs)',
                                    color: '#6366f1',
                                    fontFamily: 'var(--font-mono)',
                                }}
                            >
                                {feature.proof}
                            </span>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
