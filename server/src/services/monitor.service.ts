import * as monitorRepo from '../Repository/MonitorRepo.js'; 
import type { CreateMonitorInput,Monitor, MonitorStatus } from '../schema/monitor.js';
import myQueue  from '../queues/jobs/monitor.queue.js'


export const createMonitor = async (data: CreateMonitorInput): Promise<Monitor> => {
  // Optional: Add business logic here (e.g., check if user has reached their max monitor limit)
  const newMonitor = await monitorRepo.createMonitor(data);
  return newMonitor;
};

/**P
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

/**
 * Service: Update a monitor
 * Accepts a PARTIAL input, because the user might only want to change the name.
 */
export const updateMonitor = async (
  monitorId: string, 
  userId: string, 
  data: Partial<CreateMonitorInput>
): Promise<Monitor> => {
  // The repository expects 'CreateMonitorInput', but our logic handles partials.
  // We cast 'data' here because the Repo's dynamic SQL builder handles missing keys gracefully.
  const updatedMonitor = await monitorRepo.updateMonitor(monitorId, userId, data as CreateMonitorInput);

  if (!updatedMonitor) {
    // If null, it means either the ID doesn't exist OR the userId doesn't match
    throw new Error('Monitor not found or unauthorized');
  }

  return updatedMonitor;
};

/**
 * Service: Delete a monitor
 */
export const deleteMonitor = async (monitorId: string, userId: string): Promise<void> => {
  const isDeleted = await monitorRepo.deleteMonitor(monitorId, userId);

  if (!isDeleted) {
    throw new Error('Monitor not found or unauthorized');
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

    console.log("this is the monitor id")
    console.log(monitorId)

   
    await myQueue.upsertJobScheduler(
        monitorId,                          // jobSchedulerId
        {
            every: monitor.check_interval * 1000  // repeatOpts
        },
        {
            name: 'monitor',                // jobTemplate.name (must match worker)
            data: {                         // jobTemplate.data
                monitorId: monitorId,
                url: monitor.url,
                method: monitor.method,
                headers: monitor.request_header,
                body: monitor.request_body,
                timeout: monitor.timeout,
                userId: monitor.user_id,
            },
            opts: {                         // jobTemplate.opts
                attempts: 3
            }
        }
    );

    return true;
};