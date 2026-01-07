// tests/ui/incident.detail.smoke.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { IncidentDetailClient } from '@/components/incidents/IncidentDetailClient';
import React from 'react';

// Mock Next.js navigation
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ back: mockBack, replace: vi.fn(), push: vi.fn() }),
}));

// Mock fetch
const mockFetch = vi.spyOn(global, 'fetch');

describe('IncidentDetailClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    const mockIncident = {
        id: '123',
        title: 'Api High Latency',
        status: 'open',
        severity: 'high',
        serviceName: 'API',
        environmentName: 'Prod',
        serviceId: 'svc1',
        environmentId: 'env1',
        createdAt: new Date().toISOString(),
        events: [
            { id: 'e1', type: 'created', message: 'Incident created', created_at: new Date().toISOString() }
        ]
    };

    it('Renders Detail info and Timeline', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ data: mockIncident }),
        } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

        render(<IncidentDetailClient incidentId="123" isDeveloper={true} />);

        await waitFor(() => {
            expect(screen.getByText('Api High Latency')).toBeInTheDocument();
            expect(screen.getByText('Incident created')).toBeInTheDocument(); // Timeline
        });
    });

    it('Resolves Logs Deep Link correctness', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ data: mockIncident }),
        } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

        render(<IncidentDetailClient incidentId="123" isDeveloper={true} />);

        await waitFor(() => {
            const link = screen.getByText('View Logs Around Time').closest('a');
            expect(link).toHaveAttribute('href');
            expect(link?.getAttribute('href')).toContain('/logs?serviceId=svc1');
        });
    });

    it('Shows Resolve button for Developer', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ data: mockIncident }),
        } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

        render(<IncidentDetailClient incidentId="123" isDeveloper={true} />);

        const resolveBtn = await screen.findByRole('button', { name: /resolve incident/i }, { timeout: 5000 });
        expect(resolveBtn).toBeInTheDocument();
    });
});
