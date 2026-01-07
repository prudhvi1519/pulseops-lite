import { sql } from '@/lib/db';

export async function logAuditEvent(
    orgId: string,
    actorUserId: string | null,
    action: string,
    targetType: string,
    targetId: string | null,
    meta: Record<string, any> | null = null // eslint-disable-line @typescript-eslint/no-explicit-any
) {
    try {
        await sql`
            INSERT INTO audit_logs (org_id, actor_user_id, action, target_type, target_id, meta_json)
            VALUES (${orgId}, ${actorUserId}, ${action}, ${targetType}, ${targetId}, ${JSON.stringify(meta)})
        `;
    } catch (err) {
        console.error('[Audit Log Error]', err);
        // We generally don't want to fail the main transaction just because audit log failed, 
        // unless strict compliance is required. For this "Lite" version, logging error is sufficient.
    }
}
