import { NextRequest, NextResponse } from 'next/server';
import { getMe } from '@/lib/auth';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const me = await getMe(req);
        if (!me || me.role !== 'admin') { // Strict Admin check
            // Note: In a real multi-tenant app, we might check if they are 'admin' of the active org.
            // Here, assuming role is global or per-org. 
            // If role is per-org ('admin' in 'activeOrg'), fine.
            // If getMe returns the role in the ACTIVE org, this is correct.
            if (me.role !== 'admin') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }
        }

        // Fetch last 50 runs
        const runs = await sql`
            SELECT id, name, status, started_at, finished_at, meta_json
            FROM cron_runs
            ORDER BY started_at DESC
            LIMIT 50
        `;

        // Calculate summary (latest per job)
        // Distinct on name
        const summary = await sql`
            SELECT DISTINCT ON (name) name, status, started_at, finished_at, meta_json
            FROM cron_runs
            ORDER BY name, started_at DESC
        `;

        return NextResponse.json({
            runs: runs.rows,
            summary: summary.rows
        });

    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
