import type { Request, Response } from 'express';
import * as checkResultService from '../services/CheckResultService.js';
import * as monitorService from '../services/monitor.service.js';

export const getMonitorHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params as { id: string };
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // First verify monitor belongs to user
    await monitorService.getMonitor(id, userId);

    const history = await checkResultService.getMonitorResults(id, page, limit);

    return res.status(200).json(history);
  } catch (error: any) {
    if (error.message === 'Monitor not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message });
    }
    console.error('Error fetching monitor history:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
