import { pool } from "../db/db_config.js";
import type { HealthCheckResult } from "../schema/monitor.js";

export const findResultsByMonitorId = async (
  monitorId: string,
  limit: number,
  offset: number
): Promise<{ results: HealthCheckResult[]; total: number }> => {
  const sqlResults = `
    SELECT * FROM health_check_results 
    WHERE monitor_id = $1
    ORDER BY timestamp DESC
    LIMIT $2 OFFSET $3;
  `;

  const sqlTotal = `
    SELECT COUNT(*) FROM health_check_results 
    WHERE monitor_id = $1;
  `;

  const [resultsRes, totalRes] = await Promise.all([
    pool.query(sqlResults, [monitorId, limit, offset]),
    pool.query(sqlTotal, [monitorId]),
  ]);

  return {
    results: resultsRes.rows,
    total: parseInt(totalRes.rows[0].count, 10),
  };
};



export const findResultsByMonitorIdAndTimeRange = async (
  monitorId: string,
  userId: string, // <--- New Security Param
  startTime: Date,
  endTime: Date
): Promise<HealthCheckResult[]> => {
  const query = `
    SELECT 
      r.id,
      r.monitor_id,
      r.status,
      r.response_time_ms,
      r.status_code,
      r.error_type,
      r.error_message,
      r.timestamp
    FROM health_check_results r
    JOIN monitors m ON r.monitor_id = m.id  -- Join to check ownership
    WHERE r.monitor_id = $1
      AND m.user_id = $2                    -- Only return if user owns it
      AND r.timestamp >= $3
      AND r.timestamp <= $4
    ORDER BY r.timestamp DESC
  `;

  const result = await pool.query(query, [monitorId, userId, startTime, endTime]);

  // If you are using 'pg', result.rows is already an array of objects.
  // You usually don't need to map it manually unless you are renaming fields.
  return result.rows as HealthCheckResult[];
};


export const deleteSystemOldResults = async (olderThan: Date): Promise<number> => {
  const query = `
    DELETE FROM health_check_results
    WHERE timestamp < $1
  `;
  const result = await pool.query(query, [olderThan]);
  return result.rowCount || 0;
};