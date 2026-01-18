
import { string } from 'zod';
import myRedisConnection from '../../config/redis.js'
import {addhealthCheck} from '../../services/monitor.service.js'

const workerdb = myRedisConnection.duplicate();


const STREAM_KEY = 'monitor_stream';
const GROUP_NAME = 'db_service_group';
const CONSUMER_NAME = `worker-${Math.floor(Math.random() * 1000)}`;


type StreamMessage = [string, string[]]; 
type StreamEntry = [string, StreamMessage[]];
type StreamResponse = StreamEntry[]; 
let shouldStop = false;

 async function db_flush() {

    try {
        await myRedisConnection.xgroup('CREATE', STREAM_KEY, GROUP_NAME, '$', 'MKSTREAM');
        console.log("Created Consumer Group");
    } catch (err: any) {
        if (!err.message.includes('BUSYGROUP')) throw err;
    }


    while (!shouldStop) {
        try {

            const response = await workerdb.xreadgroup(
                'GROUP', GROUP_NAME, CONSUMER_NAME,
                'COUNT', 1,
                'BLOCK', 5000,
                'STREAMS', STREAM_KEY, '>'
            ) as StreamResponse;

            if (response && response[0]) {

                const streamData = response[0][1];

                if (streamData.length > 0) {

                    for (const message of streamData) {

                        const [id, fields] = message;

                        const rawData = fields[1];

                        if (!rawData) {
                            console.warn(`Skipping message ${id}: No data found`);
                            await workerdb.xack(STREAM_KEY, GROUP_NAME, id); 
                            continue; 
                        }

                        const logData = JSON.parse(rawData);
                        console.log(
                            "this is log data"
                        )
                        console.log(logData)

                        await addhealthCheck(logData);

                        await workerdb.xack(STREAM_KEY, GROUP_NAME, id);

                    }

                }
            }

        } catch (error) {
            console.error("Worker Error:", error);
            await new Promise(r => setTimeout(r, 2000));
        }
    }

}

async function shutdown(signal: string) {
    console.log(`\n🛑 Received ${signal}, shutting down...`);
    shouldStop = true; 
    await new Promise(r => setTimeout(r, 2000));
    
    await workerdb.quit();
    await myRedisConnection.quit();
    
    console.log(`👋 Goodbye!`);
    process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));   
process.on('SIGTERM', () => shutdown('SIGTERM')); 

db_flush().catch(err => {
    console.error("❌ DB Flush Worker Crashed:", err);
});