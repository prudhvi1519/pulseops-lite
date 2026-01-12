'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
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
                    <div className="mt-4">
                        <SkeletonLoader height="1rem" width="300px" />
                    </div>
                </Card>
            </AppShell>
        );
    }

    if (!data) {
        return null;
    }

    const { user } = data;

    return (
        <AppShell>
            <PageHeader
                title="Dashboard"
                description={`Welcome back${user?.name ? `, ${user.name}` : ''}`}
            >
                <Button variant="outline" onClick={handleLogout}>
                    Sign Out
                </Button>
            </PageHeader>

            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="flex flex-col gap-6">
                        {/* Organization Context */}
                        <Card padding="lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="mb-1 text-xs text-muted-foreground">
                                        Current Organization
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-medium text-foreground">
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

                                <Link
                                    href="/orgs"
                                    className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    Switch Org
                                </Link>
                            </div>
                        </Card>

                        {/* System Health / Diagnostics */}
                        {diagnostics && (
                            <Card padding="lg">
                                <h3 className="mb-4 text-lg font-medium">System Health</h3>
                                <div className="flex gap-8">
                                    <div className="text-center">
                                        <div className={`text-2xl font-bold ${diagnostics.incidents.open !== '0' ? 'text-destructive' : 'text-success'}`}>
                                            {diagnostics.incidents.open}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Open Incidents</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-2xl font-bold ${diagnostics.notifications.failed !== '0' ? 'text-warning' : 'text-foreground'}`}>
                                            {diagnostics.notifications.failed}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Failed Notifications</div>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Quick Links */}
                        <Card padding="md">
                            <div className="flex flex-wrap gap-4">
                                <Link
                                    href="/services"
                                    className="flex min-w-[150px] flex-1 flex-col items-center justify-center rounded-md border border-border bg-background p-4 text-center transition-colors hover:bg-accent hover:text-accent-foreground"
                                >
                                    <div className="font-medium">Services</div>
                                    <div className="text-xs text-muted-foreground">Manage services & API keys</div>
                                </Link>
                                <Link
                                    href="/logs"
                                    className="flex min-w-[150px] flex-1 flex-col items-center justify-center rounded-md border border-border bg-background p-4 text-center transition-colors hover:bg-accent hover:text-accent-foreground"
                                >
                                    <div className="font-medium">Logs Explorer</div>
                                    <div className="text-xs text-muted-foreground">Search & analyze logs</div>
                                </Link>
                            </div>
                        </Card>
                    </div>

                    <div className="flex flex-col gap-6">
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
            </div>
        </AppShell>
    );
}
