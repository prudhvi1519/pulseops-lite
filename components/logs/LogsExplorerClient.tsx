'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LogRow } from '@/lib/logs/types';
import { FilterBar } from './FilterBar';
import { LogsTable } from './LogsTable';
import { LogDrawer } from './LogDrawer';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { CodeBlock } from '@/components/ui/CodeBlock';

interface Service {
    id: string;
    name: string;
    environments: { id: string; name: string }[];
}

interface LogsExplorerClientProps {
    services: Service[];
}

export function LogsExplorerClient({ services }: LogsExplorerClientProps) {
    const searchParams = useSearchParams();

    const [logs, setLogs] = useState<LogRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<LogRow | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch logs helper
    const fetchLogs = useCallback(async (params: URLSearchParams, append: boolean = false) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/logs/query?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch logs');

            const json = await res.json();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const newLogs = json.data.map((l: any) => ({
                ...l,
                ts: new Date(l.ts)
            }));
            const newCursor = json.meta.nextCursor;

            setLogs(prev => append ? [...prev, ...newLogs] : newLogs);
            setNextCursor(newCursor);
        } catch (err) {
            console.error(err);
            setError('Failed to load logs. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Effect: Filter changes (URL changes)
    useEffect(() => {
        // When URL params change, we treat it as a fresh fetch (Page 1)
        const params = new URLSearchParams(searchParams);
        // Ensure we don't carry over cursor if it somehow got in URL
        params.delete('cursor');

        fetchLogs(params, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const handleLoadMore = () => {
        if (!nextCursor) return;
        const params = new URLSearchParams(searchParams);
        params.set('cursor', nextCursor);
        fetchLogs(params, true);
    };

    // Render Logic

    // 1. No Services Existence Check
    if (services.length === 0) {
        return (
            <div className="p-8">
                <EmptyState
                    title="No Services Found"
                    description="You need to create a service before you can ingest logs."
                    action={
                        <Link
                            href="/services"
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            Go to Services
                        </Link>
                    }
                />
            </div>
        );
    }

    // 2. Data or Loading or Empty Logs
    return (
        <div>
            <FilterBar services={services} />

            {error && (
                <div className="mb-4 rounded-md bg-destructive/10 p-4 text-sm text-destructive border-b border-destructive/20">
                    {error}
                </div>
            )}

            {/* List */}
            {logs.length > 0 ? (
                <>
                    <LogsTable logs={logs} onLogSelect={setSelectedLog} />

                    {/* Load More / Loading indicator */}
                    <div className="p-4 text-center">
                        {loading ? (
                            <SkeletonLoader height="40px" />
                        ) : nextCursor ? (
                            <button
                                onClick={handleLoadMore}
                                className="inline-flex items-center justify-center rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80"
                            >
                                Load More
                            </button>
                        ) : (
                            <div className="text-sm text-muted-foreground">
                                End of logs
                            </div>
                        )}
                    </div>
                </>
            ) : (
                // Empty Logs or Initial Loading
                <div className="p-8">
                    {loading ? (
                        <div className="flex flex-col gap-4">
                            <SkeletonLoader height="40px" />
                            <SkeletonLoader height="40px" />
                            <SkeletonLoader height="40px" />
                        </div>
                    ) : (
                        <EmptyState
                            title="No logs found"
                            description={
                                Array.from(searchParams.keys()).length > 0
                                    ? "Try adjusting your filters."
                                    : "Send your first log to see it here."
                            }
                            action={
                                Array.from(searchParams.keys()).length === 0 ? (
                                    <div className="mx-auto max-w-lg text-left">
                                        <p className="mb-2 text-sm text-foreground">
                                            Use your API Key to ingest logs:
                                        </p>
                                        <CodeBlock
                                            code={`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : ''}/api/v1/logs/ingest \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"logs": [{"level": "info", "message": "Hello World", "timestamp": "${new Date().toISOString()}"}]}'`}
                                            language="bash"
                                        />
                                        <div className="mt-4 text-center">
                                            <Link href="/services" className="text-sm text-primary hover:underline">
                                                Manage API Keys in Services
                                            </Link>
                                        </div>
                                    </div>
                                ) : undefined
                            }
                        />
                    )}
                </div>
            )}

            {/* Drawer */}
            <LogDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
        </div>
    );
}
