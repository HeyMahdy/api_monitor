import { Router } from 'express';
import * as monitorController from '../controllers/monitor.controller.js'; 
import * as checkResultController from '../controllers/checkResult.controller.js';
import * as incidentController from '../controllers/incident.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js'; // Adjust path if needed

const router = Router();

// Apply Authentication Middleware to all routes below
// This ensures req.user is populated before the controller runs
router.use(authenticate);

// --- Define Endpoints ---

// Create a new monitor
// POST /api/monitors
router.post('/', monitorController.createMonitor);

// Get all monitors for the current user
// GET /api/monitors
router.get('/', monitorController.getUserMonitors);

// Get global health summary for current user
// GET /api/monitors/health/summary
router.get('/health/summary', monitorController.getGlobalHealthSummary);

// Get a specific monitor by ID
// GET /api/monitors/:id
router.get('/:id', monitorController.getMonitor);

// Update a monitor (Partial update)
// PATCH /api/monitors/:id
router.patch('/:id', monitorController.updateMonitor);

// Delete a monitor
// DELETE /api/monitors/:id
router.delete('/:id', monitorController.deleteMonitor);


router.post("/start/:id",monitorController.activeMonitor)
router.post("/pause/:id",monitorController.pauseMonitor)
router.post("/resume/:id",monitorController.resumeMonitor)

// Get monitor check history (paginated)
// GET /api/monitors/:id/history
router.get('/:id/history', checkResultController.getMonitorHistory);

// Get monitor stats (all windows)
// GET /api/monitors/:id/stats
router.get('/:id/stats', monitorController.getMonitorStats);

// Get monitor 1-minute metrics for the last 24 hours
// GET /api/monitors/:id/stats/1m
router.get('/:id/stats/1m', monitorController.getMonitorOneMinuteStatsLast24Hours);

// Get monitor performance summary (RPM, peak RPM, latency classes) for last 24h
// GET /api/monitors/:id/stats/performance
router.get('/:id/stats/performance', monitorController.getMonitorPerformanceLast24Hours);

// Get monitor incidents (paginated)
// GET /api/monitors/:monitorId/incidents
router.get('/:monitorId/incidents', incidentController.getMonitorIncidents);

export default router;
