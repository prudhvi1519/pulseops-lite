import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';

export default function HomePage() {
    const version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev';

    return (
        <AppShell>
            <PageHeader
                title="System Status"
                description="Current operational status of all system components"
            />

            <Card padding="lg">
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 'var(--spacing-md)',
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                            <span
                                style={{
                                    fontSize: 'var(--text-lg)',
                                    fontWeight: 500,
                                    color: 'var(--color-text-primary)',
                                }}
                            >
                                System Status: OK (mock)
                            </span>
                            <Badge variant="success">Operational</Badge>
                        </div>
                        <p
                            style={{
                                fontSize: 'var(--text-sm)',
                                color: 'var(--color-text-secondary)',
                                margin: 0,
                            }}
                        >
                            All systems are running normally
                        </p>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: 'var(--spacing-xs)',
                        }}
                    >
                        <span
                            style={{
                                fontSize: 'var(--text-xs)',
                                color: 'var(--color-text-muted)',
                            }}
                        >
                            Version
                        </span>
                        <code
                            style={{
                                fontSize: 'var(--text-sm)',
                                color: 'var(--color-text-secondary)',
                                fontFamily: 'var(--font-mono)',
                                backgroundColor: 'var(--color-border-subtle)',
                                padding: 'var(--spacing-xs) var(--spacing-sm)',
                                borderRadius: 'var(--radius-sm)',
                            }}
                        >
                            {version}
                        </code>
                    </div>
                </div>
            </Card>
        </AppShell>
    );
}
