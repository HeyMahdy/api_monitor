import { Queue } from 'bullmq';
import  redisConnection  from '../../config/redis.js';

 const  monitorQueue = new Queue('monitor', {
    connection: redisConnection
});
export default monitorQueue;