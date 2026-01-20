import { z } from 'zod';

export const IncidentStatusEnum = z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED']);
export const IncidentSeverityEnum = z.enum(['CRITICAL', 'WARNING', 'INFO']);

export const IncidentSchema = z.object({
    monitor_id: z.string(),
    status: IncidentStatusEnum,
    severity: IncidentSeverityEnum,
    failure_count: z.number().int().min(1),
    error_message: z.string().nullable().optional(),
});

export const CreateIncidentSchema = z.object({
    monitor_id: z.string(),
    status: IncidentStatusEnum.optional().default('OPEN'),
    severity: IncidentSeverityEnum.optional().default('CRITICAL'),
    failure_count: z.number().int().min(1).optional().default(1),
    error_message: z.string().nullable().optional(),
});

export type CreateIncidentInput = z.infer<typeof CreateIncidentSchema>;

export const IncidentRowSchema = IncidentSchema.extend({
    id: z.number().int(),
    started_at: z.date(),
    resolved_at: z.date().nullable(),
    acknowledged_at: z.date().nullable(),
});

export type Incident = z.infer<typeof IncidentRowSchema>;
export type IncidentStatus = z.infer<typeof IncidentStatusEnum>;
export type IncidentSeverity = z.infer<typeof IncidentSeverityEnum>;
