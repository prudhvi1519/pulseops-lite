import { requireOrgRole } from '@/lib/auth/rbac';
import { DiagnosticsClient } from '@/components/admin/DiagnosticsClient';

export default async function DiagnosticsPage() {
    await requireOrgRole('admin');
    return <DiagnosticsClient />;
}
