const STACK = [
    { name: 'Next.js 15', description: 'App Router' },
    { name: 'React 19', description: 'Server Components' },
    { name: 'TypeScript', description: 'Strict mode' },
    { name: 'Vercel', description: 'Deployment' },
    { name: 'Neon Postgres', description: 'Database' },
    { name: 'GitHub Actions', description: 'CI + Cron' },
];

const HIGHLIGHTS = [
    'App Router only — no pages/ directory',
    'Raw SQL — no ORM, full control',
    '13 migrations, all idempotent',
    'Session tokens SHA-256 hashed',
    'API keys salted + hashed',
    'Rate limiting via atomic upsert',
    'Webhook idempotency built-in',
    'Cron via GitHub Actions YAML',
    'Correlation IDs on every request',
    'No mock data — all real DB operations',
];

export function TechStackSection() {
    return (
        <section
            id="tech-stack"
            style={{
                padding: 'var(--spacing-2xl) var(--spacing-lg)',
                backgroundColor: 'var(--color-background)',
            }}
        >
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
                    <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
                        Tech Stack
                    </h2>
                    <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)' }}>
                        Modern tools. No magic. Just good engineering.
                    </p>
                </div>

                {/* Stack Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-2xl)' }}>
                    {STACK.map((item) => (
                        <div
                            key={item.name}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: 'var(--spacing-md) var(--spacing-lg)',
                                backgroundColor: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-lg)',
                                minWidth: '120px',
                            }}
                        >
                            <span style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{item.name}</span>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{item.description}</span>
                        </div>
                    ))}
                </div>

                {/* Highlights */}
                <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-xl)' }}>
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
                        Engineering Highlights
                    </h3>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: 'var(--spacing-sm)',
                        }}
                    >
                        {HIGHLIGHTS.map((item, i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)',
                                    fontSize: 'var(--text-sm)',
                                    color: 'var(--color-text-secondary)',
                                }}
                            >
                                <span style={{ color: '#6366f1' }}>•</span>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
