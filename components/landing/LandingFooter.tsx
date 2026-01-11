import Link from 'next/link';

export function LandingFooter() {
    return (
        <footer style={{ backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
            {/* CTA Card */}
            <div
                style={{
                    padding: 'var(--spacing-2xl) var(--spacing-lg)',
                }}
            >
                <div
                    style={{
                        maxWidth: '800px',
                        margin: '0 auto',
                        padding: 'var(--spacing-2xl)',
                        borderRadius: 'var(--radius-xl)',
                        background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                        textAlign: 'center',
                    }}
                >
                    <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#fff', marginBottom: 'var(--spacing-sm)' }}>
                        Ready to explore?
                    </h2>
                    <p style={{ fontSize: 'var(--text-base)', color: 'rgba(255,255,255,0.9)', marginBottom: 'var(--spacing-lg)' }}>
                        Sign up, create a service, and send your first log in under 2 minutes.
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link
                            href="/signup"
                            style={{
                                padding: 'var(--spacing-md) var(--spacing-xl)',
                                backgroundColor: '#fff',
                                color: '#6366f1',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: 600,
                                fontSize: 'var(--text-base)',
                            }}
                        >
                            Start Building →
                        </Link>
                        <a
                            href="https://github.com/prudhvi1519/pulseops-lite"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                padding: 'var(--spacing-md) var(--spacing-xl)',
                                backgroundColor: 'transparent',
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.5)',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: 500,
                                fontSize: 'var(--text-base)',
                            }}
                        >
                            View on GitHub
                        </a>
                    </div>
                </div>
            </div>

            {/* Footer Bottom */}
            <div
                style={{
                    padding: 'var(--spacing-lg)',
                    borderTop: '1px solid var(--color-border)',
                }}
            >
                <div
                    style={{
                        maxWidth: '1280px',
                        margin: '0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 'var(--spacing-md)',
                    }}
                >
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                        PulseOps Lite — A portfolio project by{' '}
                        <a
                            href="https://github.com/prudhvi1519"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#6366f1' }}
                        >
                            prudhvi1519
                        </a>
                    </span>
                    <div style={{ display: 'flex', gap: 'var(--spacing-lg)' }}>
                        <a
                            href="https://github.com/prudhvi1519/pulseops-lite"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}
                        >
                            GitHub
                        </a>
                        <Link href="/login" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                            Log in
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
