import React from 'react';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            {icon && (
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    {icon}
                </div>
            )}
            <h3 className="mb-2 text-lg font-semibold text-foreground">
                {title}
            </h3>
            {description && (
                <p className="max-w-[28rem] mx-auto text-sm text-muted-foreground leading-relaxed">
                    {description}
                </p>
            )}
            {action && (
                <div className="mt-5 flex justify-center gap-2">
                    {action}
                </div>
            )}
        </div>
    );
}
