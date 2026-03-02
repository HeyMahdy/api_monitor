// Repository/MonitorStatsRepo.ts

import { pool } from '../db/db_config.js';
import type { MonitorStats } from '../schema/monitor.js';

export interface OneMinuteMetricRow {
  monitor_id: string;
  bucket_time: Date;
  total_checks: number;
  total_latency: number;
}


export const upsertMonitorStats = async (stats:MonitorStats):Promise<void> => {
   
    const query = `
    INSERT INTO monitor_stats (
      monitor_id, 
      time_window,
      uptime_percentage, 
      success_rate_percentage,
      avg_response_time_ms, 
      p95_response_time_ms, 
      p99_response_time_ms,
      total_checks, 
      successful_checks, 
      failed_checks,
      last_calculated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
    )
    ON CONFLICT (monitor_id, time_window)
    DO UPDATE SET
      uptime_percentage = EXCLUDED.uptime_percentage,
      success_rate_percentage = EXCLUDED.success_rate_percentage,
      avg_response_time_ms = EXCLUDED.avg_response_time_ms,
      p95_response_time_ms = EXCLUDED.p95_response_time_ms,
      p99_response_time_ms = EXCLUDED.p99_response_time_ms,
      total_checks = EXCLUDED.total_checks,
      successful_checks = EXCLUDED.successful_checks,
      failed_checks = EXCLUDED.failed_checks,
      last_calculated_at = EXCLUDED.last_calculated_at
  `;

  const values = [
    stats.monitor_id,
    stats.time_window,
    stats.uptime_percentage,
    stats.success_rate_percentage,
    stats.avg_response_time_ms,
    stats.p95_response_time_ms,
    stats.p99_response_time_ms,
    stats.total_checks,
    stats.successful_checks,
    stats.failed_checks,
    stats.calculated_at
  ];

  await pool.query(query, values);
    
}

export const getMonitorStats = async(
  monitorId: string,
  userId: string, // <--- New Security Param
  timeWindow: '24h' | '7d' | '30d'
): Promise<MonitorStats | null> => {
  const query = `
    SELECT s.* FROM monitor_stats s
    JOIN monitors m ON s.monitor_id = m.id  -- Join to check ownership
    WHERE s.monitor_id = $1 
      AND s.time_window = $2
      AND m.user_id = $3                    -- Only return if user owns it
    ORDER BY s.calculated_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [monitorId, timeWindow, userId]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as MonitorStats;
};

/**
 * Get all stats for a monitor (Secure: checks if User owns it)
 */
export const getAllStatsForMonitor = async (
  monitorId: string,
  userId: string // <--- New Security Param
): Promise<MonitorStats[]> => {
  const query = `
    SELECT s.* FROM monitor_stats s
    JOIN monitors m ON s.monitor_id = m.id
    WHERE s.monitor_id = $1
      AND m.user_id = $2
    ORDER BY s.time_window
  `;

  const result = await pool.query(query, [monitorId, userId]);
  return result.rows as MonitorStats[];
};

/**
 * Get stats for multiple monitors (Secure: checks if User owns them)
 */
export const getStatsForMonitors = async (
  monitorIds: string[],
  userId: string, // <--- New Security Param
  timeWindow: '24h' | '7d' | '30d'
): Promise<Map<string, MonitorStats>> => {
  if (monitorIds.length === 0) {
    return new Map();
  }

  const query = `
    SELECT s.* FROM monitor_stats s
    JOIN monitors m ON s.monitor_id = m.id
    WHERE s.monitor_id = ANY($1) 
      AND s.time_window = $2
      AND m.user_id = $3
  `;

  const result = await pool.query(query, [monitorIds, timeWindow, userId]);

  const statsMap = new Map<string, MonitorStats>();
  for (const row of result.rows) {
    statsMap.set(row.monitor_id, row as MonitorStats);
  }

  return statsMap;
};

/**
 * Delete stats for a monitor (Secure: checks if User owns it)
 * Note: If you have ON DELETE CASCADE in your DB, this is auto-handled when deleting the monitor.
 */
export const deleteMonitorStats = async (
  monitorId: string,
  userId: string // <--- New Security Param
): Promise<void> => {
  const query = `
    DELETE FROM monitor_stats s
    USING monitors m
    WHERE s.monitor_id = m.id 
      AND s.monitor_id = $1 
      AND m.user_id = $2
  `;
  
  await pool.query(query, [monitorId, userId]);
};


export const one_minute_stats = async (monitorId: string , latency : number):Promise<void>=>{
  const bucketTime = new Date();
  bucketTime.setSeconds(0, 0);

  const query = `
    INSERT INTO monitor_metrics_1m (monitor_id, bucket_time, total_checks, total_latency)
    VALUES ($1, $2, 1, $3)
    ON CONFLICT (monitor_id, bucket_time)
    DO UPDATE SET
      total_checks = monitor_metrics_1m.total_checks + 1,
      total_latency = monitor_metrics_1m.total_latency + EXCLUDED.total_latency
  `;

  await pool.query(query, [monitorId, bucketTime, latency]);
}

export const getOneMinuteStatsLast24Hours = async (
  monitorId: string,
  userId: string
): Promise<OneMinuteMetricRow[]> => {
  const query = `
    SELECT
      mm.monitor_id,
      mm.bucket_time,
      mm.total_checks,
      mm.total_latency
    FROM monitor_metrics_1m mm
    JOIN monitors m ON mm.monitor_id = m.id
    WHERE mm.monitor_id = $1
      AND m.user_id = $2
      AND mm.bucket_time >= NOW() - INTERVAL '24 hours'
    ORDER BY mm.bucket_time ASC
  `;

  const result = await pool.query(query, [monitorId, userId]);

  return result.rows.map((row) => ({
    monitor_id: row.monitor_id,
    bucket_time: row.bucket_time,
    total_checks: Number(row.total_checks),
    total_latency: Number(row.total_latency),
  })) as OneMinuteMetricRow[];
};
