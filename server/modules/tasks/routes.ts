/**
 * Tasks Routes
 */
import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { requireTenant } from '../../middleware/tenant.js';
import { tasksController } from './controller.js';

const router = Router();

// Apply auth and tenant middleware to all task routes
router.use('/api/v2/tasks', authenticate, asyncHandler(requireTenant));

router.get('/api/v2/tasks', asyncHandler(tasksController.list));
router.post('/api/v2/tasks', asyncHandler(tasksController.create));
router.get('/api/v2/tasks/:id', asyncHandler(tasksController.get));
router.put('/api/v2/tasks/:id', asyncHandler(tasksController.update));
router.delete('/api/v2/tasks/:id', asyncHandler(tasksController.delete));

export default router;
