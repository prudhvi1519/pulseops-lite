import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'sm' | 'md' | 'lg';
    style?: React.CSSProperties;
    onClick?: () => void;
}

const paddingMap = {
    sm: 'var(--spacing-sm)',
    md: 'var(--spacing-md)',
    lg: 'var(--spacing-lg)',
};

export function Card({ children, className = '', padding = 'md', style, onClick }: CardProps) {
    return (
        <div
            className={className}
            onClick={onClick}
            style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: paddingMap[padding],
                cursor: onClick ? 'pointer' : undefined,
                ...style,
            }}
        >
            {children}
        </div>
    );
}
