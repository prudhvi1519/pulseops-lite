'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
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
                <EmptyState
                    title="No recent deployments"
                    description="Trigger a deployment to see it here."
                    icon={
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v10" />
                            <path d="M12 16h.01" />
                            <path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" />
                        </svg>
                    }
                />
            </Card>
        );
    }

    return (
        <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Latest Deployments</h3>
                <Link href="/deployments" className="text-sm text-primary hover:underline">View All</Link>
            </div>
            <div className="flex flex-col gap-2">
                {deployments.map(d => (
                    <div key={d.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div>
                            <div className="text-sm font-medium">
                                {d.serviceName} <span className="text-muted-foreground">/ {d.environmentName}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
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
