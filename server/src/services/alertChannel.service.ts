import * as alertChannelRepo from '../Repository/AlertChannelRepo.js';
import type { AlertChannel, AlertChannelInput, UpdateAlertChannelInput, CreateAlertChannelInput } from '../schema/alertChannel.js';
import { testWebhook } from './webhook.service.js';

export const createAlertChannel = async (userId: string, data: CreateAlertChannelInput): Promise<AlertChannel> => {
    return await alertChannelRepo.createAlertChannel({
        ...data,
        user_id: userId,
    });
};

export const listAlertChannels = async (userId: string): Promise<AlertChannel[]> => {
    return await alertChannelRepo.findAlertChannelsByUserId(userId);
};

export const getAlertChannelById = async (id: string, userId: string): Promise<AlertChannel | null> => {
    return await alertChannelRepo.findAlertChannelById(id, userId);
};

export const updateAlertChannel = async (id: string, userId: string, data: UpdateAlertChannelInput): Promise<AlertChannel | null> => {
    return await alertChannelRepo.updateAlertChannel(id, userId, data);
};

export const deleteAlertChannel = async (id: string, userId: string): Promise<boolean> => {
    return await alertChannelRepo.deleteAlertChannel(id, userId);
};

export const testAlertChannel = async (id: string, userId: string): Promise<boolean> => {
    const channel = await alertChannelRepo.findAlertChannelById(id, userId);
    if (!channel) throw new Error('Alert channel not found');

    const { type, config } = channel;

    switch (type) {
        case 'WEBHOOK':
            if (!config.url) throw new Error('Webhook URL not configured');
            return await testWebhook(config.url);
        
        case 'EMAIL':
            // Placeholder for email testing logic
            console.log(`Testing email channel to ${config.email}`);
            return true;

        case 'SLACK':
        case 'DISCORD':
            if (!config.webhook_url) throw new Error(`${type} webhook URL not configured`);
            return await testWebhook(config.webhook_url);

        default:
            throw new Error(`Testing not implemented for channel type: ${type}`);
    }
};
