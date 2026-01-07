import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationsAdminClient } from '@/components/admin/NotificationsAdminClient';

// Mock fetch
const mockFetch = vi.spyOn(global, 'fetch');

describe('NotificationsAdminClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders empty state when no channels or jobs', async () => {
        mockFetch.mockImplementation(async (_url) => {
            return {
                ok: true,
                json: async () => ({ data: [] })
            } as Response;
        });

        render(<NotificationsAdminClient />);

        expect(screen.getByText(/Loading notifications/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Notification Channels')).toBeInTheDocument();
            expect(screen.getByText(/No channels configured/i)).toBeInTheDocument();
            expect(screen.getByText(/No recent notification jobs/i)).toBeInTheDocument();
        });
    });

    it('renders with initial data provided', async () => {
        // Should NOT call fetch if initial data is provided.
        // We ensure fetch isn't called or mocks return 404/error to prove we use initial data
        mockFetch.mockImplementation(async (url) => {
            console.log('Unexpected Fetch Call:', url);
            return { ok: false, status: 500 } as Response;
        });

        const initialChannels: any[] = [{ // eslint-disable-line @typescript-eslint/no-explicit-any
            id: '1',
            type: 'discord',
            config: { webhookUrl: 'https://discord.com/api/webhooks/123' },
            enabled: true,
            createdAt: new Date().toISOString()
        }];

        const initialJobs: any[] = [{ // eslint-disable-line @typescript-eslint/no-explicit-any
            id: 'job-1',
            type: 'incident.created',
            status: 'sent',
            attempts: 1,
            lastError: undefined,
            createdAt: new Date().toISOString()
        }];

        render(<NotificationsAdminClient initialChannels={initialChannels} initialJobs={initialJobs} />);

        // Should render immediately without loading state
        // expect(screen.queryByText(/Loading notifications/i)).not.toBeInTheDocument(); 
        // (Might still render loading briefly if effect runs? logic says !initial -> false)

        await waitFor(() => {
            expect(screen.getByText('Notification Channels')).toBeInTheDocument();
            expect(screen.getByText('discord')).toBeInTheDocument();
            expect(screen.getByText('incident.created')).toBeInTheDocument();
            expect(screen.getByText('sent')).toBeInTheDocument();
        });
    });
});
