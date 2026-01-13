import type { Request, Response } from 'express'; // Standard types
import { MonitorSchema } from '../schema/monitor.js';
import * as monitorService from '../services/monitor.service.js';

// --- CONTROLLER FUNCTIONS ---

export const createMonitor = async (req: Request, res: Response) => {
  try {
   
    const userId = req.user?.id; 

    if (!userId) {
        return res.status(401).json({ error: 'User ID missing from token' });
    }

    const validData = MonitorSchema.parse({
      ...req.body,
      user_id: userId
    });

    const newMonitor = await monitorService.createMonitor(validData);
    return res.status(201).json(newMonitor);

  } catch (error: any) {
    if (error.issues) return res.status(400).json({ error: error.issues });
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


export const getMonitor = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params as { id: string };
    const monitor = await monitorService.getMonitor(id, userId);

    return res.status(200).json(monitor);
  } catch (error: any) {
    // Map Service errors to HTTP Status Codes
    if (error.message === 'Monitor not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message });
    }
    
    console.error(`Error fetching monitor ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


export const getUserMonitors = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const monitors = await monitorService.getUserMonitors(userId);
    return res.status(200).json(monitors);
  } catch (error) {
    console.error('Error fetching user monitors:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};



export const deleteMonitor = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params as {id:string};

    await monitorService.deleteMonitor(id, userId);

    // 204 No Content is standard for success
    return res.status(204).send();

  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
      return res.status(404).json({ error: 'Monitor not found' });
    }
    
    console.error(`Error deleting monitor ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};



export const updateMonitor = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params as {id:string};

    // 1. Validate Partial Input with Zod
    // We strip 'user_id' so they can't transfer ownership
    const partialSchema = MonitorSchema.partial().omit({ user_id: true });
    
    const parseResult = partialSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation Error', details: parseResult.error.issues });
    }

    // 2. Call Service
    const updatedMonitor = await monitorService.updateMonitor(id, userId, parseResult.data as any);

    return res.status(200).json(updatedMonitor);

  } catch (error: any) {
    if (error.message === 'Monitor not found' || error.message.includes('Unauthorized')) {
      // For security, often better to return 404 for both to hide existence
      return res.status(404).json({ error: 'Monitor not found or unauthorized' });
    }

    console.error(`Error updating monitor ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};






