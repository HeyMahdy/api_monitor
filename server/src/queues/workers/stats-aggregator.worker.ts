// workers/stats-aggregator.worker.ts

import { Worker, Job } from 'bullmq';
import myRedisConnection from '../../config/redis.js'
import { calculateAllWindowsForMonitor } from '../../services/Aggregator.service.js'
import { getActiveMonitorsForUser } from '../../services/monitor.service.js';

const statsAggregatorWorker = new Worker(
    'stats-aggregator',
    async (job: Job) => {
        console.log(`📊 Starting stats aggregation job: ${job.id}`);
          
        const { userId } = job.data as { userId?: string };
        if (!userId) {
            console.error('❌ Stats aggregation job missing userId');
            return { processed: 0, failed: 0 };
        }
        console.log("this is the id")

        console.log(userId)

        // 1. Get all active monitors for this user
        const monitors = await getActiveMonitorsForUser(userId);

        if (!monitors || monitors.length === 0) {
            console.log('No active monitors found.');
            return { processed: 0 };
        }

        console.log(`Found ${monitors.length} active monitors. Processing...`);

        let successCount = 0;
        let failCount = 0;

        // 2. For each monitor, calculate stats
        for (const monitor of monitors) {
            try {
                await calculateAllWindowsForMonitor(monitor.id, monitor.user_id);
                successCount++;
            } catch (error) {
                console.error(`❌ Failed to aggregate stats for monitor ${monitor.id}:`, error);
                failCount++;
            }
        }

        return { success: true, processed: successCount, failed: failCount };
    },
    {
        connection: myRedisConnection,
        concurrency: 1 
    }
);

statsAggregatorWorker.on('completed', async (job, result) => {
    console.log(`✅ Stats aggregation job completed: ${job.id}`);
});

statsAggregatorWorker.on('failed', async (job, error) => {
    if (!job) return;

    // Simple failure logging without retry checks
    console.error(`❌ Stats aggregation job ${job.id} failed:`, error);
});

const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}, closing stats aggregator worker...`);
    
    await statsAggregatorWorker.close();

    console.log('Stats Aggregator Worker closed safely. Exiting process.');
    process.exit(0);
};

// Listen for the "Stop" signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default statsAggregatorWorker;