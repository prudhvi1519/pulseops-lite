'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/Badge';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

// Helpers (Card parts)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CardHeader = ({ children, className = '' }: any) => <div className={`p-6 pb-0 ${className}`}>{children}</div>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CardTitle = ({ children, className = '' }: any) => <h3 className={`font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CardContent = ({ children, className = '' }: any) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;

interface CronRun {
    name: string;
    status: string;
    startedAt: string;
    finishedAt: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metaJson: any;
}

interface DiagnosticsData {
    cron: CronRun[];
    notifications: { pending: number; failed: number };
    incidents: { open: number };
    timestamp: string;
}

const RUN_NAMES = ['logs.cleanup', 'rules.evaluate', 'notifications.process'];

export function DiagnosticsClient() {
    const [data, setData] = useState<DiagnosticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/diagnostics/summary');
            if (!res.ok) throw new Error('Failed to fetch diagnostics');
            const json = await res.json();
            // Map snake_case from DB to camelCase if needed, OR relies on DB driver.
            // Postgres.js usually returns snake case unless transformed.
            // But our API return logic passes it raw.
            // Let's assume raw snake_case and map it here for safety.

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const safeCron = (json.data.cron || []).map((row: any) => ({
                name: row.name,
                status: row.status,
                startedAt: row.started_at,
                finishedAt: row.finished_at,
                metaJson: row.meta_json
            }));

            setData({
                ...json.data,
                cron: safeCron
            });
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <SkeletonLoader width="200px" height="32px" />
                    <SkeletonLoader width="150px" height="24px" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <SkeletonLoader height="120px" />
                    <SkeletonLoader height="120px" />
                </div>
                <SkeletonLoader width="200px" height="28px" className="mt-8" />
                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                    <SkeletonLoader height="100px" />
                    <SkeletonLoader height="100px" />
                    <SkeletonLoader height="100px" />
                </div>
            </div>
        );
    }
    if (error) return <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">System Diagnostics</h1>
                <Badge variant="neutral">Last Updated: {new Date().toLocaleTimeString()}</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Incidents Card */}
                <Card>
                    <CardHeader><CardTitle>Open Incidents</CardTitle></CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-bold">{data?.incidents?.open || 0}</div>
                    </CardContent>
                </Card>

                {/* Notifications Queue Card */}
                <Card>
                    <CardHeader><CardTitle>Notification Queue</CardTitle></CardHeader>
                    <CardContent className="pt-4 grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Pending</div>
                            <div className="text-2xl font-bold">{data?.notifications?.pending || 0}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Failed (Retryable)</div>
                            <div className="text-2xl font-bold text-red-500">{data?.notifications?.failed || 0}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <h2 className="text-xl font-semibold mt-8">Background Jobs (Cron)</h2>
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                {RUN_NAMES.map(name => {
                    const run = data?.cron?.find(c => c.name === name);
                    return (
                        <Card key={name}>
                            <CardHeader>
                                <CardTitle className="font-mono text-sm">{name}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                                {!run ? (
                                    <div className="text-muted-foreground">No runs recorded.</div>
                                ) : (
                                    <>
                                        <div className="flex justify-between">
                                            <span>Status</span>
                                            <Badge variant={run.status === 'success' ? 'success' : 'error'}>
                                                {run.status}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Last Run</span>
                                            <span className="text-muted-foreground text-xs">{new Date(run.startedAt).toLocaleString()}</span>
                                        </div>
                                        <div className="mt-2 text-xs bg-muted p-2 rounded max-h-[100px] overflow-auto">
                                            <pre>{JSON.stringify(run.metaJson, null, 2)}</pre>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
