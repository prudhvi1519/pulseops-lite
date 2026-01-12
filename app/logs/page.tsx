import { requireOrgRole } from '@/lib/auth/rbac';
import { sql } from '@/lib/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { LogsExplorerClient } from '@/components/logs/LogsExplorerClient';

export const dynamic = 'force-dynamic';

import { AppShell } from '@/components/AppShell';

export default async function LogsPage() {
    // 1. Auth check
    const { orgId } = await requireOrgRole('viewer');

    // 2. Fetch Services + Envs
    const result = await sql`
        SELECT 
            s.id, 
            s.name,
            COALESCE(
                json_agg(
                    json_build_object('id', e.id, 'name', e.name)
                ) FILTER (WHERE e.id IS NOT NULL),
                '[]'
            ) as environments
        FROM services s
        LEFT JOIN environments e ON e.service_id = s.id
        WHERE s.org_id = ${orgId}
        GROUP BY s.id
        ORDER BY s.name ASC
    `;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const services = result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        environments: row.environments,
    }));

    return (
        <AppShell>
            <div className="space-y-6">
                <PageHeader
                    title="Logs Explorer"
                    description="Search and analyze application logs."
                />
                <LogsExplorerClient services={services} />
            </div>
        </AppShell>
    );
}
