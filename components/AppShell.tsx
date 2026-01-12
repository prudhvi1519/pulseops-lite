'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AppShellProps {
    children: React.ReactNode;
    headerActions?: React.ReactNode;
}

export function AppShell({ children, headerActions }: AppShellProps) {
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'PulseOps Lite';
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navLinks = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/services', label: 'Services' },
        { href: '/logs', label: 'Logs' },
        { href: '/incidents', label: 'Incidents' },
        { href: '/orgs', label: 'Organizations' },
    ];

    const isActive = (path: string) => {
        if (path === '/dashboard') return pathname === path;
        return pathname.startsWith(path);
    };

    // Close mobile menu when route changes
    React.useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Close mobile menu on Escape key
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsMobileMenuOpen(false);
            }
        };

        if (isMobileMenuOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isMobileMenuOpen]);

    return (
        <div className="flex min-h-screen flex-col bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur flex justify-center">
                <div className="w-full flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-8">
                        {/* Brand */}
                        <Link href="/dashboard" className="text-lg font-semibold text-foreground hover:opacity-80 transition-opacity whitespace-nowrap shrink-0">
                            {appName}
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`inline-flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors ${isActive(link.href)
                                        ? 'bg-muted text-foreground'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Header Actions Slot */}
                        {headerActions && (
                            <div className="flex items-center gap-2 shrink-0">
                                {headerActions}
                            </div>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            className="flex shrink-0 md:hidden items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle menu"
                            aria-expanded={isMobileMenuOpen}
                            aria-controls="app-mobile-nav"
                        >
                            {isMobileMenuOpen ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="3" y1="12" x2="21" y2="12" />
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <line x1="3" y1="18" x2="21" y2="18" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Panel */}
                {isMobileMenuOpen && (
                    <div
                        id="app-mobile-nav"
                        className="absolute top-14 left-0 right-0 md:hidden border-b border-border bg-background/95 backdrop-blur px-4 py-3 shadow-lg transition-all duration-150 ease-out"
                    >
                        <nav className="flex flex-col gap-1 mx-auto max-w-6xl">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors ${isActive(link.href)
                                        ? 'bg-muted text-foreground'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                )}
            </header>

            {/* Main content */}
            <main className="flex-1 py-8 flex flex-col items-center w-full">
                <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border/40 bg-card/50 py-6 flex justify-center">
                <div className="w-full flex max-w-6xl items-center justify-center px-4 sm:px-6 lg:px-8">
                    <span className="text-sm text-muted-foreground">
                        {appName} &copy; {new Date().getFullYear()}
                    </span>
                </div>
            </footer>
        </div>
    );
}
