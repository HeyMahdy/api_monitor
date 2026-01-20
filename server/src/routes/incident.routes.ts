import { Router } from 'express';
import * as incidentController from '../controllers/incident.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// All incident routes require authentication
router.use(authenticate);

// GET /api/incidents/open - Get all open incidents
router.get('/open', incidentController.getAllOpenIncidents);

// POST /api/incidents - Create a new incident
router.post('/', incidentController.createIncident);

// GET /api/incidents/:id - Get incident by ID
router.get('/:id', incidentController.getIncidentById);

// PATCH /api/incidents/:id/acknowledge - Acknowledge an incident
router.patch('/:id/acknowledge', incidentController.acknowledgeIncident);

// PATCH /api/incidents/:id/resolve - Resolve an incident
router.patch('/:id/resolve', incidentController.resolveIncident);

// DELETE /api/incidents/:id - Delete an incident
router.delete('/:id', incidentController.deleteIncident);

export default router;
