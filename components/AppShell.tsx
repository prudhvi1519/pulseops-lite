import React from 'react';

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'PulseOps Lite';

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Header */}
            <header
                style={{
                    backgroundColor: 'var(--color-surface)',
                    borderBottom: '1px solid var(--color-border)',
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                }}
            >
                <div
                    style={{
                        maxWidth: '72rem',
                        margin: '0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <span
                        style={{
                            fontSize: 'var(--text-lg)',
                            fontWeight: 600,
                            color: 'var(--color-text-primary)',
                        }}
                    >
                        {appName}
                    </span>
                </div>
            </header>

            {/* Main content */}
            <main
                style={{
                    flex: 1,
                    padding: 'var(--spacing-lg)',
                }}
            >
                <div
                    style={{
                        maxWidth: '72rem',
                        margin: '0 auto',
                    }}
                >
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer
                style={{
                    backgroundColor: 'var(--color-surface)',
                    borderTop: '1px solid var(--color-border)',
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                }}
            >
                <div
                    style={{
                        maxWidth: '72rem',
                        margin: '0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <span
                        style={{
                            fontSize: 'var(--text-sm)',
                            color: 'var(--color-text-muted)',
                        }}
                    >
                        {appName}
                    </span>
                </div>
            </footer>
        </div>
    );
}
