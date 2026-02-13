
import { any } from 'zod';
import type { CreateMonitorInput , MonitorStats } from '../schema/monitor.js';
import {upsertMonitorStats, getAllStatsForMonitor as getAllStatsForMonitorRepo} from  '../Repository/AggregatorRepo.js'
import {findResultsByMonitorIdAndTimeRange} from '../Repository/CheckResultRepo.js'



export const calculateAllWindowsForMonitor = async(monitorId: string,userId:string):Promise<void> => {

    const windows: Array<'24h' | '7d' | '30d'> = ['24h', '7d', '30d'];

    for (const window of windows) {
      try {
        const stats = await calculateStats(monitorId, window,userId);
        await upsertMonitorStats(stats);
        console.log(`✅ Calculated ${window} stats for monitor ${monitorId}`);
      } catch (error) {
        console.error(
          `❌ Failed to calculate ${window} stats for monitor ${monitorId}:`,
          error
        );
      }

}
}
export const calculatePercentile = async (sortedArray: number[], percentile: number): Promise<number> => {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    const result = sortedArray[Math.max(0, index)];
    return result ?? 0; 
}


export const calculateStats = async(monitorId:string,window:string,userId:string):Promise<any> => {
    const endTime = new Date();
    const startTime = await getStartTime(endTime, window);
    type TimeWindow = "1h" | "24h" | "7d" | "30d";

    // 2. Fetch all health check results in this range
    const results = await findResultsByMonitorIdAndTimeRange(
      monitorId,
      userId,
      startTime,
      endTime
    );


    // 4. Calculate counts
    const totalChecks = results.length;
    const successfulChecks = results.filter((r) => r.status === true).length;
    const failedChecks = totalChecks - successfulChecks;

    // 5. Calculate uptime and success rate
    const uptimePercentage = (successfulChecks / totalChecks) * 100;
    const successRatePercentage = uptimePercentage;

    // 6. Get successful results for response time calculations
    const successfulResults = results.filter((r) => r.status === true);

    // 7. Calculate response time metrics (only from successful checks)
    let avgResponseTime = 0;
    let p95ResponseTime = 0;
    let p99ResponseTime = 0;

    if (successfulResults.length > 0) {
      const responseTimes = successfulResults.map((r) => r.response_time_ms);

      // Average
      avgResponseTime =
        responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length;



      // Percentiles (need sorted array)
      const sortedTimes = [...responseTimes].sort((a, b) => a - b);
      p95ResponseTime = await calculatePercentile(sortedTimes, 0.95);
      p99ResponseTime = await calculatePercentile(sortedTimes, 0.99);
    }

    // 8. Build and return the stats object
    return {
      monitor_id: monitorId,
      time_window: window as TimeWindow,

      uptime_percentage: Math.round(uptimePercentage * 100) / 100,
      success_rate_percentage: Math.round(successRatePercentage * 100) / 100,

      avg_response_time_ms: Math.round(avgResponseTime),
      p95_response_time_ms: p95ResponseTime,
      p99_response_time_ms: p99ResponseTime,

      total_checks: totalChecks,
      successful_checks: successfulChecks,
      failed_checks: failedChecks,

      calculated_at: new Date(),
      
    };

}

export const getStartTime = async(endTime: Date, window: string):Promise<Date>=>{
    const start = new Date(endTime);

    switch (window) {
      case '24h':
        start.setHours(start.getHours() - 24);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
    }

    return start;

}

export const getAllStatsForMonitor = async (
  monitorId: string,
  userId: string
): Promise<MonitorStats[]> => {
  return await getAllStatsForMonitorRepo(monitorId, userId);
};