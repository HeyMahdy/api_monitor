import { neon, neonConfig } from '@neondatabase/serverless';
import { Pool } from '@neondatabase/serverless';
// Provide a WebSocket implementation for environments (like Node) where
// a global WebSocket is not available. Neon serverless client requires this
// when connecting with the websocket-based connector.
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();

// Use Neon serverless client for serverless databases
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Configure Neon for better connection handling
neonConfig.fetchConnectionCache = true;

// Ensure a WebSocket constructor is available for Neon
;(globalThis as any).WebSocket = (globalThis as any).WebSocket || WebSocket;
neonConfig.webSocketConstructor = (globalThis as any).WebSocket;

// Use Neon's Pool which supports parameterized queries like pg Pool
// This is the recommended way for serverless databases
// Works with both regular and pooler endpoints
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1, // Serverless databases work best with 1 connection per instance
  // If using pooler endpoint, Neon handles connection pooling automatically
});

// Add error event listener
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
});

// Helper function for queries (maintains compatibility)
export const query = (text: string, params?: any[]) => pool.query(text, params);

// Export sql for direct use if needed (using neon function for simple queries)
export const sql = neon(process.env.DATABASE_URL);