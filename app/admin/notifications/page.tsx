import React from 'react';
import { requireOrgRole } from '@/lib/auth/rbac';
import { NotificationsAdminClient } from '@/components/admin/NotificationsAdminClient';

export const dynamic = 'force-dynamic';

export default async function NotificationsAdminPage() {
    // Admin only
    await requireOrgRole('admin');

    return (
        <div className="container mx-auto max-w-5xl py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                <p className="text-muted-foreground mt-2">
                    Configure alert channels and monitor delivery status.
                </p>
            </div>

            <NotificationsAdminClient />
        </div>
    );
}
