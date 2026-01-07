import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
    success: { bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
    warning: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
    error: { bg: 'var(--color-error-bg)', color: 'var(--color-error)' },
    info: { bg: 'var(--color-info-bg)', color: 'var(--color-info)' },
    neutral: { bg: 'var(--color-border-subtle)', color: 'var(--color-text-secondary)' },
};

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
    const styles = variantStyles[variant];

    return (
        <span
            className={className}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                borderRadius: 'var(--radius-md)',
                backgroundColor: styles.bg,
                color: styles.color,
            }}
        >
            {children}
        </span>
    );
}
