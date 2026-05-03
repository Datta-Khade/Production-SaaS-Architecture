/**
 * Users Routes — Admin endpoints for user management
 */
import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { requireTenant } from '../../middleware/tenant.js';
import { usersController } from './controller.js';

const router = Router();

// All user management routes require authentication and tenant context
router.use('/api/v2/admin/users', authenticate, asyncHandler(requireTenant));

router.get('/api/v2/admin/users', asyncHandler(usersController.getAll));
router.get('/api/v2/admin/users/:uuid', asyncHandler(usersController.getOne));
router.post('/api/v2/admin/users', asyncHandler(usersController.create));
router.patch('/api/v2/admin/users/:uuid', asyncHandler(usersController.update));
router.delete('/api/v2/admin/users/:uuid', asyncHandler(usersController.delete));

export default router;
