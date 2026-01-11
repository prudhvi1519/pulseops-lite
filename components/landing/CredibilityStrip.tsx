const CREDIBILITY_ITEMS = [
    { label: '13 SQL Migrations', tooltip: 'Identity, services, logs, incidents, alerts, notifications' },
    { label: '37 API Routes', tooltip: 'Auth, CRUD, webhooks, cron endpoints' },
    { label: '16 DB Tables', tooltip: 'All scoped by org_id for multi-tenancy' },
    { label: '25+ Tests', tooltip: 'API integration + UI smoke tests' },
    { label: '4 Cron Jobs', tooltip: 'Rules eval, notifications, cleanup' },
];

export function CredibilityStrip() {
    return (
        <section
            style={{
                borderTop: '1px solid var(--color-border)',
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                padding: 'var(--spacing-md) var(--spacing-lg)',
                overflowX: 'auto',
            }}
        >
            <div
                style={{
                    maxWidth: '1280px',
                    margin: '0 auto',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 'var(--spacing-lg)',
                    flexWrap: 'nowrap',
                    minWidth: 'max-content',
                }}
            >
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    Built like a real system:
                </span>
                {CREDIBILITY_ITEMS.map((item, i) => (
                    <span
                        key={item.label}
                        title={item.tooltip}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-xs)',
                            fontSize: 'var(--text-sm)',
                            color: 'var(--color-text-secondary)',
                            cursor: 'default',
                        }}
                    >
                        <span style={{ color: '#22c55e' }}>✓</span>
                        {item.label}
                        {i < CREDIBILITY_ITEMS.length - 1 && (
                            <span style={{ color: 'var(--color-border)', marginLeft: 'var(--spacing-sm)' }}>•</span>
                        )}
                    </span>
                ))}
            </div>
        </section>
    );
}
