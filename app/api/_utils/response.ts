/**
 * Standard API response utilities.
 * 
 * Success: { data, meta? }
 * Error: { error: { code, message, details? }, correlationId }
 */

import { withCorrelationId } from './correlation';

export interface ApiSuccessResponse<T> {
    data: T;
    meta?: Record<string, unknown>;
}

export interface ApiErrorBody {
    code: string;
    message: string;
    details?: unknown;
}

export interface ApiErrorResponse {
    error: ApiErrorBody;
    correlationId: string;
}

/**
 * Create a success response with standard shape.
 */
export function successResponse<T>(
    data: T,
    correlationId: string,
    meta?: Record<string, unknown>,
    status = 200
): Response {
    const body: ApiSuccessResponse<T> = { data };
    if (meta) {
        body.meta = meta;
    }

    return new Response(JSON.stringify(body), {
        status,
        headers: withCorrelationId(correlationId, {
            'Content-Type': 'application/json',
        }),
    });
}

/**
 * Create an error response with standard shape.
 */
export function errorResponse(
    code: string,
    message: string,
    correlationId: string,
    status = 500,
    details?: unknown
): Response {
    const body: ApiErrorResponse = {
        error: { code, message },
        correlationId,
    };

    if (details !== undefined) {
        body.error.details = details;
    }

    return new Response(JSON.stringify(body), {
        status,
        headers: withCorrelationId(correlationId, {
            'Content-Type': 'application/json',
        }),
    });
}

/**
 * Common error codes.
 */
export const ErrorCodes = {
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    BAD_REQUEST: 'BAD_REQUEST',
} as const;
