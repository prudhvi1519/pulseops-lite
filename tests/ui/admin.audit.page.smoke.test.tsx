import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { AuditLogsClient } from '@/components/admin/AuditLogsClient';

// Mock fetch
const mockFetch = vi.spyOn(global, 'fetch');

describe('AuditLogsClient Smoke Test', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders empty state initially', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: [], meta: { nextCursor: null } }),
        } as Response);

        render(<AuditLogsClient />);

        // Should show title
        expect(screen.getByText('Audit Logs')).toBeDefined();
        // Should show empty state eventually (or loading)
        // Since we didn't await, it might show "Loading..."
        expect(screen.getByText(/Loading/i)).toBeDefined();
    });

    it('renders with initial data provided', () => {
        const mockLogs = [
            {
                id: '1',
                orgId: 'org1',
                actorUserId: 'user1',
                action: 'test.action',
                targetType: 'test',
                targetId: 't1',
                meta: { key: 'val' },
                createdAt: new Date().toISOString()
            }
        ];

        render(<AuditLogsClient initialLogs={mockLogs} />);

        // Should NOT show loading
        expect(screen.queryByText(/Loading/i)).toBeNull();

        // Should show action badge
        expect(screen.getByText('test.action')).toBeDefined();
        // Should show actor
        expect(screen.getByText('user1')).toBeDefined();
    });
});
