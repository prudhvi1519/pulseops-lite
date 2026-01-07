'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

interface Incident {
    id: string;
    title: string;
    status: string;
    severity: string;
    serviceName: string;
    environmentName: string;
    createdAt: string;
}

interface Service {
    service_id: string;
    service_name: string;
    children: { env_id: string; env_name: string }[];
}

export function IncidentsClient({ services }: { services: Service[] }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);

    // Filters from URL
    const serviceId = searchParams.get('serviceId') || '';
    const environmentId = searchParams.get('environmentId') || '';
    const status = searchParams.get('status') || '';
    const severity = searchParams.get('severity') || '';

    const fetchIncidents = useCallback(async (isLoadMore = false, cursor?: string) => {
        if (!isLoadMore) setLoading(true);
        else setLoadingMore(true);

        const params = new URLSearchParams(searchParams);
        if (cursor) params.set('cursor', cursor);

        // Use window.location.origin for absolute URL (avoids JSDOM relative URL error)
        const url = new URL('/api/incidents/query', window.location.origin);
        url.search = params.toString();

        try {
            const res = await fetch(url.toString());
            if (!res.ok) throw new Error('Failed to fetch');
            const json = await res.json();

            if (isLoadMore) {
                setIncidents(prev => [...prev, ...json.data]);
            } else {
                setIncidents(json.data);
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
        fetchIncidents();
    }, [fetchIncidents]);

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value) params.set(key, value);
        else params.delete(key);

        if (key === 'serviceId') params.delete('environmentId');

        router.replace(`${pathname}?${params.toString()}`);
    };

    const getSeverityColor = (sev: string) => {
        switch (sev) {
            case 'high': return 'error';
            case 'med': return 'warning'; // Assuming Badge supports warning, else info
            case 'low': return 'info';
            default: return 'neutral';
        }
    };

    const getStatusColor = (st: string) => {
        switch (st) {
            case 'resolved': return 'success';
            case 'investigating': return 'warning';
            case 'open': return 'error';
            default: return 'neutral';
        }
    };

    // Derived environments for dropdown
    const selectedService = services.find(s => s.service_id === serviceId);
    const environments = selectedService ? selectedService.children : [];

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--spacing-lg)' }}>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
                <select
                    value={serviceId}
                    onChange={(e) => updateFilter('serviceId', e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                >
                    <option value="">All Services</option>
                    {services.map(s => <option key={s.service_id} value={s.service_id}>{s.service_name}</option>)}
                </select>

                <select
                    value={environmentId}
                    onChange={(e) => updateFilter('environmentId', e.target.value)}
                    disabled={!serviceId}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                >
                    <option value="">All Environments</option>
                    {environments.map(e => <option key={e.env_id} value={e.env_id}>{e.env_name}</option>)}
                </select>

                <select
                    value={status}
                    onChange={(e) => updateFilter('status', e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                >
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                </select>

                <select
                    value={severity}
                    onChange={(e) => updateFilter('severity', e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                >
                    <option value="">All Severities</option>
                    <option value="high">High</option>
                    <option value="med">Medium</option>
                    <option value="low">Low</option>
                </select>
            </div>

            {/* List */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <SkeletonLoader />
                    <SkeletonLoader />
                    <SkeletonLoader />
                </div>
            ) : incidents.length === 0 ? (
                <EmptyState
                    title="No Incidents Found"
                    description="When alert rules trigger, incidents will appear here."
                    action={
                        <button
                            onClick={() => router.push('/alerts')} // Future: Alerts UI
                            style={{
                                padding: '8px 16px',
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Configure Alerts
                        </button>
                    }
                />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {incidents.map((incident) => (
                        <Card
                            key={incident.id}
                            style={{ cursor: 'pointer' }}
                            onClick={() => router.push(`/incidents/${incident.id}`)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <h3 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 600 }}>{incident.title}</h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Badge variant={getSeverityColor(incident.severity) as any}>{incident.severity}</Badge> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                                    <Badge variant={getStatusColor(incident.status) as any}>{incident.status}</Badge> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                                <span>{incident.serviceName} / {incident.environmentName}</span>
                                <span>{new Date(incident.createdAt).toLocaleString()}</span>
                            </div>
                        </Card>
                    ))}

                    {nextCursor && (
                        <button
                            onClick={() => fetchIncidents(true, nextCursor)}
                            disabled={loadingMore}
                            style={{
                                padding: '12px',
                                marginTop: 'var(--spacing-lg)',
                                backgroundColor: 'transparent',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                width: '100%',
                                color: 'var(--color-text-primary)'
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
