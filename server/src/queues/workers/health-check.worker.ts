// src/workers/monitor.worker.ts
import { Worker, Job } from 'bullmq';
import redisConnection from '../../config/redis.js';
import { HealthCheckService } from '../../services/HealthCheck.service.js';
import {setMonitorInActiveStatus} from '../../Repository/MonitorRepo.js'
import {getMonitorbyIdOnly} from '../../services/monitor.service.js'
import {addToStream} from '../../lib/redis-stream.js'
import {handleMonitorFailure,getIncidentById,resolveIncident} from '../../services/incident.service.js'
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
        
        const result = await HealthCheckService.check(monitorId , url, method, headers, body, timeout);

        const monitor = await getMonitorbyIdOnly(monitorId); 
        if(!monitor){
            return;
        }
       
        
        if (result.status) {
            await addToStream(result);
        } else {
            await addToStream(result);
            
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


monitorWorker.on('completed', async (job, result) => {
         const id = job?.data?.monitorId;
         const incident = await getIncidentById(id)
         if(incident){
            if(incident.status==='OPEN'){
                  await resolveIncident(id)
            }
         }
});




monitorWorker.on('failed', async (job, error) => {

    if(!job) {
        return;
    }

    
    const attemptsLeft = (job.opts?.attempts||1) - job.attemptsMade;
    
    if (attemptsLeft > 0) {
        // Still has retries left, don't cleanup yet
        return;
    }

    const monitorId = job?.data?.monitorId;
    
    if (!monitorId) {
        console.error(`❌ Job ${job?.id} failed but no Monitor ID found.`);
        return;
    }
    const healthResult = (error as any).healthCheckResult;
    
    try {
        await handleMonitorFailure(monitorId,healthResult);
        await setMonitorInActiveStatus(monitorId);
    } catch (cleanupError) {
        console.error(`❌ Error removing monitor ${monitorId}:`, cleanupError);
    }
});



const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}, closing worker...`);
    
    await monitorWorker.close();
    

    console.log('Worker closed safely. Exiting process.');
    process.exit(0);
};

// Listen for the "Stop" signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));