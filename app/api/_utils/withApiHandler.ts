/**
 * API route handler wrapper.
 * Provides correlation ID, logging, and error handling.
 */

import { NextRequest } from 'next/server';
import { getCorrelationId } from './correlation';
import { createLogger, logRequestComplete } from './logger';
import { errorResponse, ErrorCodes } from './response';
import { AuthError } from '@/lib/auth/rbac';

export interface HandlerContext {
    correlationId: string;
    logger: ReturnType<typeof createLogger>;
}

type RouteHandler = (
    request: NextRequest,
    context: HandlerContext
) => Promise<Response>;

interface WithApiHandlerOptions {
    route: string;
}

/**
 * Wrap a route handler with standard error handling and logging.
 */
export function withApiHandler(
    handler: RouteHandler,
    options: WithApiHandlerOptions
) {
    return async (request: NextRequest): Promise<Response> => {
        const startTime = Date.now();
        const correlationId = getCorrelationId(request);
        const logger = createLogger({
            correlationId,
            route: options.route,
            method: request.method,
        });

        logger.info('Request started');

        try {
            const response = await handler(request, { correlationId, logger });
            logRequestComplete(logger, response.status, startTime);
            return response;
        } catch (error) {
            // Handle Auth errors (401/403)
            if (error instanceof AuthError) {
                const status = error.code === 'UNAUTHORIZED' ? 401 : 403;
                logger.warn('Auth error', { code: error.code, message: error.message });
                logRequestComplete(logger, status, startTime);
                return errorResponse(
                    error.code,
                    error.message,
                    correlationId,
                    status
                );
            }

            // Handle Zod validation errors
            if (error && typeof error === 'object' && 'issues' in error) {
                const zodError = error as {
                    issues: Array<{ message: string; path: Array<string | number> }>;
                };
                logger.warn('Validation error', { issues: zodError.issues });
                logRequestComplete(logger, 400, startTime);
                return errorResponse(
                    ErrorCodes.VALIDATION_ERROR,
                    'Validation failed',
                    correlationId,
                    400,
                    zodError.issues.map((i) => ({
                        path: i.path.join('.'),
                        message: i.message,
                    }))
                );
            }

            // Handle generic errors - don't expose stack traces
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            logger.error('Unhandled error', {
                error: errorMessage,
                stack: error instanceof Error ? error.stack : undefined,
            });
            logRequestComplete(logger, 500, startTime);

            return errorResponse(
                ErrorCodes.INTERNAL_ERROR,
                'An internal error occurred',
                correlationId,
                500
            );
        }
    };
}

