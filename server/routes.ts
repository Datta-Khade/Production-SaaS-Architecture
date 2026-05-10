/**
 * Master Route Registry — All module routes are mounted here
 *
 * Rules:
 * - Every new module's routes.ts MUST be imported and mounted here
 * - Health check is always first (no auth)
 * - All other routes go through auth + tenant middleware
 */
import { Router } from 'express';
import healthRoutes from './modules/health/routes.js';
import authRoutes from './modules/auth/routes.js';
import taskRoutes from './modules/tasks/routes.js';
import accessControlRoutes from './modules/access_control/routes.js';
import usersRoutes from './modules/users/routes.js';

const router = Router();

// Public routes (no auth required)
router.use(healthRoutes);
router.use(authRoutes);

// Authenticated module routes will be added here as modules are built
router.use(taskRoutes);
router.use(accessControlRoutes);
router.use(usersRoutes);

export default router;
