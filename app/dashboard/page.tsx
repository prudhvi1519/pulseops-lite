'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { LatestDeployments } from '@/components/dashboard/LatestDeployments';

interface MeData {
    user: {
        id: string;
        email: string;
        name: string | null;
    };
    activeOrgId: string;
    activeOrgName: string;
    role: string;
}

interface DiagnosticsData {
    incidents: { open: string };
    notifications: { pending: string; failed: string };
}

export default function DashboardPage() {
    const router = useRouter();
    const [data, setData] = useState<MeData | null>(null);
    const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const [meRes, diagRes] = await Promise.all([
                fetch('/api/me'),
                fetch('/api/diagnostics/summary')
            ]);

            if (meRes.status === 401 || meRes.status === 403) {
                router.push('/login');
                return;
            }

            const meJson = await meRes.json();
            setData(meJson.data);

            if (diagRes.ok) {
                const diagJson = await diagRes.json();
                setDiagnostics(diagJson.data);
            }
        } catch {
            router.push('/login');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    if (loading) {
        return (
            <AppShell>
                <PageHeader title="Dashboard" />
                <Card padding="lg">
                    <SkeletonLoader height="1.5rem" width="200px" />
                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                        <SkeletonLoader height="1rem" width="300px" />
                    </div>
                </Card>
            </AppShell>
        );
    }

    if (!data) {
        return null;
    }

    return (
        <AppShell>
            <PageHeader
                title="Dashboard"
                description={`Welcome back${data.user.name ? `, ${data.user.name}` : ''}`}
            >
                <button
                    onClick={handleLogout}
                    style={{
                        padding: 'var(--spacing-xs) var(--spacing-md)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-sm)',
                        cursor: 'pointer',
                    }}
                >
                    Sign Out
                </button>
            </PageHeader>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    {/* Organization Context */}
                    <Card padding="lg">
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div>
                                <p
                                    style={{
                                        fontSize: 'var(--text-xs)',
                                        color: 'var(--color-text-muted)',
                                        marginBottom: 'var(--spacing-xs)',
                                    }}
                                >
                                    Current Organization
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                    <span
                                        style={{
                                            fontSize: 'var(--text-lg)',
                                            fontWeight: 500,
                                            color: 'var(--color-text-primary)',
                                        }}
                                    >
                                        {data.activeOrgName}
                                    </span>
                                    <Badge
                                        variant={
                                            data.role === 'admin'
                                                ? 'info'
                                                : data.role === 'developer'
                                                    ? 'warning'
                                                    : 'neutral'
                                        }
                                    >
                                        {data.role}
                                    </Badge>
                                </div>
                            </div>

                            <a
                                href="/orgs"
                                style={{
                                    padding: 'var(--spacing-xs) var(--spacing-md)',
                                    backgroundColor: 'var(--color-surface)',
                                    color: 'var(--color-text-primary)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: 'var(--text-sm)',
                                    textDecoration: 'none',
                                }}
                            >
                                Switch Org
                            </a>
                        </div>
                    </Card>

                    {/* System Health / Diagnostics */}
                    {diagnostics && (
                        <Card padding="lg">
                            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 500, marginBottom: 'var(--spacing-md)' }}>System Health</h3>
                            <div style={{ display: 'flex', gap: 'var(--spacing-lg)' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', color: diagnostics.incidents.open !== '0' ? 'var(--color-error)' : 'var(--color-success)' }}>
                                        {diagnostics.incidents.open}
                                    </div>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Open Incidents</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', color: diagnostics.notifications.failed !== '0' ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>
                                        {diagnostics.notifications.failed}
                                    </div>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Failed Notifications</div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Quick Links */}
                    <Card padding="md">
                        <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                            <Link
                                href="/services"
                                style={{
                                    flex: 1,
                                    minWidth: '150px',
                                    padding: 'var(--spacing-md)',
                                    backgroundColor: 'var(--color-background)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    textDecoration: 'none',
                                    color: 'var(--color-text-primary)',
                                    textAlign: 'center',
                                }}
                            >
                                <div style={{ fontWeight: 500 }}>Services</div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Manage services & API keys</div>
                            </Link>
                            <Link
                                href="/logs"
                                style={{
                                    flex: 1,
                                    minWidth: '150px',
                                    padding: 'var(--spacing-md)',
                                    backgroundColor: 'var(--color-background)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    textDecoration: 'none',
                                    color: 'var(--color-text-primary)',
                                    textAlign: 'center',
                                }}
                            >
                                <div style={{ fontWeight: 500 }}>Logs Explorer</div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Search & analyze logs</div>
                            </Link>
                        </div>
                    </Card>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    {/* Latest Deployments */}
                    <LatestDeployments />

                    {/* Incidents Empty State (Placeholder for full list) */}
                    <Card padding="lg">
                        <EmptyState
                            title="No incidents yet"
                            description="When incidents occur, they will appear here."
                            icon={
                                <svg
                                    width="48"
                                    height="48"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                                    <path d="M12 8v4" />
                                    <path d="M12 16h.01" />
                                </svg>
                            }
                        />
                    </Card>
                </div>
            </div>
        </AppShell>
    );
}
