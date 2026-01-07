import React from 'react';

interface AlertProps {
    variant?: 'default' | 'destructive';
    children: React.ReactNode;
    className?: string;
}

export function Alert({ children, variant = 'default', className = '' }: AlertProps) {
    return (
        <div className={`relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:translate-y-[-3px] [&:has(svg)]:pl-11
      ${variant === 'destructive' ? 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive' : 'bg-background text-foreground'}
      ${className}`}
        >
            {children}
        </div>
    );
}

export function AlertTitle({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    return <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`}>{children}</h5>;
}

export function AlertDescription({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    return <div className={`text-sm [&_p]:leading-relaxed ${className}`}>{children}</div>;
}
