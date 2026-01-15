import { number, z } from 'zod';

export const HttpMethodEnum = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);
export const MonitorStatusEnum = z.enum(['PENDING', 'UP', 'DOWN', 'PAUSED']);

export const MonitorSchema = z.object({
    user_id : z.string(),
    name : z.string(),
    url : z.string().url(),
    method : HttpMethodEnum,
    request_header : z.record(z.string(),z.string()).optional().default({}),
    check_interval: z.number().int().min(10,"Minimum interval is 10 seconds"),
    timeout: z.number().int().min(1, "Minimum timeout is 1 second"),
    request_body : z.record(z.string(),z.string()).optional().default({}),
  
  is_active: z.boolean().default(false),
  status: MonitorStatusEnum.optional().default('PENDING'),
});

export type CreateMonitorInput = z.infer<typeof MonitorSchema>;


export const MonitorRowSchema = MonitorSchema.extend({
  id: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
  last_checked_at: z.date().nullable(),
});

export type Monitor = z.infer<typeof MonitorRowSchema>;
export type MonitorStatus = z.infer<typeof MonitorStatusEnum>;


