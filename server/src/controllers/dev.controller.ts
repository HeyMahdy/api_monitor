import type { Request, Response } from 'express';
import { pool } from '../db/db_config.js';

export const clearDatabase = async (req: Request, res: Response) => {
  try {
    // Truncate both tables and restart identity sequences
    await pool.query('TRUNCATE TABLE monitors, users RESTART IDENTITY CASCADE;');
    
    return res.status(200).json({ 
      message: 'Database cleared successfully',
      tables: ['monitors', 'users']
    });
  } catch (error: any) {
    console.error('Error clearing database:', error);
    return res.status(500).json({ 
      error: 'Failed to clear database',
      details: error.message 
    });
  }
};
