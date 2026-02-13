// queues/stats-aggregator.queue.ts

import { Queue } from 'bullmq';
import  redisConnection  from '../../config/redis.js';

const statsAggregatorQueue = new Queue('stats-aggregator', {
  connection: redisConnection,
});

export default statsAggregatorQueue;