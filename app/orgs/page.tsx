'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
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
                    <div style={{ marginTop: 'var(--spacing-md)' }}>
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
                <div
                    style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        backgroundColor: 'var(--color-error-bg)',
                        color: 'var(--color-error)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-sm)',
                        marginBottom: 'var(--spacing-md)',
                    }}
                >
                    {error}
                </div>
            )}

            <Card padding="lg">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                    {orgs.map((org) => (
                        <div
                            key={org.orgId}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 'var(--spacing-md)',
                                backgroundColor:
                                    org.orgId === activeOrgId
                                        ? 'var(--color-success-bg)'
                                        : 'var(--color-background)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                <span
                                    style={{
                                        fontWeight: 500,
                                        color: 'var(--color-text-primary)',
                                    }}
                                >
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
                                <button
                                    onClick={() => handleSwitch(org.orgId)}
                                    disabled={switching !== null}
                                    style={{
                                        padding: 'var(--spacing-xs) var(--spacing-md)',
                                        backgroundColor: 'var(--color-surface)',
                                        color: 'var(--color-text-primary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 'var(--text-sm)',
                                        cursor: switching !== null ? 'not-allowed' : 'pointer',
                                        opacity: switching !== null ? 0.7 : 1,
                                    }}
                                >
                                    {switching === org.orgId ? 'Switching...' : 'Switch'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            <div style={{ marginTop: 'var(--spacing-lg)' }}>
                <a
                    href="/dashboard"
                    style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-info)',
                        textDecoration: 'underline',
                    }}
                >
                    ← Back to Dashboard
                </a>
            </div>
        </AppShell>
    );
}
