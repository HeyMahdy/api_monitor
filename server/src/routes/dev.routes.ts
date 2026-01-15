import { Router } from 'express';
import * as devController from '../controllers/dev.controller.js';

const router = Router();

// Endpoint to clear the database - ONLY FOR DEVELOPMENT
router.post('/clear-db', devController.clearDatabase);

export default router;
