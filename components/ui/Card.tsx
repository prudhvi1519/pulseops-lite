import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'sm' | 'md' | 'lg';
    style?: React.CSSProperties;
    onClick?: () => void;
    hover?: boolean;
}


export function Card({ children, className = '', padding = 'md', style, onClick, hover }: CardProps) {
    const paddingClass = {
        sm: 'p-sm',
        md: 'p-md',
        lg: 'p-lg',
    }[padding];

    return (
        <div
            className={`bg-card text-card-foreground border border-border/60 shadow-sm rounded-xl ${paddingClass} ${hover ? 'hover-lift' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
            onClick={onClick}
            style={style}
        >
            {children}
        </div>
    );
}

