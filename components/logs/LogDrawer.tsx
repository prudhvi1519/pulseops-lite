'use client';

import { Badge } from '@/components/ui/Badge';
import { LogRow } from '@/lib/logs/types';

interface LogDrawerProps {
    log: LogRow | null;
    onClose: () => void;
}

const levelVariant: Record<string, 'neutral' | 'success' | 'warning' | 'error' | 'info'> = {
    debug: 'neutral',
    info: 'info',
    warn: 'warning',
    error: 'error',
};

export function LogDrawer({ log, onClose }: LogDrawerProps) {
    if (!log) return null;

    const handleCopy = () => {
        const text = JSON.stringify(
            {
                id: log.id,
                timestamp: log.ts,
                level: log.level,
                message: log.message,
                service: log.serviceName,
                environment: log.environmentName,
                traceId: log.traceId,
                requestId: log.requestId,
                meta: log.metaJson,
            },
            null,
            2
        );
        navigator.clipboard.writeText(text);
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '480px',
                maxWidth: '100vw',
                backgroundColor: 'var(--color-surface)',
                borderLeft: '1px solid var(--color-border)',
                boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--spacing-md)',
                    borderBottom: '1px solid var(--color-border)',
                }}
            >
                <h3 style={{ margin: 0, fontWeight: 500, fontSize: 'var(--text-base)' }}>Log Details</h3>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: 'var(--text-lg)',
                        cursor: 'pointer',
                        color: 'var(--color-text-muted)',
                    }}
                >
                    ×
                </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {/* Timestamp */}
                    <div>
                        <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block', marginBottom: 'var(--spacing-xs)' }}>
                            Timestamp
                        </label>
                        <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
                            {new Date(log.ts).toISOString()}
                        </code>
                    </div>

                    {/* Level */}
                    <div>
                        <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block', marginBottom: 'var(--spacing-xs)' }}>
                            Level
                        </label>
                        <Badge variant={levelVariant[log.level] || 'neutral'}>{log.level}</Badge>
                    </div>

                    {/* Service / Env */}
                    <div>
                        <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block', marginBottom: 'var(--spacing-xs)' }}>
                            Service / Environment
                        </label>
                        <span style={{ fontSize: 'var(--text-sm)' }}>
                            {log.serviceName} / {log.environmentName}
                        </span>
                    </div>

                    {/* Message */}
                    <div>
                        <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block', marginBottom: 'var(--spacing-xs)' }}>
                            Message
                        </label>
                        <div
                            style={{
                                padding: 'var(--spacing-sm)',
                                backgroundColor: 'var(--color-background)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: 'var(--text-sm)',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                            }}
                        >
                            {log.message}
                        </div>
                    </div>

                    {/* Trace/Request IDs */}
                    {(log.traceId || log.requestId) && (
                        <div>
                            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block', marginBottom: 'var(--spacing-xs)' }}>
                                IDs
                            </label>
                            <div style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}>
                                {log.traceId && <div>trace_id: {log.traceId}</div>}
                                {log.requestId && <div>request_id: {log.requestId}</div>}
                            </div>
                        </div>
                    )}

                    {/* Meta JSON */}
                    {log.metaJson && Object.keys(log.metaJson as Record<string, unknown>).length > 0 && (
                        <div>
                            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block', marginBottom: 'var(--spacing-xs)' }}>
                                Metadata
                            </label>
                            <pre
                                style={{
                                    padding: 'var(--spacing-sm)',
                                    backgroundColor: 'var(--color-background)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: 'var(--text-xs)',
                                    fontFamily: 'var(--font-mono)',
                                    overflow: 'auto',
                                    maxHeight: '300px',
                                    margin: 0,
                                }}
                            >
                                {JSON.stringify(log.metaJson, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div
                style={{
                    padding: 'var(--spacing-md)',
                    borderTop: '1px solid var(--color-border)',
                }}
            >
                <button
                    onClick={handleCopy}
                    style={{
                        width: '100%',
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        backgroundColor: 'var(--color-text-primary)',
                        color: 'var(--color-surface)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-sm)',
                        cursor: 'pointer',
                    }}
                >
                    Copy as JSON
                </button>
            </div>
        </div>
    );
}
