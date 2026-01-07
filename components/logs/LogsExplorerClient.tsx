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
            <div style={{ padding: 'var(--spacing-2xl)' }}>
                <EmptyState
                    title="No Services Found"
                    description="You need to create a service before you can ingest logs."
                    action={
                        <Link
                            href="/services"
                            style={{
                                display: 'inline-block',
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                backgroundColor: 'var(--color-primary)',
                                color: 'var(--color-on-primary)',
                                borderRadius: 'var(--radius-md)',
                                textDecoration: 'none',
                                fontWeight: 500
                            }}
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
                <div style={{
                    padding: 'var(--spacing-md)',
                    color: 'var(--color-danger)',
                    backgroundColor: 'rgba(255, 0, 0, 0.05)',
                    borderBottom: '1px solid var(--color-danger)'
                }}>
                    {error}
                </div>
            )}

            {/* List */}
            {logs.length > 0 ? (
                <>
                    <LogsTable logs={logs} onLogSelect={setSelectedLog} />

                    {/* Load More / Loading indicator */}
                    <div style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                        {loading ? (
                            <SkeletonLoader height="40px" />
                        ) : nextCursor ? (
                            <button
                                onClick={handleLoadMore}
                                style={{
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    backgroundColor: 'var(--color-surface-hover)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    fontSize: 'var(--text-sm)'
                                }}
                            >
                                Load More
                            </button>
                        ) : (
                            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                                End of logs
                            </div>
                        )}
                    </div>
                </>
            ) : (
                // Empty Logs or Initial Loading
                <div style={{ padding: 'var(--spacing-2xl)' }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
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
                                    <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
                                        <p style={{ marginBottom: 'var(--spacing-sm)', fontSize: 'var(--text-sm)' }}>
                                            Use your API Key to ingest logs:
                                        </p>
                                        <CodeBlock
                                            code={`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : ''}/api/v1/logs/ingest \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"logs": [{"level": "info", "message": "Hello World", "timestamp": "${new Date().toISOString()}"}]}'`}
                                            language="bash"
                                        />
                                        <div style={{ marginTop: 'var(--spacing-md)', textAlign: 'center' }}>
                                            <Link href="/services" style={{ color: 'var(--color-primary)', fontSize: 'var(--text-sm)' }}>
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
