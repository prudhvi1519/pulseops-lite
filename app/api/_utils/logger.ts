/**
 * Simple structured logger for API routes.
 * Always includes correlationId, route, and timing information.
 */

interface LogContext {
    correlationId: string;
    route: string;
    method: string;
    [key: string]: unknown;
}

interface Logger {
    info: (message: string, extra?: Record<string, unknown>) => void;
    warn: (message: string, extra?: Record<string, unknown>) => void;
    error: (message: string, extra?: Record<string, unknown>) => void;
}

/**
 * Create a logger instance with the given context.
 */
export function createLogger(context: LogContext): Logger {
    const log = (
        level: 'info' | 'warn' | 'error',
        message: string,
        extra?: Record<string, unknown>
    ) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...context,
            ...extra,
        };

        const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
        logFn(JSON.stringify(logEntry));
    };

    return {
        info: (message, extra) => log('info', message, extra),
        warn: (message, extra) => log('warn', message, extra),
        error: (message, extra) => log('error', message, extra),
    };
}

/**
 * Log request completion with duration.
 */
export function logRequestComplete(
    logger: Logger,
    status: number,
    startTime: number
): void {
    const duration = Date.now() - startTime;
    logger.info('Request completed', { status, durationMs: duration });
}
