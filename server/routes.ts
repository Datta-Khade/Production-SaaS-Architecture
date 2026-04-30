/**
 * Master Route Registry — All module routes are mounted here
 * 
 * Rules:
 * - Every new module's routes.ts MUST be imported and mounted here
 * - Health check is always first (no auth)
 * - All other routes go through auth + tenant middleware
 */
import { Router } from 'express';
import healthRoutes from './v2/health/routes.js';
import authRoutes from './v2/auth/routes.js';
import taskRoutes from './v2/tasks/routes.js';

const router = Router();

// Public routes (no auth required)
router.use(healthRoutes);
router.use(authRoutes);

// Authenticated module routes will be added here as modules are built
router.use(taskRoutes);

export default router;
