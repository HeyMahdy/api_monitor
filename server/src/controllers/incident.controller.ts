import type { Request, Response } from 'express';
import * as incidentService from '../services/incident.service.js';
import { CreateIncidentSchema } from '../schema/incident.js';

/**
 * Create a new incident
 * POST /api/incidents
 */
export const createIncident = async (req: Request, res: Response) => {
    try {
        const data = CreateIncidentSchema.parse(req.body);
        const incident = await incidentService.createIncident(data);
        res.status(201).json(incident);
    } catch (error: any) {
        console.error('Error creating incident:', error);
        res.status(500).json({ error: error.message || 'Failed to create incident' });
    }
};

/**
 * Get incident by ID (ID is monitor_id string)
 * GET /api/incidents/:id
 */
export const getIncidentById = async (req: Request, res: Response) => {
    try {
        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) || '';
        const incident = await incidentService.getIncidentById(id);

        if (!incident) {
            return res.status(404).json({ error: 'Incident not found' });
        }

        res.status(200).json(incident);
    } catch (error: any) {
        console.error(`Error fetching incident ${req.params.id}:`, error);
        res.status(500).json({ error: error.message || 'Failed to fetch incident' });
    }
};

/**
 * Get all incidents for a monitor
 * GET /api/monitors/:monitorId/incidents
 */
export const getMonitorIncidents = async (req: Request, res: Response) => {
    try {
        const monitorId = req.params.monitorId || '';
        const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
        const offsetParam = Array.isArray(req.query.offset) ? req.query.offset[0] : req.query.offset;
        const limit = parseInt((typeof limitParam === 'string' ? limitParam : '50'));
        const offset = parseInt((typeof offsetParam === 'string' ? offsetParam : '0'));

        const incidents = await incidentService.getMonitorIncidents(typeof monitorId === 'string' ? monitorId : '', limit, offset);

        res.status(200).json({
            incidents,
            pagination: {
                limit,
                offset,
                count: incidents.length,
            },
        });
    } catch (error: any) {
        console.error(`Error fetching incidents for monitor ${req.params.monitorId}:`, error);
        res.status(500).json({ error: error.message || 'Failed to fetch incidents' });
    }
};

/**
 * Get all open incidents
 * GET /api/incidents/open
 */
export const getAllOpenIncidents = async (req: Request, res: Response) => {
    try {
        const incidents = await incidentService.getAllOpenIncidents();
        res.status(200).json(incidents);
    } catch (error: any) {
        console.error('Error fetching open incidents:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch open incidents' });
    }
};

/**
 * Acknowledge an incident (by monitor_id string)
 * PATCH /api/incidents/:id/acknowledge
 */
export const acknowledgeIncident = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const incident = await incidentService.acknowledgeIncident(id);

        if (!incident) {
            return res.status(404).json({ error: 'No open incident found for this monitor' });
        }

        res.status(200).json(incident);
    } catch (error: any) {
        console.error(`Error acknowledging incident ${req.params.id}:`, error);
        res.status(500).json({ error: error.message || 'Failed to acknowledge incident' });
    }
};

/**
 * Resolve an incident (by monitor_id string)
 * PATCH /api/incidents/:id/resolvejjjm5ph 55h 55h7p7j hh7okh 5 gj8g
 */
export const resolveIncident = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const incident = await incidentService.resolveIncident(id);

        if (!incident) {
            return res.status(404).json({ error: 'No open incident found for this monitor' });
        }

        res.status(200).json(incident);
    } catch (error: any) {
        console.error(`Error resolving incident ${req.params.id}:`, error);
        res.status(500).json({ error: error.message || 'Failed to resolve incident' });
    }
};

/**
 * Delete an incident (by monitor_id string)
 * DELETE /api/incidents/:id
 */
export const deleteIncident = async (req: Request, res: Response) => {
    try {
        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) || '';
        const deleted = await incidentService.deleteIncident(id);

        if (!deleted) {
            return res.status(404).json({ error: 'Incident not found' });
        }

        res.status(200).json({ message: 'Incident deleted successfully' });
    } catch (error: any) {
        console.error(`Error deleting incident ${req.params.id}:`, error);
        res.status(500).json({ error: error.message || 'Failed to delete incident' });
    }
};

/**
 * List incidents with filters
 * GET /api/v1/incidents
 */
export const listIncidentsV1 = async (req: Request, res: Response) => {
    try {
        const monitor_id = Array.isArray(req.query.monitor_id) ? (req.query.monitor_id[0] as string) : (req.query.monitor_id as string);
        const status = Array.isArray(req.query.status) ? (req.query.status[0] as any) : (req.query.status as any);
        const severity = Array.isArray(req.query.severity) ? (req.query.severity[0] as string) : (req.query.severity as string);

        const filters = { monitor_id, status, severity };
        
        const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
        const offsetParam = Array.isArray(req.query.offset) ? req.query.offset[0] : req.query.offset;
        const limit = parseInt((typeof limitParam === 'string' ? limitParam : '50'));
        const offset = parseInt((typeof offsetParam === 'string' ? offsetParam : '0'));

        const incidents = await incidentService.listIncidents(filters, limit, offset);
        res.status(200).json(incidents);
    } catch (error: any) {
        console.error('Error listing incidents:', error);
        res.status(500).json({ error: error.message || 'Failed to list incidents' });
    }
};

/**
 * Get incident details by monitor ID
 * GET /api/v1/incidents/:id
 */
export const getIncidentDetailsV1 = async (req: Request, res: Response) => {
    try {
        const monitorId = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) || '';
        const incident = await incidentService.getLatestOpenIncident(monitorId);
        
        if (!incident) {
            // If no open incident, get the latest one in general
            const incidents = await incidentService.getMonitorIncidents(monitorId, 1, 0);
            if (incidents.length === 0) {
                return res.status(404).json({ error: 'No incidents found for this monitor' });
            }
            return res.status(200).json(incidents[0]);
        }

        res.status(200).json(incident);
    } catch (error: any) {
        console.error(`Error fetching incident details for monitor ${req.params.id}:`, error);
        res.status(500).json({ error: error.message || 'Failed to fetch incident details' });
    }
};

