import React from 'react';
import Link from 'next/link';

interface LinkButtonProps {
    href: string;
    children: React.ReactNode;
    variant?: 'ghost' | 'link';
    className?: string;
}

export function LinkButton({ href, children, variant = 'link', className = '' }: LinkButtonProps) {
    const baseStyles = "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

    const variants = {
        ghost: "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium hover:bg-muted hover:text-foreground bg-transparent text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
    };

    return (
        <Link
            href={href}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {children}
        </Link>
    );
}
