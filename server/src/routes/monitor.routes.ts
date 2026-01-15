import { Router } from 'express';
import * as monitorController from '../controllers/monitor.controller.js'; 
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

export default router;