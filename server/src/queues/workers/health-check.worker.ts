// src/workers/monitor.worker.ts
import { Worker, Job } from 'bullmq';
import axios from 'axios';
import  redisConnection  from '../../config/redis.js';

// Define the interface for Type Safety
interface MonitorJobData {
    url: string;
    method: string;
    headers?: any;
    body?: any;
    timeout: number;
}

const monitorWorker = new Worker('monitor', async (job: Job<MonitorJobData>) => {
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
        // Throwing error marks job as FAILED in BullMQ
        throw error;
    }
}, {
    connection: redisConnection,
    concurrency: 10 // Handle 10 jobs at once
});

// Event Listeners
monitorWorker.on('completed', (job, returnvalue) => {
    console.log(`✅ Job ${job.id} completed. Result:`, returnvalue);
});

monitorWorker.on('failed', (job, error) => {
    console.log(`❌ Job ${job?.id} failed: ${error.message}`);
});

console.log('👷 Monitor Worker is running...');