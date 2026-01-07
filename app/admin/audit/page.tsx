import { requireOrgRole } from '@/lib/auth/rbac';
import { AuditLogsClient } from '@/components/admin/AuditLogsClient';

export default async function AuditLogsPage() {
    await requireOrgRole('admin');

    return <AuditLogsClient />;
}
