import { z } from 'zod';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export const BATCH_LIMITS = {
    MAX_ENTRIES: 200,
    MAX_PAYLOAD_BYTES: 262144, // 256KB
};

export const RATE_LIMIT = {
    MAX_LOGS_PER_WINDOW: 1200,
    WINDOW_SECONDS: 60,
};

export const LogEntryInputSchema = z.object({
    timestamp: z.string().datetime(), // ISO string
    level: z.enum(['debug', 'info', 'warn', 'error']),
    message: z.string().min(1),
    meta: z.record(z.unknown()).optional(),
    trace_id: z.string().optional(),
    request_id: z.string().optional(),
});

export type LogEntryInput = z.infer<typeof LogEntryInputSchema>;

export const IngestBodySchema = z.object({
    logs: z.array(LogEntryInputSchema).min(1).max(BATCH_LIMITS.MAX_ENTRIES),
});

export type IngestBody = z.infer<typeof IngestBodySchema>;

export interface LogRow {
    id: string;
    orgId: string;
    serviceId: string;
    serviceName: string;
    environmentId: string;
    environmentName: string;
    ts: Date;
    level: LogLevel;
    message: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metaJson: any;
    traceId: string | null;
    requestId: string | null;
}
