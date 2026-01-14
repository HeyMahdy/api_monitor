import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create a new Pool instance using the standard pg library
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // SSL is usually required for cloud hosts like Render
  ssl: {
    rejectUnauthorized: false, // Allows connection even if the cert is self-signed (common for cloud DBs)
  },
});

// Add error event listener to catch backend errors on idle clients
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
});

// Helper function for queries (same API as before)
export const query = (text: string, params?: any[]) => pool.query(text, params);