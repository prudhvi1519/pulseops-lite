import React from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
    children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background overflow-hidden p-6 md:p-10">
            {/* Decorative Background Elements */}
            <div className="pointer-events-none absolute -top-40 -left-40 size-96 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute top-40 right-20 size-64 rounded-full bg-info/5 blur-3xl opacity-50" />

            {/* Main Content Container */}
            <div className="relative z-10 w-full max-w-[420px] space-y-6">

                {/* Brand Header */}
                <div className="flex flex-col items-center text-center space-y-2">
                    <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <span className="text-2xl font-bold tracking-tight text-foreground">PulseOps</span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary border border-primary/20">
                            Lite
                        </span>
                    </Link>
                    <p className="text-sm text-muted-foreground max-w-xs">
                        Logs, alerts, incidents. Multi-tenant. Automated jobs.
                    </p>
                </div>

                {/* Card Slot */}
                {children}

                {/* Secure Badge / Footer */}
                <div className="flex justify-center">
                    <p className="text-xs text-muted-foreground/50">
                        Secured by PulseOps Identity
                    </p>
                </div>
            </div>
        </div>
    );
}
