import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { authenticate } from '../../middleware/auth.js';
import { requireTenant } from '../../middleware/tenant.js';
import { accessControlController } from './controller.js';

const router = Router();

/**
 * Access Control Routes
 * 
 * Flow:
 * 1. Authenticate user (JWT)
 * 2. Resolve tenant (for roleaccess lookup)
 */
router.get(
  '/api/v2/navigation',
  authenticate,
  asyncHandler(requireTenant),
  asyncHandler(accessControlController.getNavigation)
);

export default router;
