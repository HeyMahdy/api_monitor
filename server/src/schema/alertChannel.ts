import { z } from 'zod';

export const AlertChannelTypeEnum = z.enum(['EMAIL', 'WEBHOOK', 'SLACK', 'DISCORD']);

export const AlertChannelConfigSchema = z.record(z.string(), z.any());

export const AlertChannelSchema = z.object({
    user_id: z.string().uuid(),
    type: AlertChannelTypeEnum,
    name: z.string().min(1, "Name is required"),
    config: AlertChannelConfigSchema.default({}),
});

export const CreateAlertChannelSchema = z.object({
    type: AlertChannelTypeEnum,
    name: z.string().min(1, "Name is required"),
    config: AlertChannelConfigSchema.default({}),
});

export const UpdateAlertChannelSchema = CreateAlertChannelSchema.partial();

export type AlertChannelInput = z.infer<typeof AlertChannelSchema>;
export type CreateAlertChannelInput = z.infer<typeof CreateAlertChannelSchema>;
export type UpdateAlertChannelInput = z.infer<typeof UpdateAlertChannelSchema>;

export const AlertChannelRowSchema = AlertChannelSchema.extend({
    id: z.string().uuid(),
    created_at: z.date(),
    updated_at: z.date(),
});

export type AlertChannel = z.infer<typeof AlertChannelRowSchema>;
export type AlertChannelType = z.infer<typeof AlertChannelTypeEnum>;
