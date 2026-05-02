/**
 * Auth Routes — All authentication endpoints
 *
 * POST /api/v2/auth/login           — Public, rate-limited
 * POST /api/v2/auth/refresh         — Public
 * GET  /api/v2/auth/profile         — Protected
 * POST /api/v2/auth/change-password — Protected
 * POST /api/v2/auth/logout          — Public (clears cookie)
 */
import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { rateLimiter } from '../../middleware/rateLimiter.js';
import { authenticate } from '../../middleware/auth.js';
import { authController } from './controller.js';

import { requireTenant } from '../../middleware/tenant.js';

const router = Router();

// Public — rate-limited to prevent brute force
router.post('/api/v2/auth/login',   asyncHandler(rateLimiter), asyncHandler(authController.login));
router.post('/api/v2/auth/refresh', asyncHandler(requireTenant), asyncHandler(authController.refresh));
router.post('/api/v2/auth/logout',  asyncHandler(requireTenant), asyncHandler(authController.logout));
router.post('/api/v2/auth/forgot-password', asyncHandler(authController.forgotPassword));
router.post('/api/v2/auth/reset-password',  asyncHandler(authController.resetPassword));

// Protected — require valid JWT
router.get( '/api/v2/auth/profile',         authenticate, asyncHandler(authController.profile));
router.post('/api/v2/auth/change-password', authenticate, asyncHandler(authController.changePassword));

export default router;
