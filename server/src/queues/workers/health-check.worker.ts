// src/workers/monitor.worker.ts
import { Worker, Job } from 'bullmq';
import redisConnection from '../../config/redis.js';
import { HealthCheckService } from '../../services/HealthCheck.service.js';
import {setMonitorInActiveStatus} from '../../Repository/MonitorRepo.js'
import monitorQueue from '../jobs/monitor.queue.js';
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
        
        // HealthCheckService already handles all errors internally
        // Just await and return the result
        const result = await HealthCheckService.check(
            url, 
            method, 
            headers, 
            body, 
            timeout
        );
        
        // Log the outcome
        if (result.status) {
            console.log(`[Job ${job.id}] Success: ${result.statusCode} in ${result.responseTimeMs}ms`);
        } else {
            console.error(`[Job ${job.id}] Failed: ${result.errorType} - ${result.errorMessage}`);
            throw new Error;
        }
        
        return result;
    },
    {
        connection: redisConnection,
        concurrency: 10
    }
);

export default monitorWorker;

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
        setMonitorInActiveStatus(monitorId)

        
        if (removed) {
            console.log(`✅ Monitor ${monitorId} stopped successfully.`);
        } else {
            console.log(`⚠️ Monitor ${monitorId} not found (might already be removed).`);
        }
    } catch (error) { // Renamed to 'err' to avoid conflict with the 'error' arg above
        console.error(`❌ Error removing monitor ${monitorId}:`, error);
    }
});


