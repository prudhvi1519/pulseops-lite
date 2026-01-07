// Smoke Production Check Script

const BASE_URL = process.env.BASE_URL || process.argv[2];
const INTERNAL_CRON_SECRET = process.env.INTERNAL_CRON_SECRET;
const VERCEL_PROTECTION_BYPASS = process.env.VERCEL_PROTECTION_BYPASS;

function withVercelBypass(url: string): string {
    if (!VERCEL_PROTECTION_BYPASS) return url;
    const u = new URL(url);
    u.searchParams.set("x-vercel-set-bypass-cookie", "true");
    u.searchParams.set("x-vercel-protection-bypass", VERCEL_PROTECTION_BYPASS);
    return u.toString();
}

if (!BASE_URL) {
    console.error("Error: BASE_URL env var or argument is required");
    console.log("Usage: BASE_URL=https://myapp.com npx tsx scripts/smoke-prod-check.ts");
    process.exit(1);
}

// Remove trailing slash
const baseUrl = BASE_URL.replace(/\/$/, "");

async function checkHealth() {
    process.stdout.write(`Checking GET ${baseUrl}/api/health ... `);
    try {
        const res = await fetch(withVercelBypass(`${baseUrl}/api/health`));
        if (res.ok) {
            const json = await res.json();
            if (json.data?.ok) {
                console.log("\x1b[32mPASS\x1b[0m");
                return true;
            }
        }
        console.log(`\x1b[31mFAIL\x1b[0m (Status: ${res.status})`);
        console.log(await res.text());
        return false;
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.log(`\x1b[31mFAIL\x1b[0m (${message})`);
        return false;
    }
}

async function triggerCron(name: string, path: string, authHeader: object) {
    process.stdout.write(`Triggering ${name} (${path}) ... `);
    try {
        const res = await fetch(withVercelBypass(`${baseUrl}${path}`), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader
            }
        });

        if (res.ok) {
            console.log("\x1b[32mPASS\x1b[0m");
            return true;
        } else {
            console.log(`\x1b[31mFAIL\x1b[0m (Status: ${res.status})`);
            return false;
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.log(`\x1b[31mFAIL\x1b[0m (${message})`);
        return false;
    }
}

async function run() {
    console.log("\n🧪 Starting Smoke Production Check");
    console.log("====================================");
    console.log(`Target: ${baseUrl}\n`);

    const healthPass = await checkHealth();

    if (!INTERNAL_CRON_SECRET) {
        console.log("\nℹ️  Skipping internal cron checks (INTERNAL_CRON_SECRET not set)");
    } else {
        console.log("\n🔐 Authenticating with INTERNAL_CRON_SECRET...");

        // All cron endpoints now use x-internal-cron-secret header
        await triggerCron('Logs Cleanup', '/api/internal/logs/cleanup', {
            'x-internal-cron-secret': INTERNAL_CRON_SECRET
        });

        await triggerCron('Process Notifications', '/api/v1/notifications/process', {
            'x-internal-cron-secret': INTERNAL_CRON_SECRET
        });

        await triggerCron('Evaluate Rules', '/api/v1/rules/evaluate', {
            'x-internal-cron-secret': INTERNAL_CRON_SECRET
        });
    }

    console.log("\n====================================");
    if (healthPass) {
        console.log("✅ Smoke Check Completed");
        process.exit(0);
    } else {
        console.log("❌ Smoke Check Failed");
        process.exit(1);
    }
}

run();
