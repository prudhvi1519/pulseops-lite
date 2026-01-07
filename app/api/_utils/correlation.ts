/**
 * Correlation ID utilities for request tracing.
 * Reads from incoming x-correlation-id header or generates a new UUID.
 */

const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Get or generate a correlation ID from the incoming request.
 */
export function getCorrelationId(request: Request): string {
    const existingId = request.headers.get(CORRELATION_ID_HEADER);
    if (existingId) {
        return existingId;
    }
    return crypto.randomUUID();
}

/**
 * Create headers with the correlation ID included.
 */
export function withCorrelationId(
    correlationId: string,
    headers: HeadersInit = {}
): Headers {
    const newHeaders = new Headers(headers);
    newHeaders.set(CORRELATION_ID_HEADER, correlationId);
    return newHeaders;
}

export { CORRELATION_ID_HEADER };
