'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

interface Service {
    id: string;
    name: string;
    environments: { id: string; name: string }[];
}

interface Deployment {
    id: string;
    orgId: string;
    serviceId: string;
    serviceName: string;
    environmentId: string;
    environmentName: string;
    status: 'queued' | 'in_progress' | 'success' | 'failure' | 'cancelled' | 'timed_out';
    createdAt: string;
    startedAt: string | null;
    finishedAt: string | null;
    commitSha: string | null;
    commitMessage: string | null;
    actor: string | null;
    url: string | null;
}

interface DeploymentsClientProps {
    services: Service[];
}

export function DeploymentsClient({ services }: DeploymentsClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Filters from URL
    const serviceId = searchParams.get('serviceId') || '';
    const environmentId = searchParams.get('environmentId') || '';

    const [deployments, setDeployments] = useState<Deployment[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchDeployments = useCallback(async (isLoadMore = false, cursor?: string) => {
        if (!isLoadMore) setLoading(true);
        else setLoadingMore(true);

        const params = new URLSearchParams(searchParams);
        if (cursor) params.set('cursor', cursor);
        // Ensure limit if needed, or default 30

        try {
            const res = await fetch(`/api/deployments/query?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const json = await res.json();

            if (isLoadMore) {
                setDeployments(prev => [...prev, ...json.data]);
            } else {
                setDeployments(json.data);
            }
            setNextCursor(json.meta.nextCursor);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [searchParams]);

    useEffect(() => {
        // Initial fetch when filters change
        fetchDeployments();
    }, [fetchDeployments]);

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value) params.set(key, value);
        else params.delete(key);

        if (key === 'serviceId') params.delete('environmentId');

        router.replace(`${pathname}?${params.toString()}`);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'success';
            case 'failure':
            case 'cancelled':
            case 'timed_out': return 'error';
            case 'in_progress':
            case 'queued': return 'info'; // or warning
            default: return 'neutral';
        }
    };

    const serviceEnvs = services.find(s => s.id === serviceId)?.environments || [];

    return (
        <div style={{ padding: 'var(--spacing-lg)' }}>
            <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                <select
                    value={serviceId}
                    onChange={(e) => updateFilter('serviceId', e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                >
                    <option value="">All Services</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                <select
                    value={environmentId}
                    onChange={(e) => updateFilter('environmentId', e.target.value)}
                    disabled={!serviceId}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', opacity: !serviceId ? 0.5 : 1 }}
                >
                    <option value="">All Environments</option>
                    {serviceEnvs.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <SkeletonLoader /><SkeletonLoader /><SkeletonLoader />
                </div>
            ) : deployments.length === 0 ? (
                <EmptyState
                    title="No Deployments Found"
                    description="Configure GitHub Webhooks to see deployments here."
                    action={
                        <button
                            onClick={() => window.open('https://docs.github.com/en/webhooks', '_blank')}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Learn Integration
                        </button>
                    }
                />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {deployments.map(d => (
                        <Card key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {d.serviceName}
                                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 'normal' }}>/</span>
                                    {d.environmentName}
                                </div>
                                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                                    {d.commitMessage || 'No commit message'} ({d.commitSha?.substring(0, 7)})
                                    {d.actor && ` by ${d.actor}`}
                                </div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                                    {new Date(d.createdAt).toLocaleString()}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <Badge variant={getStatusColor(d.status) as any}>{d.status}</Badge> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                                {d.url && (
                                    <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: 'var(--text-sm)' }}>
                                        View Run &rarr;
                                    </a>
                                )}
                            </div>
                        </Card>
                    ))}

                    {nextCursor && (
                        <button
                            onClick={() => fetchDeployments(true, nextCursor)}
                            disabled={loadingMore}
                            style={{
                                padding: 'var(--spacing-md)',
                                backgroundColor: 'transparent',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                marginTop: 'var(--spacing-md)'
                            }}
                        >
                            {loadingMore ? 'Loading...' : 'Load More'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
