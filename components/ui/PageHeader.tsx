import React from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-xs)',
                marginBottom: 'var(--spacing-lg)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--spacing-md)',
                }}
            >
                <h1
                    style={{
                        fontSize: 'var(--text-2xl)',
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        margin: 0,
                    }}
                >
                    {title}
                </h1>
                {children}
            </div>
            {description && (
                <p
                    style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-text-secondary)',
                        margin: 0,
                    }}
                >
                    {description}
                </p>
            )}
        </div>
    );
}
