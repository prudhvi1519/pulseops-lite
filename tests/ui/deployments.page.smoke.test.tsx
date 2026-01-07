import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeploymentsClient } from '@/components/deployments/DeploymentsClient';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams(),
    useRouter: () => ({ replace: vi.fn() }),
    usePathname: () => '/deployments',
}));

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('DeploymentsClient UI', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders "No Deployments" empty state when fetch returns empty', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ data: [], meta: { nextCursor: null } }),
        });

        render(<DeploymentsClient services={[]} />);

        expect(await screen.findByText('No Deployments Found')).toBeTruthy();
        expect(screen.getByText('Learn Integration')).toBeTruthy();
    });

    it('renders Deployments List when fetch returns data', async () => {
        const mockData = [
            {
                id: '1',
                status: 'success',
                serviceName: 'Core API',
                environmentName: 'prod',
                commitSha: 'abcdef1',
                commitMessage: 'fix: critical bug',
                actor: 'dev-user',
                createdAt: new Date().toISOString(),
                url: 'http://github.com/run/1'
            }
        ];

        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ data: mockData, meta: { nextCursor: null } }),
        });

        render(<DeploymentsClient services={[]} />);

        expect(await screen.findByText('Core API')).toBeTruthy();
        expect(screen.getByText('success')).toBeTruthy();
        expect(screen.getByText('fix: critical bug', { exact: false })).toBeTruthy();
    });
});
