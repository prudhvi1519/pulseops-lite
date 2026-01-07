'use client';

import { LogRow } from '@/lib/logs/types';
import { Badge } from '@/components/ui/Badge';

interface LogsTableProps {
    logs: LogRow[];
    onLogSelect: (log: LogRow) => void;
}

const levelVariant: Record<string, 'neutral' | 'success' | 'warning' | 'error' | 'info'> = {
    debug: 'neutral',
    info: 'info',
    warn: 'warning',
    error: 'error',
};

export function LogsTable({ logs, onLogSelect }: LogsTableProps) {
    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 'var(--text-sm)',
                textAlign: 'left'
            }}>
                <thead>
                    <tr style={{
                        borderBottom: '1px solid var(--color-border)',
                        color: 'var(--color-text-muted)'
                    }}>
                        <th style={{ padding: 'var(--spacing-md)', width: '200px' }}>Timestamp</th>
                        <th style={{ padding: 'var(--spacing-md)', width: '100px' }}>Level</th>
                        <th style={{ padding: 'var(--spacing-md)', width: '200px' }}>Service</th>
                        <th style={{ padding: 'var(--spacing-md)' }}>Message</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <tr
                            key={log.id}
                            onClick={() => onLogSelect(log)}
                            style={{
                                borderBottom: '1px solid var(--color-border)',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                            <td style={{ padding: 'var(--spacing-md)', fontFamily: 'var(--font-mono)' }}>
                                {new Date(log.ts).toLocaleString()}
                            </td>
                            <td style={{ padding: 'var(--spacing-md)' }}>
                                <Badge variant={levelVariant[log.level] || 'neutral'}>{log.level}</Badge>
                            </td>
                            <td style={{ padding: 'var(--spacing-md)' }}>
                                <div style={{ fontWeight: 500 }}>{log.serviceName}</div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{log.environmentName}</div>
                            </td>
                            <td style={{ padding: 'var(--spacing-md)' }}>
                                <div style={{
                                    maxWidth: '600px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    fontFamily: 'var(--font-mono)',
                                    color: 'var(--color-text-secondary)'
                                }}>
                                    {log.message}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
