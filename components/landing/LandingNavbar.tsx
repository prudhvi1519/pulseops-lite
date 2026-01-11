'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const NAV_LINKS = [
    { label: 'Features', href: '#features' },
    { label: 'Demo', href: '#demo' },
    { label: 'Under the Hood', href: '#prd-showroom' },
    { label: 'Stack', href: '#tech-stack' },
];

export function LandingNavbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <nav
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '64px',
                    zIndex: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 var(--spacing-lg)',
                    backgroundColor: scrolled ? 'rgba(250, 250, 250, 0.85)' : 'transparent',
                    backdropFilter: scrolled ? 'blur(12px)' : 'none',
                    borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
                    transition: 'all 200ms ease',
                }}
            >
                <div
                    style={{
                        maxWidth: '1280px',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    {/* Logo */}
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            PulseOps
                        </span>
                        <span
                            style={{
                                fontSize: 'var(--text-xs)',
                                fontWeight: 500,
                                color: 'var(--color-text-muted)',
                                backgroundColor: 'var(--color-border)',
                                padding: '2px 6px',
                                borderRadius: 'var(--radius-sm)',
                            }}
                        >
                            Lite
                        </span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-xl)',
                        }}
                        className="desktop-nav"
                    >
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                style={{
                                    fontSize: 'var(--text-sm)',
                                    color: 'var(--color-text-secondary)',
                                    transition: 'color 150ms',
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
                                onMouseOut={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Desktop Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }} className="desktop-nav">
                        <Link
                            href="/login"
                            style={{
                                fontSize: 'var(--text-sm)',
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                color: 'var(--color-text-secondary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                transition: 'all 150ms',
                            }}
                        >
                            Log in
                        </Link>
                        <Link
                            href="/signup"
                            style={{
                                fontSize: 'var(--text-sm)',
                                padding: 'var(--spacing-sm) var(--spacing-lg)',
                                color: '#fff',
                                backgroundColor: '#6366f1',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: 500,
                                transition: 'all 150ms',
                            }}
                        >
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile Hamburger */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="mobile-menu-button"
                        style={{
                            display: 'none',
                            padding: 'var(--spacing-sm)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                        aria-label="Toggle menu"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {mobileMenuOpen ? (
                                <path d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="mobile-menu-overlay"
                    style={{
                        position: 'fixed',
                        top: '64px',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(250, 250, 250, 0.98)',
                        zIndex: 49,
                        padding: 'var(--spacing-lg)',
                        display: 'none',
                        flexDirection: 'column',
                        gap: 'var(--spacing-md)',
                    }}
                >
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileMenuOpen(false)}
                            style={{
                                fontSize: 'var(--text-lg)',
                                padding: 'var(--spacing-md) 0',
                                borderBottom: '1px solid var(--color-border)',
                            }}
                        >
                            {link.label}
                        </a>
                    ))}
                    <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        <Link
                            href="/login"
                            style={{
                                textAlign: 'center',
                                padding: 'var(--spacing-md)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                            }}
                        >
                            Log in
                        </Link>
                        <Link
                            href="/signup"
                            style={{
                                textAlign: 'center',
                                padding: 'var(--spacing-md)',
                                backgroundColor: '#6366f1',
                                color: '#fff',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: 500,
                            }}
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            )}

            <style>{`
                @media (max-width: 768px) {
                    .desktop-nav { display: none !important; }
                    .mobile-menu-button { display: block !important; }
                    .mobile-menu-overlay { display: flex !important; }
                }
            `}</style>
        </>
    );
}
