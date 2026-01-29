'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { LinkButton } from '@/components/ui/LinkButton';

interface CronRun {
    id: string;
    name: string;
    status: string;
    started_at: string;
    finished_at: string | null;
    meta_json: unknown;
}

export default function DiagnosticsPage() {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<CronRun[]>([]);
    const [history, setHistory] = useState<CronRun[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/diagnostics')
            .then(async (res) => {
                if (res.status === 403) throw new Error('Unauthorized: Admins only');
                if (!res.ok) throw new Error('Failed to fetch diagnostics');
                return res.json();
            })
            .then((data) => {
                setSummary(data.summary);
                setHistory(data.runs);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <AppShell>
            <PageHeader title="System Diagnostics" />
            <SkeletonLoader height="10rem" />
        </AppShell>
    );

    if (error) return (
        <AppShell>
            <PageHeader title="System Diagnostics" />
            <div className="rounded-md bg-destructive/15 p-4 text-destructive font-medium border border-destructive/20">
                {error}
            </div>
            <div className="mt-4">
                <LinkButton href="/dashboard" variant="ghost">Back to Dashboard</LinkButton>
            </div>
        </AppShell>
    );

    return (
        <AppShell>
            <div className="space-y-8">
                <PageHeader title="System Diagnostics" description="Monitor background jobs and scheduled tasks." />

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">Job Status</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {summary.map((job) => (
                            <Card key={job.name} padding="md" className="border-l-4 border-l-primary/50">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-lg">{job.name}</h3>
                                    <Badge variant={job.status === 'success' ? 'success' : 'error'}>
                                        {job.status}
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <p>Last Run: {new Date(job.started_at).toLocaleString()}</p>
                                    <p>Result: <code className="text-xs bg-muted px-1 rounded">{JSON.stringify(job.meta_json)}</code></p>
                                </div>
                            </Card>
                        ))}
                        {summary.length === 0 && (
                            <div className="col-span-3 text-center p-8 text-muted-foreground bg-muted/30 rounded-lg">
                                No jobs have run yet. Check configured schedules.
                            </div>
                        )}
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">Execution History (Last 50)</h2>
                    <Card padding="none" className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Job Name</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                        <th className="px-4 py-3 font-medium">Started At</th>
                                        <th className="px-4 py-3 font-medium">Duration</th>
                                        <th className="px-4 py-3 font-medium">Meta</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {history.map((run) => (
                                        <tr key={run.id} className="hover:bg-muted/5">
                                            <td className="px-4 py-3 font-medium">{run.name}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={run.status === 'success' ? 'success' : 'error'}>
                                                    {run.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {new Date(run.started_at).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {run.finished_at
                                                    ? `${Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s`
                                                    : '...'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="truncate block max-w-[200px] text-xs font-mono text-muted-foreground" title={JSON.stringify(run.meta_json)}>
                                                    {JSON.stringify(run.meta_json)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </section>
            </div>
        </AppShell>
    );
}
