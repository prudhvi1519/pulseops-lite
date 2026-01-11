'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import Link from 'next/link';

interface Deployment {
    id: string;
    serviceName: string;
    environmentName: string;
    status: string;
    createdAt: string;
    commitMessage: string | null;
    commitSha: string | null;
}

export function LatestDeployments() {
    const [deployments, setDeployments] = useState<Deployment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/deployments/query?limit=5')
            .then(res => res.json())
            .then(data => {
                if (data.data) setDeployments(data.data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const getStatusVariant = (status: string): 'success' | 'error' | 'info' | 'neutral' => {
        switch (status) {
            case 'success': return 'success';
            case 'failure': return 'error';
            case 'in_progress':
            case 'queued': return 'info';
            default: return 'neutral';
        }
    };

    if (loading) return <Card padding="lg"><SkeletonLoader /></Card>;

    if (deployments.length === 0) {
        return (
            <Card padding="lg">
                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                    No recent deployments
                </div>
            </Card>
        );
    }

    return (
        <Card padding="lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 500 }}>Latest Deployments</h3>
                <Link href="/deployments" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}>View All</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {deployments.map(d => (
                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-xs) 0', borderBottom: '1px solid var(--color-border)' }}>
                        <div>
                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                                {d.serviceName} <span style={{ color: 'var(--color-text-muted)' }}>/ {d.environmentName}</span>
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                                {d.commitMessage || 'No message'} ({d.commitSha?.slice(0, 7)})
                            </div>
                        </div>
                        <Badge variant={getStatusVariant(d.status)}>{d.status}</Badge>
                    </div>
                ))}
            </div>
        </Card>
    );
}
