import { Queue } from 'bullmq';
import  redisConnection  from '../../config/redis.js';

 const  dbFlushQueue = new Queue('monitor', {
    connection: redisConnection
});
export default dbFlushQueue;