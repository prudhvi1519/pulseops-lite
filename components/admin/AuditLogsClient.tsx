'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

// Helpers (Card parts if not exported)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CardHeader = ({ children, className = '' }: any) => <div className={`p-6 pb-0 ${className}`}>{children}</div>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CardTitle = ({ children, className = '' }: any) => <h3 className={`font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CardContent = ({ children, className = '' }: any) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;

interface AuditLog {
    id: string;
    orgId: string;
    actorUserId: string | null;
    action: string;
    targetType: string;
    targetId: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    meta: any;
    createdAt: string;
}

interface AuditLogsClientProps {
    initialLogs?: AuditLog[];
}

export function AuditLogsClient({ initialLogs }: AuditLogsClientProps) {
    const [logs, setLogs] = useState<AuditLog[]>(initialLogs || []);
    const [loading, setLoading] = useState(!initialLogs);
    const [error, setError] = useState<string | null>(null);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [filterAction, setFilterAction] = useState('');

    // Fetch Data
    const fetchLogs = async (cursor?: string | null, isNewFilter = false) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (filterAction) params.set('action', filterAction);
            if (cursor) params.set('cursor', cursor);

            const res = await fetch(`/api/audit/query?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch audit logs');

            const json = await res.json();

            if (isNewFilter || !cursor) {
                setLogs(json.data);
            } else {
                setLogs(prev => [...prev, ...json.data]);
            }
            setNextCursor(json.meta.nextCursor);
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Initial Load
    useEffect(() => {
        if (!initialLogs) {
            fetchLogs();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Filter Handler
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchLogs(null, true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>System Activity</CardTitle>
                    <form onSubmit={handleFilterSubmit} className="flex gap-2 mt-4">
                        <Input
                            placeholder="Filter by action (e.g. incident.status_updated)"
                            value={filterAction}
                            onChange={(e: any) => setFilterAction(e.target.value)} // eslint-disable-line @typescript-eslint/no-explicit-any
                            className="max-w-sm"
                        />
                        <Button type="submit" variant="secondary">Filter</Button>
                    </form>
                </CardHeader>
                <CardContent className="mt-4">
                    {error && <Alert variant="destructive" className="mb-4"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

                    {loading && logs.length === 0 ? (
                        <div className="space-y-2">
                            <SkeletonLoader height="40px" />
                            <SkeletonLoader height="40px" />
                            <SkeletonLoader height="40px" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 border rounded-md border-dashed text-muted-foreground">
                            No audit logs found.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground font-medium">
                                    <tr className="border-b">
                                        <th className="p-3">Timestamp</th>
                                        <th className="p-3">Action</th>
                                        <th className="p-3">Actor</th>
                                        <th className="p-3">Target</th>
                                        <th className="p-3">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {logs.map(log => (
                                        <tr key={log.id} className="hover:bg-muted/50">
                                            <td className="p-3 text-muted-foreground whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="p-3 font-medium">
                                                <Badge variant="neutral">{log.action}</Badge>
                                            </td>
                                            <td className="p-3 font-mono text-xs">
                                                {log.actorUserId || 'System'}
                                            </td>
                                            <td className="p-3">
                                                <span className="text-muted-foreground mr-1">{log.targetType}:</span>
                                                <span className="font-mono text-xs">{log.targetId}</span>
                                            </td>
                                            <td className="p-3">
                                                {log.meta ? (
                                                    <details className="cursor-pointer">
                                                        <summary className="text-xs text-muted-foreground hover:text-foreground">View JSON</summary>
                                                        <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-x-auto max-w-[300px]">
                                                            {JSON.stringify(log.meta, null, 2)}
                                                        </pre>
                                                    </details>
                                                ) : <span className="text-muted-foreground text-xs">-</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {nextCursor && (
                        <div className="flex justify-center mt-4">
                            <Button variant="outline" onClick={() => fetchLogs(nextCursor)} disabled={loading}>
                                {loading ? 'Loading...' : 'Load More'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
