// src/worker-server.ts
import 'dotenv/config'; // If you use env vars

console.log('🚀 Starting Background Workers...');

// Importing the file executes the Worker code inside it
import './queues/workers/health-check.worker.js';


import './queues/workers/db-flush.worker.js'