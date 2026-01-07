import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/health/route';
import { NextRequest } from 'next/server';

describe('/api/health', () => {
    it('returns status 200 with { data: { ok: true } }', async () => {
        const request = new NextRequest('http://localhost:3000/api/health');
        const response = await GET(request);

        expect(response.status).toBe(200);

        const body = await response.json();
        expect(body).toEqual({ data: { ok: true } });
    });

    it('includes x-correlation-id header in response', async () => {
        const request = new NextRequest('http://localhost:3000/api/health');
        const response = await GET(request);

        const correlationId = response.headers.get('x-correlation-id');
        expect(correlationId).toBeTruthy();
        expect(typeof correlationId).toBe('string');
    });

    it('echoes provided x-correlation-id header', async () => {
        const testCorrelationId = 'test-correlation-id-12345';
        const request = new NextRequest('http://localhost:3000/api/health', {
            headers: { 'x-correlation-id': testCorrelationId },
        });
        const response = await GET(request);

        const correlationId = response.headers.get('x-correlation-id');
        expect(correlationId).toBe(testCorrelationId);
    });
});
