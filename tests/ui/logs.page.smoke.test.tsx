import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LogsExplorerClient } from '@/components/logs/LogsExplorerClient';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams(),
    useRouter: () => ({ replace: vi.fn() }),
    usePathname: () => '/logs',
}));

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('LogsExplorerClient UI', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders "No Services" empty state when no services provided', () => {
        render(<LogsExplorerClient services={[]} />);
        expect(screen.getByText('No Services Found')).toBeTruthy();
    });

    it('renders "No Logs" empty state (Ingest CTA) when services exist but fetch returns empty', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ data: [], meta: { nextCursor: null } }),
        });

        const services = [{ id: 's1', name: 'Svc A', environments: [] }];
        render(<LogsExplorerClient services={services} />);

        // Use findByText to wait for async update
        expect(await screen.findByText('No logs found')).toBeTruthy();
        expect(screen.getByText('Use your API Key to ingest logs:')).toBeTruthy();
    });

    it('renders Logs Table when fetch returns logs', async () => {
        const mockLogs = [
            {
                id: '1',
                ts: new Date().toISOString(),
                level: 'info',
                serviceName: 'Svc A',
                environmentName: 'prod',
                message: 'Test Log Message',
                metaJson: {}
            }
        ];

        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ data: mockLogs, meta: { nextCursor: 'abc' } }),
        });

        const services = [{ id: 's1', name: 'Svc A', environments: [] }];
        render(<LogsExplorerClient services={services} />);

        // Wait for table content
        // 'Svc A' is in the Service column.
        expect(await screen.findByText('Svc A', {}, { timeout: 3000 })).toBeTruthy();
        // Load More should be visible
        expect(screen.getByText('Load More')).toBeTruthy();
    });
});
