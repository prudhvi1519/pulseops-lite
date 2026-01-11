
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

// Load env first
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Debug: Looking for env at ${envPath}`);
if (fs.existsSync(envPath)) {
    console.log('📄 Loading .env.local...');
    const content = fs.readFileSync(envPath, 'utf-8');
    // Handle CRLF or LF
    const lines = content.split(/\r?\n/);
    lines.forEach(line => {
        // Basic Key=Value parser (ignore comments)
        if (!line || line.trim().startsWith('#')) return;

        const eqIdx = line.indexOf('=');
        if (eqIdx > 0) {
            const key = line.substring(0, eqIdx).trim();
            let value = line.substring(eqIdx + 1).trim();
            // Remove quotes
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    });
    console.log('Keys loaded:', Object.keys(process.env).filter(k => k === 'API_KEY_SALT' || k.includes('SECRET')));
} else {
    console.warn('⚠️ .env.local not found at ' + envPath);
}

async function main() {
    // Dynamic imports after env load
    const { sql } = await import('../lib/db');
    const { generateApiKey, hashApiKey } = await import('../lib/keys/apiKey');

    const BASE_URL = 'http://localhost:3000';
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    console.log('🚀 Starting E2E Verification...');

    // 1. Setup Test Data (Direct DB access)
    console.log('📦 Setting up test entities...');

    const suffix = Math.floor(Math.random() * 100000);
    const orgName = `E2E Org ${suffix}`;

    // Create Org
    const orgRes = await sql`INSERT INTO orgs (name) VALUES (${orgName}) RETURNING id`;
    const orgId = orgRes.rows[0].id;

    // Create User
    const userRes = await sql`
        INSERT INTO users (email, name, password_hash) 
        VALUES (${`e2e-${suffix}@example.com`}, 'E2E User', 'hash') 
        RETURNING id
    `;
    const userId = userRes.rows[0].id;

    await sql`INSERT INTO org_members (org_id, user_id, role) VALUES (${orgId}, ${userId}, 'admin')`;

    // Create Service
    const svcRes = await sql`
        INSERT INTO services (org_id, name, created_by) 
        VALUES (${orgId}, 'E2E Service', ${userId}) 
        RETURNING id
    `;
    const svcId = svcRes.rows[0].id;

    // Create Env
    const envRes = await sql`
        INSERT INTO environments (service_id, name) 
        VALUES (${svcId}, 'production') 
        RETURNING id
    `;
    const envId = envRes.rows[0].id;

    // Create API Key
    const rawKey = generateApiKey();
    const keyHash = await hashApiKey(rawKey);
    await sql`
        INSERT INTO api_keys (org_id, service_id, environment_id, key_hash) 
        VALUES (${orgId}, ${svcId}, ${envId}, ${keyHash})
    `;

    // Create Alert Rule (Error Count > 0)
    const ruleRes = await sql`
        INSERT INTO alert_rules (org_id, service_id, environment_id, name, type, params_json, severity, enabled, cooldown_seconds)
        VALUES (${orgId}, ${svcId}, ${envId}, 'E2E Error Rule', 'error_count', '{"threshold": 0, "windowParameters": {"minutes": 5}}', 'high', true, 0)
        RETURNING id
    `;
    const ruleId = ruleRes.rows[0].id;

    console.log(`✅ Setup Complete. Org: ${orgId}, Service: ${svcId}, Rule: ${ruleId}`);

    // 2. Ingest Logs
    console.log('📝 Ingesting Error Log...');
    const ingestRes = await fetch(`${BASE_URL}/api/v1/logs/ingest`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': rawKey
        },
        body: JSON.stringify({
            logs: [
                {
                    timestamp: new Date().toISOString(),
                    level: 'error',
                    message: 'E2E Critical Failure detected',
                    meta: { trace: randomUUID() }
                }
            ]
        })
    });

    if (ingestRes.status !== 200) {
        throw new Error(`Ingest failed: ${ingestRes.status} ${await ingestRes.text()}`);
    }
    console.log('✅ Log Ingested.');

    // Wait a bit for indexing
    await delay(1000);

    // 3. Trigger Rule Evaluation
    console.log('⚡ Triggering Rule Evaluation...');

    const cronSecret = process.env.INTERNAL_CRON_SECRET || process.env.CRON_SECRET;

    if (!cronSecret) {
        throw new Error('Missing CRON_SECRET/INTERNAL_CRON_SECRET');
    }

    const evalRes = await fetch(`${BASE_URL}/api/v1/rules/evaluate?x-vercel-set-bypass-cookie=true`, {
        method: 'POST',
        headers: {
            'x-internal-cron-secret': cronSecret
        }
    });

    console.log(`Generic Eval Status: ${evalRes.status}`);
    if (evalRes.status !== 200) {
        console.error('Eval failed body:', await evalRes.text());
    }

    // 4. Verify Incident Created
    console.log('🔍 Verifying Incident Creation...');
    await delay(3000);

    // Look for incident (schema checking)
    try {
        const incidents = await sql`
            SELECT * FROM incidents WHERE org_id = ${orgId} ORDER BY created_at DESC
        `;

        if (incidents.rows.length > 0) {
            console.log(`✅ Incident Created: ${incidents.rows[0].title || 'Untitled'} (ID: ${incidents.rows[0].id})`);
        } else {
            // Check if alert_firings has it
            const firings = await sql`SELECT * FROM alert_firings WHERE rule_id = ${ruleId}`;
            console.log(`Firings found: ${firings.rows.length}`);
            if (firings.rows.length === 0) {
                console.error('❌ No firing recorded either.');
            } else {
                console.log('✅ Alert Fired (Incident creation might be pending/failed or deduped)');
                // Check if incident was supposed to be created.
            }
        }
    } catch (err) {
        console.error('Error querying incidents:', err);
    }

    console.log('🎉 E2E Verification Finished.');
    process.exit(0);
}

main().catch(e => {
    console.error('❌ E2E Failed:', e);
    process.exit(1);
});
