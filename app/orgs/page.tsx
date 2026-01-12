'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { LinkButton } from '@/components/ui/LinkButton';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

interface Org {
    orgId: string;
    orgName: string;
    role: string;
}

interface MeData {
    activeOrgId: string;
    role: string;
}

export default function OrgsPage() {
    const router = useRouter();
    const [orgs, setOrgs] = useState<Org[]>([]);
    const [activeOrgId, setActiveOrgId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [switching, setSwitching] = useState<string | null>(null);
    const [error, setError] = useState('');

    const loadData = useCallback(async () => {
        try {
            const [orgsRes, meRes] = await Promise.all([
                fetch('/api/orgs'),
                fetch('/api/me'),
            ]);

            if (orgsRes.status === 401 || meRes.status === 401) {
                router.push('/login');
                return;
            }

            const orgsData = await orgsRes.json();
            const meData: { data: MeData } = await meRes.json();

            setOrgs(orgsData.data?.orgs || []);
            setActiveOrgId(meData.data?.activeOrgId || '');
        } catch {
            setError('Failed to load organizations');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSwitch = async (orgId: string) => {
        if (orgId === activeOrgId) return;

        setSwitching(orgId);
        setError('');

        try {
            const res = await fetch('/api/orgs/active', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgId }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error?.message || 'Failed to switch organization');
                return;
            }

            setActiveOrgId(orgId);
        } catch {
            setError('An error occurred');
        } finally {
            setSwitching(null);
        }
    };

    if (loading) {
        return (
            <AppShell>
                <PageHeader title="Organizations" />
                <Card padding="lg">
                    <SkeletonLoader height="3rem" />
                    <div className="mt-4">
                        <SkeletonLoader height="3rem" />
                    </div>
                </Card>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <PageHeader
                title="Organizations"
                description="Switch between your organizations"
            />

            {error && (
                <div className="mb-4 rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                    {error}
                </div>
            )}

            <Card padding="lg">
                <div className="flex flex-col gap-2">
                    {orgs.map((org) => (
                        <div
                            key={org.orgId}
                            className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors ${org.orgId === activeOrgId
                                ? 'border-success/40 bg-success/5'
                                : 'border-border/60 bg-card hover:bg-muted/50'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="font-medium text-foreground">
                                    {org.orgName}
                                </span>
                                <Badge
                                    variant={
                                        org.role === 'admin'
                                            ? 'info'
                                            : org.role === 'developer'
                                                ? 'warning'
                                                : 'neutral'
                                    }
                                >
                                    {org.role}
                                </Badge>
                            </div>

                            {org.orgId === activeOrgId ? (
                                <Badge variant="success">Active</Badge>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSwitch(org.orgId)}
                                    disabled={switching !== null}
                                >
                                    {switching === org.orgId ? 'Switching...' : 'Switch'}
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            <div className="mt-8">
                <LinkButton href="/dashboard" variant="ghost" className="pl-0">
                    ← Back to Dashboard
                </LinkButton>
            </div>
        </AppShell>
    );
}
