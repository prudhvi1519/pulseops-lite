import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { IncidentsClient } from '@/components/incidents/IncidentsClient';
import React from 'react';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    usePathname: () => '/incidents',
    useSearchParams: () => new URLSearchParams(),
}));

// Mock fetch
const mockFetch = vi.spyOn(global, 'fetch');

describe('IncidentsClient', () => {
    beforeEach(() => {
        mockFetch.mockReset();
    });

    it('Renders Empty State when no incidents', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ data: [], meta: {} }),
        } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

        render(<IncidentsClient services={[]} />);

        const skeletons = screen.getAllByTestId('skeleton-loader');
        expect(skeletons.length).toBeGreaterThan(0); // Loading first

        await waitFor(() => {
            expect(screen.getByText('No Incidents Found')).toBeInTheDocument();
        });
    });

    it('Renders Incidents List', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                data: [{
                    id: '1', title: 'DB Down', status: 'open', severity: 'high',
                    serviceName: 'Core', environmentName: 'Prod', createdAt: new Date().toISOString()
                }],
                meta: {}
            }),
        } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

        render(<IncidentsClient services={[]} />);

        await waitFor(() => {
            expect(screen.getByText('DB Down')).toBeInTheDocument();
            expect(screen.getByText('high')).toBeInTheDocument(); // Badge
        });
    });
});
