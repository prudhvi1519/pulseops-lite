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
            <header className="border-b bg-card">
                <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link href="/dashboard" className="text-lg font-semibold text-foreground hover:opacity-80 transition-opacity">
                        {appName}
                    </Link>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 py-10">
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t bg-card py-6">
                <div className="container mx-auto flex max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
                    <span className="text-sm text-muted-foreground">
                        {appName} &copy; {new Date().getFullYear()}
                    </span>
                </div>
            </footer>
        </div>
    );
}
