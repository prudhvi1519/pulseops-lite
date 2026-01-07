import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { DiagnosticsClient } from '@/components/admin/DiagnosticsClient';

// Mock fetch
const mockFetch = vi.spyOn(global, 'fetch');

describe('DiagnosticsClient Smoke Test', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        // Mock a pending fetch
        mockFetch.mockImplementationOnce(() => new Promise(() => { }));
        render(<DiagnosticsClient />);
        expect(screen.getByText(/Loading diagnostics/i)).toBeDefined();
    });

    it('renders with data', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: {
                    cron: [
                        { name: 'logs.cleanup', status: 'success', started_at: new Date().toISOString(), finished_at: new Date().toISOString(), meta_json: { deleted: 100 } }
                    ],
                    notifications: { pending: 5, failed: 2 },
                    incidents: { open: 3 },
                    timestamp: new Date().toISOString()
                }
            }),
        } as Response);

        // We need to wait for the effect, but testing-library usually waits if we use findBy
        render(<DiagnosticsClient />);

        expect(await screen.findByText('System Diagnostics')).toBeDefined();
        // Check Open Incidents card
        expect(screen.getByText('Open Incidents')).toBeDefined();
        // Check Pending count
        expect(screen.getByText('5')).toBeDefined(); // pending
        // Check Failed count
        expect(screen.getByText('2')).toBeDefined(); // failed
        // Check Cron Job rendering
        expect(screen.getByText('logs.cleanup')).toBeDefined();
    });
});
