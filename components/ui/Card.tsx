import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    style?: React.CSSProperties;
    onClick?: () => void;
    hover?: boolean;
}


export function Card({ children, className = '', padding = 'md', style, onClick, hover }: CardProps) {
    const paddingClass = {
        none: 'p-0',
        sm: 'p-sm',
        md: 'p-md',
        lg: 'p-lg',
    }[padding];

    return (
        <div
            className={`bg-card text-card-foreground border border-border/60 shadow-sm rounded-xl ${paddingClass} ${hover ? 'transition-shadow hover:shadow-md' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
            onClick={onClick}
            style={style}
        >
            {children}
        </div>
    );
}

