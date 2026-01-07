'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

interface Service {
    id: string;
    name: string;
    environments: { id: string; name: string }[];
}

interface FilterBarProps {
    services: Service[];
}

const TIME_RANGES = [
    { label: 'Last 15m', value: '15m' },
    { label: 'Last 1h', value: '1h' },
    { label: 'Last 6h', value: '6h' },
    { label: 'Last 24h', value: '24h' },
    { label: 'Last 7d', value: '7d' },
];

export function FilterBar({ services }: FilterBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // derived state
    const currentServiceId = searchParams.get('serviceId') || '';
    const currentEnvId = searchParams.get('environmentId') || '';
    const currentLevel = searchParams.get('level') || '';
    const currentQ = searchParams.get('q') || '';
    // We handle time range logic loosely here - just mapping presets for now

    // Get environments for selected service
    const serviceEnvs = useMemo(() => {
        return services.find(s => s.id === currentServiceId)?.environments || [];
    }, [services, currentServiceId]);

    function updateParam(key: string, value: string | null) {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }

        // Reset dependent fields
        if (key === 'serviceId') {
            params.delete('environmentId');
        }

        // Reset pagination when filtering
        params.delete('cursor');

        router.replace(`${pathname}?${params.toString()}`);
    }

    // Handle time range preset
    function setTimeRange(range: string) {
        const params = new URLSearchParams(searchParams);
        const now = new Date();
        const from = new Date();

        // delete explicit to/from first
        params.delete('to');
        params.delete('from');

        switch (range) {
            case '15m': from.setMinutes(now.getMinutes() - 15); break;
            case '1h': from.setHours(now.getHours() - 1); break;
            case '6h': from.setHours(now.getHours() - 6); break;
            case '24h': from.setHours(now.getHours() - 24); break;
            case '7d': from.setDate(now.getDate() - 7); break;
        }

        params.set('from', from.toISOString());
        params.delete('cursor');
        router.replace(`${pathname}?${params.toString()}`);
    }

    return (
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--spacing-md)',
            padding: 'var(--spacing-md)',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)'
        }}>
            {/* Service */}
            <select
                value={currentServiceId}
                onChange={(e) => updateParam('serviceId', e.target.value)}
                style={{
                    padding: 'var(--spacing-sm)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 'var(--text-sm)'
                }}
            >
                <option value="">All Services</option>
                {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>

            {/* Environment */}
            <select
                value={currentEnvId}
                onChange={(e) => updateParam('environmentId', e.target.value)}
                disabled={!currentServiceId}
                style={{
                    padding: 'var(--spacing-sm)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 'var(--text-sm)',
                    opacity: !currentServiceId ? 0.5 : 1
                }}
            >
                <option value="">All Environments</option>
                {serviceEnvs.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                ))}
            </select>

            {/* Level */}
            <select
                value={currentLevel}
                onChange={(e) => updateParam('level', e.target.value)}
                style={{
                    padding: 'var(--spacing-sm)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 'var(--text-sm)'
                }}
            >
                <option value="">All Levels</option>
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warn</option>
                <option value="error">Error</option>
            </select>

            {/* Search */}
            <input
                type="text"
                placeholder="Search logs... (Press Enter)"
                defaultValue={currentQ}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        updateParam('q', (e.target as HTMLInputElement).value);
                    }
                }}
                onBlur={(e) => updateParam('q', e.target.value)}
                style={{
                    padding: 'var(--spacing-sm)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 'var(--text-sm)',
                    flex: 1,
                    minWidth: '200px'
                }}
            />

            {/* Time Presets */}
            <select
                onChange={(e) => setTimeRange(e.target.value)}
                defaultValue="custom"
                style={{
                    padding: 'var(--spacing-sm)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 'var(--text-sm)'
                }}
            >
                <option value="custom" disabled>Time Range</option>
                {TIME_RANGES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                ))}
            </select>
        </div>
    );
}
