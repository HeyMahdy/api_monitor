import * as monitorRepo from '../Repository/MonitorRepo.js';
import type { CreateMonitorInput, Monitor, MonitorStatus } from '../schema/monitor.js';
import monitorQueue from '../queues/jobs/monitor.queue.js'
import type {HealthCheckResult} from '../schema/health.js'

export const createMonitor = async (data: CreateMonitorInput): Promise<Monitor> => {
    // Optional: Add business logic here (e.g., check if user has reached their max monitor limit)
    const newMonitor = await monitorRepo.createMonitor(data);
    return newMonitor;
};

/**
 * Service: Get all monitors for a specific user
 */
export const getUserMonitors = async (userId: string): Promise<Monitor[]> => {
    return await monitorRepo.findMonitorsByUserId(userId);
};

/**
 * Service: Get a single monitor by ID (Secure)
 * Performs an ownership check to ensure User A cannot view User B's monitor.
 */
export const getMonitor = async (monitorId: string, userId: string): Promise<Monitor> => {
    const monitor = await monitorRepo.findMonitorById(monitorId);

    // 1. Check if it exists
    if (!monitor) {
        throw new Error('Monitor not found'); // In a real app, use a custom AppError(404)
    }

    // 2. Check ownership (Business Logic)
    if (monitor.user_id !== userId) {
        throw new Error('Unauthorized access to this monitor'); // In a real app, use AppError(403)
    }

    return monitor;
};

// dont make status = true . use the startMonitor to do that job
export const updateMonitor = async (
    monitorId: string,
    userId: string,
    data: Partial<CreateMonitorInput>
): Promise<Monitor> => {


    const monitor = await monitorRepo.updateMonitor(monitorId, userId, data as CreateMonitorInput);

    if (!monitor) {

        throw new Error('Monitor not found or unauthorized');
    }
    const result = await monitorQueue.removeJobScheduler(monitorId);

    // Automated Rescheduling: If the monitor is active, restart the scheduler to apply changes
    if (monitor.is_active) {
        await startMonitor(monitorId);
    }

    return monitor;
};



export const deleteMonitor = async (monitorId: string, userId: string): Promise<void> => {


    try {

        const removed = await monitorQueue.removeJobScheduler(monitorId);

        const isDeleted = await monitorRepo.deleteMonitor(monitorId, userId);

        if (!isDeleted) {

            throw new Error('Monitor not found or unauthorized');
        }

    } catch (cleanupError) {
        console.error(`❌ Error removing monitor ${monitorId}:`, cleanupError);
    }
};



export const getAllActiveMonitors = async (): Promise<Monitor[]> => {
    return await monitorRepo.findAllActiveMonitors();
};

/**
 * Internal: Record the result of a ping check.
 */
export const recordCheckResult = async (
    monitorId: string,
    status: MonitorStatus,
    checkTime: Date = new Date()
): Promise<Monitor | null> => {
    return await monitorRepo.updateMonitorStatus(monitorId, status, checkTime);
};



// ... other imports

export const startMonitor = async (monitorId: string): Promise<boolean> => {

    const monitor = await monitorRepo.findMonitorById(monitorId);
    if (!monitor) {
        throw new Error('Monitor not found');
    }

    await monitorRepo.setMonitorActiveStatus(monitorId, true);


    await monitorQueue.upsertJobScheduler(
        monitorId,
        {
            every: monitor.check_interval * 1000
        },
        {
            name: 'monitor',
            data: {
                monitorId: monitorId,
                url: monitor.url,
                method: monitor.method,
                headers: monitor.request_header,
                body: monitor.request_body,
                timeout: monitor.timeout,
                userId: monitor.user_id,
            },
            opts: {
                attempts: 3,
                backoff: {
                    type: 'fixed',
                    delay: 2000
                }

            }
        }
    );

    return true;
};

export const setMonitorInActiveStatus = async (monitorId: string): Promise<boolean> => {
    const monitor = monitorRepo.setMonitorInActiveStatus(monitorId)
    return monitor;
}




export const getMonitorbyIdOnly = async (monitorId: string): Promise<boolean> => {
    const monitor = monitorRepo.getmonitor(monitorId)
    return monitor;
}


export const pauseMonitor = async (monitorId: string): Promise<boolean> => {
    // 1. Update DB Status
    await monitorRepo.setMonitorInActiveStatus(monitorId);

    // 2. Stop the Scheduler (No more jobs will be created)
    await monitorQueue.removeJobScheduler(monitorId);

    return true;
};


export const resumeMonitor = async (monitorId: string): Promise<boolean> => {
    // 1. Get the settings (URL, Interval, etc.)
    const monitor = await monitorRepo.findMonitorById(monitorId);

    if (!monitor) {
        throw new Error('Monitor not found');
    }

    // 2. Update DB Status
    await monitorRepo.setMonitorActiveStatus(monitorId, true);

    // 3. Re-Create the Scheduler
    await monitorQueue.upsertJobScheduler(
        monitorId,
        {
            every: monitor.check_interval * 1000
        },
        {
            name: 'monitor',
            data: {
                monitorId: monitorId,
                url: monitor.url,
                method: monitor.method,
                headers: monitor.request_header,
                body: monitor.request_body,
                timeout: monitor.timeout,
                userId: monitor.user_id,
            },
            opts: {
                attempts: 3,
                backoff: {
                    type: 'fixed',
                    delay: 2000
                }
            }
        }
    );

    return true;
};

export const addhealthCheck = async (data:HealthCheckResult): Promise<boolean> => {
    const result = monitorRepo.createHealth(data);
    return result;
}
