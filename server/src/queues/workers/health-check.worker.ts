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
        const { monitorId, url, method, headers, body, timeout } = job.data;

        console.log(`Job ${job.id} Checking ${method} ${url}`);
        
        const result = await HealthCheckService.check(url, method, headers, body, timeout);
       
        
        if (result.status) {
            console.log(`Job ${job.id} Success: ${result.statusCode} in ${result.responseTimeMs}ms`);
            return result;
        } else {
            
            console.error(`[Job ${job.id}] Failed Health Check:`, {
                statusCode: result.statusCode,
                responseTime: result.responseTimeMs,
                errorType: result.errorType,
                errorMessage: result.errorMessage,
            });
            
            const error = new Error(`Health check failed: ${result.errorMessage}`);
            (error as any).healthCheckResult = result;
            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: 10
    }
);

monitorWorker.on('failed', async (job, error) => {

    if(!job) {
        return;
    }

    
    const attemptsLeft = (job.opts?.attempts||1) - job.attemptsMade;
    
    if (attemptsLeft > 0) {
        // Still has retries left, don't cleanup yet
        console.log(`⚠️ Job ${job.id} failed (attempt ${job.attemptsMade}/${job.opts?.attempts || 1}), will retry...`);
        return;
    }

    const monitorId = job?.data?.monitorId;
    
    if (!monitorId) {
        console.error(`❌ Job ${job?.id} failed but no Monitor ID found.`);
        return;
    }
    
    try {
        const removed = await monitorQueue.removeJobScheduler(monitorId);
        await setMonitorInActiveStatus(monitorId);
        
        if (removed) {
            console.log(`✅ Monitor ${monitorId} stopped successfully.`);
        } else {
            console.log(`⚠️ Monitor ${monitorId} not found (might already be removed).`);
        }
    } catch (cleanupError) {
        console.error(`❌ Error removing monitor ${monitorId}:`, cleanupError);
    }
});