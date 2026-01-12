import React from 'react';

interface PageSectionProps {
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export function PageSection({ title, description, children, className = '' }: PageSectionProps) {
    return (
        <section className={`space-y-4 ${className}`}>
            {(title || description) && (
                <div className="flex flex-col gap-0.5">
                    {title && (
                        <h3 className="text-lg font-medium text-foreground">
                            {title}
                        </h3>
                    )}
                    {description && (
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            )}
            {children}
        </section>
    );
}
