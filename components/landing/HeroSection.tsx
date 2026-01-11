import Link from 'next/link';

const TRUST_BADGES = [
    { label: 'Open Source', icon: '📂' },
    { label: 'Multi-Tenant', icon: '👥' },
    { label: 'RBAC Enforced', icon: '🔐' },
    { label: 'Rate Limited', icon: '⚡' },
    { label: 'Vercel Deployed', icon: '▲' },
    { label: 'Neon Postgres', icon: '🐘' },
];

export function HeroSection() {
    return (
        <section
            id="hero"
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: '96px',
                paddingBottom: 'var(--spacing-2xl)',
                paddingLeft: 'var(--spacing-lg)',
                paddingRight: 'var(--spacing-lg)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)',
            }}
        >
            <div
                style={{
                    maxWidth: '1280px',
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 'var(--spacing-2xl)',
                    alignItems: 'center',
                }}
            >
                {/* Left: Copy */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    <h1
                        style={{
                            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                            fontWeight: 700,
                            lineHeight: 1.1,
                            color: 'var(--color-text-primary)',
                        }}
                    >
                        Ship with confidence.
                        <br />
                        <span style={{ color: '#6366f1' }}>Debug with context.</span>
                    </h1>

                    <p
                        style={{
                            fontSize: 'var(--text-lg)',
                            color: 'var(--color-text-secondary)',
                            lineHeight: 1.6,
                            maxWidth: '540px',
                        }}
                    >
                        PulseOps Lite is an open-source operations platform for logs, incidents, and deployments.
                        Multi-tenant by design. Built like a real production system—because it is one.
                    </p>

                    {/* CTAs */}
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                        <Link
                            href="/login"
                            className="hover-glow"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)',
                                padding: 'var(--spacing-md) var(--spacing-xl)',
                                backgroundColor: '#6366f1',
                                color: '#fff',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: 500,
                                fontSize: 'var(--text-base)',
                            }}
                        >
                            Open App →
                        </Link>
                        <a
                            href="#prd-showroom"
                            className="hover-border"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)',
                                padding: 'var(--spacing-md) var(--spacing-xl)',
                                backgroundColor: 'transparent',
                                color: 'var(--color-text-primary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: 500,
                                fontSize: 'var(--text-base)',
                            }}
                        >
                            View PRD Showcase ↓
                        </a>
                    </div>

                    {/* Trust Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                        {TRUST_BADGES.map((badge) => (
                            <span
                                key={badge.label}
                                className="hover-scale"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-xs)',
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--color-text-muted)',
                                    backgroundColor: 'var(--color-surface)',
                                    padding: '4px 10px',
                                    borderRadius: '9999px',
                                    border: '1px solid var(--color-border)',
                                    cursor: 'default',
                                }}
                            >
                                <span>{badge.icon}</span>
                                {badge.label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Right: Demo Preview Card */}
                <div
                    style={{
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-xl)',
                        padding: 'var(--spacing-lg)',
                        boxShadow: 'var(--shadow-md)',
                    }}
                >
                    {/* Fake Terminal Header */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: 'var(--spacing-md)' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                    </div>

                    {/* Terminal Content */}
                    <pre
                        style={{
                            fontSize: 'var(--text-sm)',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--color-text-secondary)',
                            whiteSpace: 'pre-wrap',
                            margin: 0,
                            lineHeight: 1.6,
                        }}
                    >
                        <code>
                            {`$ curl -X POST /api/v1/logs/ingest \\
  -H "x-api-key: pol_****" \\
  -d '{"logs":[{"level":"error",...}]}'

{"data":{"accepted":1}}

✓ Log ingested
✓ Alert rule evaluated
✓ Incident created
✓ Slack notified`}
                        </code>
                    </pre>
                </div>
            </div>
        </section>
    );
}
