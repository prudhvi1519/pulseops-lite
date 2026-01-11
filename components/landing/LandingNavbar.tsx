'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const NAV_LINKS = [
    { label: 'Features', href: '#features', sectionId: 'features' },
    { label: 'Demo', href: '#demo', sectionId: 'demo' },
    { label: 'Under the Hood', href: '#prd-showroom', sectionId: 'prd-showroom' },
    { label: 'Stack', href: '#tech-stack', sectionId: 'tech-stack' },
];

const MOBILE_MENU_ID = 'mobile-menu';

export function LandingNavbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>(null);

    // Scroll detection for navbar background
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // IntersectionObserver for scrollspy
    useEffect(() => {
        const sectionIds = NAV_LINKS.map((link) => link.sectionId);
        const observers: IntersectionObserver[] = [];

        sectionIds.forEach((id) => {
            const element = document.getElementById(id);
            if (!element) return;

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            setActiveSection(id);
                        }
                    });
                },
                {
                    rootMargin: '-80px 0px -50% 0px', // Account for navbar height
                    threshold: 0,
                }
            );

            observer.observe(element);
            observers.push(observer);
        });

        return () => {
            observers.forEach((observer) => observer.disconnect());
        };
    }, []);

    const getLinkStyle = (sectionId: string) => ({
        fontSize: 'var(--text-sm)',
        color: activeSection === sectionId ? '#6366f1' : 'var(--color-text-secondary)',
        fontWeight: activeSection === sectionId ? 500 : 400,
        transition: 'color 150ms',
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        borderRadius: 'var(--radius-sm)',
        outline: 'none',
    });

    const handleSkipToContent = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.preventDefault();
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.scrollIntoView({ behavior: 'smooth' });
            mainContent.focus();
        }
    };

    return (
        <>
            {/* Skip to content link - CSS visibility via class, no URL hash */}
            <button
                className="skip-link"
                onClick={handleSkipToContent}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        handleSkipToContent(e);
                    }
                }}
                type="button"
            >
                Skip to content
            </button>

            <nav
                role="navigation"
                aria-label="Main navigation"
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
                    transition: 'background-color 200ms ease, border-bottom 200ms ease',
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
                            gap: 'var(--spacing-md)',
                        }}
                        className="desktop-nav"
                        role="list"
                    >
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                role="listitem"
                                aria-current={activeSection === link.sectionId ? 'true' : undefined}
                                style={getLinkStyle(link.sectionId)}
                                onFocus={(e) => {
                                    e.currentTarget.style.outline = '2px solid #6366f1';
                                    e.currentTarget.style.outlineOffset = '2px';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.outline = 'none';
                                }}
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
                        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={mobileMenuOpen}
                        aria-controls={MOBILE_MENU_ID}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
                    id={MOBILE_MENU_ID}
                    className="mobile-menu-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Navigation menu"
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
                    <nav role="navigation" aria-label="Mobile navigation">
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                aria-current={activeSection === link.sectionId ? 'true' : undefined}
                                style={{
                                    display: 'block',
                                    fontSize: 'var(--text-lg)',
                                    padding: 'var(--spacing-md) 0',
                                    borderBottom: '1px solid var(--color-border)',
                                    color: activeSection === link.sectionId ? '#6366f1' : 'inherit',
                                    fontWeight: activeSection === link.sectionId ? 500 : 400,
                                }}
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>
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
                /* Skip link styles - hidden by default, visible on focus */
                .skip-link {
                    position: absolute;
                    left: -9999px;
                    top: auto;
                    width: 1px;
                    height: 1px;
                    overflow: hidden;
                    background: none;
                    border: none;
                    cursor: pointer;
                }
                
                .skip-link:focus-visible {
                    position: fixed;
                    left: var(--spacing-md);
                    top: var(--spacing-md);
                    width: auto;
                    height: auto;
                    overflow: visible;
                    padding: var(--spacing-sm) var(--spacing-md);
                    background-color: #6366f1;
                    color: #fff;
                    border-radius: var(--radius-md);
                    font-size: var(--text-sm);
                    font-weight: 500;
                    z-index: 100;
                    outline: 2px solid #6366f1;
                    outline-offset: 2px;
                }
                
                @media (max-width: 768px) {
                    .desktop-nav { display: none !important; }
                    .mobile-menu-button { display: block !important; }
                    .mobile-menu-overlay { display: flex !important; }
                }
                
                /* Focus visible styles */
                a:focus-visible, button:focus-visible:not(.skip-link) {
                    outline: 2px solid #6366f1;
                    outline-offset: 2px;
                }
                
                /* Reduced motion - disable transitions */
                @media (prefers-reduced-motion: reduce) {
                    nav, a, button {
                        transition: none !important;
                    }
                }
            `}</style>
        </>
    );
}
