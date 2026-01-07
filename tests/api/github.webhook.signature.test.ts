import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/v1/github/webhook/route';
import crypto from 'crypto';

describe('GitHub Webhook Signature Verification', () => {
    const SECRET = 'test-secret';
    process.env.GITHUB_WEBHOOK_SECRET = SECRET;

    function createRequest(body: string, sig: string, headers: Record<string, string> = {}) {
        return new NextRequest('http://api/webhook', {
            method: 'POST',
            body: body,
            headers: {
                'X-Hub-Signature-256': sig,
                'X-GitHub-Delivery': 'del-123',
                'X-GitHub-Event': 'ping', // Use 'ping' to bypass workflow logic
                'Content-Type': 'application/json',
                ...headers
            }
        });
    }

    function sign(body: string, secret: string) {
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(body);
        return `sha256=${hmac.digest('hex')}`;
    }

    it('accepts valid signature for exact raw body', async () => {
        const payload = `{"ref": "refs/heads/main"}`;
        const sig = sign(payload, SECRET);

        const req = createRequest(payload, sig);
        const res = await POST(req);

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data.ok).toBe(true);
    });

    it('rejects signature mismatch (tampered body)', async () => {
        const payload = `{"ref": "refs/heads/main"}`;
        const sig = sign(payload, SECRET);

        // Body has extra space
        const tamperedBody = `{"ref": "refs/heads/main"} `;

        const req = createRequest(tamperedBody, sig);
        const res = await POST(req);

        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json.error).toBe('Invalid signature');
    });

    it('rejects signature mismatch (different json format)', async () => {
        // Same data, different string
        const original = `{"a":1}`;
        const different = `{"a": 1}`; // space
        const sig = sign(original, SECRET);

        const req = createRequest(different, sig);
        const res = await POST(req);
        expect(res.status).toBe(401);
    });
});
