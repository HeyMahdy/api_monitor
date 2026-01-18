import { json } from 'zod'
import myRedisConnection from '../config/redis.js'


export const addToStream = async (data: object) => {
  try {
    // Syntax for ioredis: xadd(key, id, field, value)
    const entryId = await myRedisConnection.xadd(
      'monitor_stream',      // 1. Stream Key
      '*',                   // 2. ID (Auto-generate)
      'payload',             // 3. Field Name
      JSON.stringify(data)   // 4. Field Value (Your JSON blob)
    );

    console.log(`Log added to stream with ID: ${entryId}`);
    return entryId;
    
  } catch (error) {
    console.error('Failed to add to stream:', error);
  }
};