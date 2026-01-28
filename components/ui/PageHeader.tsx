import React from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex w-full sm:w-auto items-center gap-2">
                    <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
}
