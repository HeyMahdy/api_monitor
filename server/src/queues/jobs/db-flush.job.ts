
import dbFlushQueue from './db-flush.queue.js'


const db_flush_job = async()=>{

    await dbFlushQueue.upsertJobScheduler(
        "db",                          
        {
            every:5000
        },
    );

}
