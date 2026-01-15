// src/workers/monitor.worker.ts
import { Worker, Job } from 'bullmq';
import axios from 'axios';
import  redisConnection  from '../../config/redis.js';
import monitorQueue from '../jobs/monitor.queue.js';
// Define the interface for Type Safety
interface MonitorJobData {
    monitorId: string;
    url: string;
    method: string;
    headers?: any;
    body?: any;
    timeout: number;
}

const monitorWorker = new Worker(
    'monitor', 
    async (job: Job<MonitorJobData>) => {
        const { url, method, headers, body, timeout } = job.data;
        console.log(`[Job ${job.id}] Checking ${method} ${url}`);
        
        try {
            const response = await axios({
                method: method,
                url: url,
                headers: headers,
                data: body,
                timeout: timeout * 1000
            });
            
            return {
                status: response.status,
                outcome: 'UP',
                time: new Date()
            };
        } catch (error: any) {
            console.error(`[Job ${job.id}] Failed: ${error.message}`);
            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: 10
    }
);

monitorWorker.on('completed', (job, returnvalue) => {
    console.log(`✅ Job ${job.id} completed. Result:`, returnvalue);
});

// 1. Add 'async' here so you can use await inside
monitorWorker.on('failed', async (job, error) => {
    
   
    const monitorId = job?.data?.monitorId; 

    if (!monitorId) {
        console.error(`❌ Job ${job?.id} failed but no Monitor ID found in data.`);
        return;
    }

    try {
       
        const removed = await monitorQueue.removeJobScheduler(monitorId);
        
        if (removed) {
            console.log(`✅ Monitor ${monitorId} stopped successfully.`);
        } else {
            console.log(`⚠️ Monitor ${monitorId} not found (might already be removed).`);
        }
    } catch (error) { // Renamed to 'err' to avoid conflict with the 'error' arg above
        console.error(`❌ Error removing monitor ${monitorId}:`, error);
    }
});


