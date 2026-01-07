import { requireOrgRole } from '@/lib/auth/rbac';
import { IncidentDetailClient } from '@/components/incidents/IncidentDetailClient';

export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function IncidentDetailPage({ params }: Props) {
    // 1. Auth (Viewer needed to see, Dev needed to edit)
    const { user } = await requireOrgRole('viewer');

    // Check if user is developer for UI toggles
    let isDeveloper = false;
    const role = (user as any).role; // eslint-disable-line @typescript-eslint/no-explicit-any
    isDeveloper = ['owner', 'admin', 'developer'].includes(role);

    const { id } = await params;

    return (
        <div>
            {/* No PageHeader here, Client component handles header with proper data */}
            <IncidentDetailClient incidentId={id} isDeveloper={isDeveloper} />
        </div>
    );
}
