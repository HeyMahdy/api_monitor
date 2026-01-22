import { Router } from 'express';
import * as alertChannelController from '../controllers/alertChannel.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// All alert channel routes require authentication
router.use(authenticate);

// GET /api/v1/alert-channels - List alert channels
router.get('/', alertChannelController.listAlertChannels);

// POST /api/v1/alert-channels - Create a new alert channel
router.post('/', alertChannelController.createAlertChannel);

// PATCH /api/v1/alert-channels/:id - Update an alert channel
router.patch('/:id', alertChannelController.updateAlertChannel);

// DELETE /api/v1/alert-channels/:id - Delete an alert channel
router.delete('/:id', alertChannelController.deleteAlertChannel);

// POST /api/v1/alert-channels/:id/test - Test an alert channel
router.post('/:id/test', alertChannelController.testAlertChannel);

export default router;
