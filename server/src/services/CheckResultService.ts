import * as checkResultRepo from '../Repository/CheckResultRepo.js';
import type { HealthCheckResult } from '../schema/monitor.js';

export const getMonitorResults = async (
  monitorId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ results: HealthCheckResult[]; total: number; page: number; totalPages: number }> => {
  const offset = (page - 1) * limit;
  const { results, total } = await checkResultRepo.findResultsByMonitorId(monitorId, limit, offset);

  return {
    results,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};
