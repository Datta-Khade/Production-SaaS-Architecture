/**
 * Health Routes — OPS-1
 *
 * GET /health        — Simple alive probe (load balancer, Docker HEALTHCHECK)
 * GET /api/v2/health — Detailed health with dependency checks
 */
import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { healthController } from './controller.js';

const router = Router();

// Simple probe — always fast, no DB hit
router.get('/health', healthController.alive);

// Detailed check
router.get('/api/v2/health', asyncHandler(healthController.check));

export default router;
