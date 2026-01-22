import type { Request, Response } from 'express';
import * as alertChannelService from '../services/alertChannel.service.js';
import { CreateAlertChannelSchema, UpdateAlertChannelSchema } from '../schema/alertChannel.js';

export const createAlertChannel = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const data = CreateAlertChannelSchema.parse(req.body);
        const channel = await alertChannelService.createAlertChannel(userId, data);
        res.status(201).json(channel);
    } catch (error: any) {
        console.error('Error creating alert channel:', error);
        res.status(500).json({ error: error.message || 'Failed to create alert channel' });
    }
};

export const listAlertChannels = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const channels = await alertChannelService.listAlertChannels(userId);
        res.status(200).json(channels);
    } catch (error: any) {
        console.error('Error listing alert channels:', error);
        res.status(500).json({ error: error.message || 'Failed to list alert channels' });
    }
};

export const updateAlertChannel = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const { id } = req.params as { id: string };
        const data = UpdateAlertChannelSchema.parse(req.body);
        const channel = await alertChannelService.updateAlertChannel(id, userId, data);
        
        if (!channel) return res.status(404).json({ error: 'Alert channel not found' });
        
        res.status(200).json(channel);
    } catch (error: any) {
        console.error(`Error updating alert channel ${req.params.id}:`, error);
        res.status(500).json({ error: error.message || 'Failed to update alert channel' });
    }
};

export const deleteAlertChannel = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const { id } = req.params as { id: string };
        const deleted = await alertChannelService.deleteAlertChannel(id, userId);
        
        if (!deleted) return res.status(404).json({ error: 'Alert channel not found' });
        
        res.status(200).json({ message: 'Alert channel deleted successfully' });
    } catch (error: any) {
        console.error(`Error deleting alert channel ${req.params.id}:`, error);
        res.status(500).json({ error: error.message || 'Failed to delete alert channel' });
    }
};

export const testAlertChannel = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const { id } = req.params as { id: string };
        const success = await alertChannelService.testAlertChannel(id, userId);
        
        if (success) {
            res.status(200).json({ message: 'Test notification sent successfully' });
        } else {
            res.status(400).json({ error: 'Failed to send test notification' });
        }
    } catch (error: any) {
        console.error(`Error testing alert channel ${req.params.id}:`, error);
        res.status(500).json({ error: error.message || 'Failed to test alert channel' });
    }
};
