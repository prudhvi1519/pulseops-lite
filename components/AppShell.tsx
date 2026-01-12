import React from 'react';
import Link from 'next/link';

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'PulseOps Lite';

    return (
        <div className="flex min-h-screen flex-col bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
                <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-8">
                    <Link href="/dashboard" className="text-lg font-semibold text-foreground hover:opacity-80 transition-opacity">
                        {appName}
                    </Link>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 py-8">
                <div className="container mx-auto max-w-6xl px-4 md:px-8 space-y-6">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border/40 bg-card/50 py-6">
                <div className="container mx-auto flex max-w-6xl items-center justify-center px-4 md:px-8">
                    <span className="text-sm text-muted-foreground">
                        {appName} &copy; {new Date().getFullYear()}
                    </span>
                </div>
            </footer>
        </div>
    );
}
