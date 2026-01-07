import React from 'react';

interface SkeletonLoaderProps {
    width?: string;
    height?: string;
    borderRadius?: string;
    className?: string;
    style?: React.CSSProperties;
}

export function SkeletonLoader({
    width = '100%',
    height = '1rem',
    borderRadius = 'var(--radius-md)',
    className = '',
    style
}: SkeletonLoaderProps) {
    return (
        <div
            className={className}
            style={{
                width,
                height,
                borderRadius,
                backgroundColor: 'var(--color-border-subtle)',
                animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                ...style,
            }}
            data-testid="skeleton-loader"
        />
    );
}

// Add keyframes via a style tag in the component
export function SkeletonStyles() {
    return (
        <style>{`
      @keyframes skeleton-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `}</style>
    );
}
