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
