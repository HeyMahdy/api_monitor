import { z } from 'zod';

export const HealthCheckResultSchema = z.object({
  id: z.string(),
  url: z.string(), 
  status: z.boolean(),
  
  // Matching SQL column names strictly
  response_time_ms: z.number().int().nonnegative(),
  status_code: z.number().int().nullable().optional(),
  error_type: z.string().nullable().optional(),
  error_message: z.string().nullable().optional(),
  
  // 'pg' driver returns JS Date objects for TIMESTAMPTZ
  timestamp: z.date(), 
});

// Create a Type from the Schema
export type HealthCheckResult = z.infer<typeof HealthCheckResultSchema>;