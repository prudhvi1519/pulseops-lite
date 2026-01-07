'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

interface IncidentEvent {
    id: string;
    type: string;
    message: string;
    created_at: string;
    actor_name?: string;
    actor_email?: string;
    meta_json?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface IncidentDetail {
    id: string;
    title: string;
    description?: string;
    status: string;
    severity: string;
    serviceName: string;
    environmentName: string;
    serviceId: string;
    environmentId: string;
    createdAt: string;
    resolvedAt?: string;
    events: IncidentEvent[];
}

export function IncidentDetailClient({ incidentId, isDeveloper }: { incidentId: string, isDeveloper: boolean }) {
    const router = useRouter();
    const [incident, setIncident] = useState<IncidentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');

    const fetchIncident = useCallback(async () => {
        try {
            // Use window.location.origin to support JSDOM
            const url = new URL(`/api/incidents/${incidentId}`, window.location.origin);
            const res = await fetch(url.toString());
            if (!res.ok) throw new Error('Failed to fetch incident');
            const json = await res.json();
            setIncident(json.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load incident');
        } finally {
            setLoading(false);
        }
    }, [incidentId]);

    useEffect(() => {
        fetchIncident();
    }, [fetchIncident]);

    const handleStatusChange = async (newStatus: string) => {
        setUpdating(true);
        try {
            const url = new URL(`/api/incidents/${incidentId}`, window.location.origin);
            const res = await fetch(url.toString(), {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus }),
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) throw new Error('Failed to update');
            await fetchIncident(); // Refresh timeline
        } catch (err) {
            alert('Failed to update status');
            console.error(err);
        } finally {
            setUpdating(false);
        }
    };

    const getLogsLink = (incident: IncidentDetail) => {
        const created = new Date(incident.createdAt);
        const from = new Date(created.getTime() - 15 * 60 * 1000).toISOString();
        const to = new Date(created.getTime() + 15 * 60 * 1000).toISOString();
        const params = new URLSearchParams({
            serviceId: incident.serviceId || '',
            environmentId: incident.environmentId || '',
            from,
            to
        });
        return `/logs?${params.toString()}`;
    };

    if (loading) return <div style={{ padding: 'var(--spacing-lg)' }}><SkeletonLoader /><SkeletonLoader style={{ marginTop: '20px' }} /></div>;
    if (error || !incident) return <div style={{ padding: 'var(--spacing-lg)', color: 'red' }}>{error || 'Incident not found'}</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--spacing-lg)' }}>
            <button
                onClick={() => router.back()}
                style={{ marginBottom: 'var(--spacing-md)', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}
            >
                &larr; Back to Incidents
            </button>

            {/* Header */}
            <div style={{ marginBottom: 'var(--spacing-xl)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: 'var(--text-xl)' }}>{incident.title}</h1>
                        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                            {incident.serviceName} / {incident.environmentName} &bull; {new Date(incident.createdAt).toLocaleString()}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Badge variant={incident.severity === 'high' ? 'error' : (incident.severity === 'med' ? 'warning' as any : 'info')}>{incident.severity}</Badge> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                        <Badge variant={incident.status === 'resolved' ? 'success' : (incident.status === 'investigating' ? 'warning' as any : 'error')}>{incident.status}</Badge> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                    </div>
                </div>
                {incident.description && <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--color-text-primary)' }}>{incident.description}</p>}

                <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', gap: '12px' }}>
                    <a
                        href={getLogsLink(incident)}
                        style={{
                            textDecoration: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-primary)',
                            backgroundColor: 'var(--color-background-secondary)'
                        }}
                    >
                        View Logs Around Time
                    </a>

                    {isDeveloper && incident.status !== 'resolved' && (
                        <button
                            onClick={() => handleStatusChange('resolved')}
                            disabled={updating}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '4px',
                                border: 'none',
                                color: 'white',
                                backgroundColor: 'var(--color-success-emphasis)',
                                cursor: 'pointer'
                            }}
                        >
                            Resolve Incident
                        </button>
                    )}
                    {isDeveloper && incident.status === 'open' && (
                        <button
                            onClick={() => handleStatusChange('investigating')}
                            disabled={updating}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '4px',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-primary)',
                                backgroundColor: 'var(--color-background-tertiary)',
                                cursor: 'pointer'
                            }}
                        >
                            Start Investigation
                        </button>
                    )}
                    {isDeveloper && incident.status === 'resolved' && (
                        <button
                            onClick={() => handleStatusChange('open')}
                            disabled={updating}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '4px',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-primary)',
                                backgroundColor: 'var(--color-background-tertiary)',
                                cursor: 'pointer'
                            }}
                        >
                            Re-open
                        </button>
                    )}
                </div>
            </div>

            {/* Timeline */}
            <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--spacing-md)' }}>Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {incident.events.map((event) => (
                    <div key={event.id} style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ minWidth: '140px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                            {new Date(event.created_at).toLocaleString()}
                        </div>
                        <div style={{ paddingBottom: 'var(--spacing-md)', borderLeft: '2px solid var(--color-border)', paddingLeft: '24px', position: 'relative' }}>
                            <div style={{
                                position: 'absolute', left: '-5px', top: '0',
                                width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-text-secondary)'
                            }} />

                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                {event.type.toUpperCase()}
                                {event.actor_name && <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}> by {event.actor_name}</span>}
                            </div>
                            <div style={{ color: 'var(--color-text-primary)' }}>{event.message}</div>
                            {event.meta_json && (
                                <pre style={{
                                    marginTop: '8px',
                                    padding: '8px',
                                    backgroundColor: 'var(--color-background-secondary)',
                                    borderRadius: '4px',
                                    fontSize: 'var(--text-xs)',
                                    overflowX: 'auto'
                                }}>
                                    {JSON.stringify(event.meta_json, null, 2)}
                                </pre>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
