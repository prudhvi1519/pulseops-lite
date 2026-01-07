import { requireOrgRole } from '@/lib/auth/rbac';
import { sql } from '@/lib/db';
import { DeploymentsClient } from '@/components/deployments/DeploymentsClient';
import { PageHeader } from '@/components/ui/PageHeader';

export const dynamic = 'force-dynamic';

export default async function DeploymentsPage() {
    // 1. Auth & Scoping
    const { orgId } = await requireOrgRole('viewer');

    // 2. Fetch Services & Envs for Filter (only for this org)
    // We aggregate environments into services
    const result = await sql`
        SELECT 
            s.id as service_id, s.name as service_name,
            e.id as env_id, e.name as env_name
        FROM services s
        LEFT JOIN environments e ON e.service_id = s.id
        WHERE s.org_id = ${orgId}
        ORDER BY s.name ASC, e.name ASC
    `;

    // Transform to nested structure
    const serviceMap = new Map<string, { id: string; name: string; environments: { id: string; name: string }[] }>();

    for (const row of result.rows) {
        if (!serviceMap.has(row.service_id)) {
            serviceMap.set(row.service_id, {
                id: row.service_id,
                name: row.service_name,
                environments: []
            });
        }
        if (row.env_id) {
            serviceMap.get(row.service_id)!.environments.push({
                id: row.env_id,
                name: row.env_name
            });
        }
    }

    const services = Array.from(serviceMap.values());

    return (
        <div>
            <PageHeader
                title="Deployments"
                description="Track deployment history across all services and environments."
            />
            <DeploymentsClient services={services} />
        </div>
    );
}
