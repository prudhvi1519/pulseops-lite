import React from 'react';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--spacing-2xl)',
                textAlign: 'center',
            }}
        >
            {icon && (
                <div
                    style={{
                        marginBottom: 'var(--spacing-md)',
                        color: 'var(--color-text-muted)',
                    }}
                >
                    {icon}
                </div>
            )}
            <h3
                style={{
                    fontSize: 'var(--text-lg)',
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    margin: 0,
                    marginBottom: 'var(--spacing-xs)',
                }}
            >
                {title}
            </h3>
            {description && (
                <p
                    style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-text-secondary)',
                        margin: 0,
                        maxWidth: '24rem',
                    }}
                >
                    {description}
                </p>
            )}
            {action && (
                <div style={{ marginTop: 'var(--spacing-lg)' }}>
                    {action}
                </div>
            )}
        </div>
    );
}
