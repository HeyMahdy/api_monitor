import * as incidentRepo from '../Repository/IncidentRepo.js';
import type { Incident, CreateIncidentInput, IncidentStatus } from '../schema/incident.js';
import type { HealthCheckResult } from '../schema/health.js';
import {NotifyIncidentCreated,NotifyIncidentAcknowledged,NotifyIncidentResolved} from '../services/alert.service.js'
/**
 * Create a new incident
 */
export const createIncident = async (data: CreateIncidentInput): Promise<any> => {
    const rows = await incidentRepo.createIncident(data);
    await NotifyIncidentCreated(data.monitor_id,rows)
    return rows;
};

/**
 * Get incidents with filters
 */
export const listIncidents = async (
    filters: {
        monitor_id?: string;
        status?: IncidentStatus;
        severity?: string;
    },
    limit: number = 50,
    offset: number = 0
): Promise<Incident[]> => {
    return await incidentRepo.findIncidents(filters, limit, offset);
};

/**
 * Get incident by ID
 */
export const getIncidentById = async (id: string): Promise<Incident | null> => {
    // Note: IncidentRepo.findIncidents can be used if we want more control,
    // but here we just need one by monitor_id or similar if id is monitor_id
    const incidents = await incidentRepo.findIncidents({ monitor_id: id }, 1, 0);
    return incidents[0] || null;
};

/**
 * Get all incidents for a specific monitor with pagination
 */
export const getMonitorIncidents = async (
    monitorId: string,
    limit: number = 50,
    offset: number = 0
): Promise<Incident[]> => {
    return await incidentRepo.findIncidentsByMonitorId(monitorId, limit, offset);
};

/**
 * Get the latest open incident for a monitor
 */
export const getLatestOpenIncident = async (monitorId: string): Promise<Incident | null> => {
    return await incidentRepo.findLatestOpenIncident(monitorId);
};

/**
 * Acknowledge an incident
 */
export const acknowledgeIncident = async (id: string): Promise<Incident | null> => {
    const rows = await incidentRepo.updateIncidentStatus(id,"ACKNOWLEDGED");
    console.log(rows);
    await NotifyIncidentAcknowledged(rows);
    return rows;
};

/**
 * Resolve an incident
 */
export const resolveIncident = async (id: string): Promise<Incident | null> => {
    const rows = await incidentRepo.updateIncidentStatus(id,"RESOLVED")
    await NotifyIncidentResolved(rows)
    return rows;
};




/**
 * Increment failure count for an existing incident
 */
export const incrementIncidentFailures = async (id: number): Promise<Incident | null> => {
    return await incidentRepo.incrementFailureCount(id);
};

/**
 * Get all open incidents across all monitors
 */
export const getAllOpenIncidents = async (): Promise<Incident[]> => {
    return await incidentRepo.findAllOpenIncidents();
};

/**
 * Delete an incident
 */
export const deleteIncident = async (id: string): Promise<boolean> => {
    return await incidentRepo.deleteIncident(id);
};

/**
 * Handle a monitor failure - create new incident or update existing one
 */
export const handleMonitorFailure = async (
    monitorId: string,
    data: HealthCheckResult
): Promise<any> => {
    const existingIncident = await incidentRepo.findLatestOpenIncident(monitorId);

    if (existingIncident) {
        const updated = await incidentRepo.incrementFailureCount(existingIncident.id);
        if (!updated) {
            throw new Error('Failed to update incident');
        }
        return updated;
    } else {
        return await createIncident({
            monitor_id: monitorId,
            status: "OPEN",
            severity: "CRITICAL",
            failure_count: 1,
            error_message: data.error_message
        });
    }
};

/**
 * Handle a monitor recovery - resolve open incidents
 */
export const handleMonitorRecovery = async (monitorId: string): Promise<boolean> => {
    const openIncident = await incidentRepo.findLatestOpenIncident(monitorId);

    if (openIncident) {
        const resolved = await incidentRepo.updateIncidentStatus(openIncident.monitor_id, 'RESOLVED');
        return !!resolved;
    }

    return false;
};
