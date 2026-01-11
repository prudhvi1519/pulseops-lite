import React from 'react';
import { sql } from '@/lib/db';
import { requireOrgRole } from '@/lib/auth/rbac';
import { IncidentsClient } from '@/components/incidents/IncidentsClient';
import { PageHeader } from '@/components/ui/PageHeader';

export const dynamic = 'force-dynamic';

import { AppShell } from '@/components/AppShell';

export default async function IncidentsPage() {
    // 1. Auth & Scoping
    const { orgId } = await requireOrgRole('viewer');

    // 2. Fetch Services & Envs for Filter (only for this org)
    // Reuse logic from deployments page for consistency
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
    const servicesMap = new Map<string, { service_id: string; service_name: string; children: { env_id: string; env_name: string }[] }>();

    result.rows.forEach(row => {
        if (!servicesMap.has(row.service_id)) {
            servicesMap.set(row.service_id, {
                service_id: row.service_id,
                service_name: row.service_name,
                children: []
            });
        }
        if (row.env_id) {
            servicesMap.get(row.service_id)!.children.push({
                env_id: row.env_id,
                env_name: row.env_name
            });
        }
    });

    const services = Array.from(servicesMap.values());

    return (
        <AppShell>
            <PageHeader
                title="Incidents"
                description="Monitor and manage system outages and alerts."
            />
            <IncidentsClient services={services} />
        </AppShell>
    );
}
