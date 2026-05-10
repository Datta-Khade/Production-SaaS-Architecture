/**
 * Health Check Controller — OPS-1
 *
 * GET /health          → Simple alive check (load balancer probe)
 * GET /api/v2/health   → Detailed checks (DB, Redis, Queue)
 *
 * Returns 200 with { status: "healthy" } or 503 with { status: "degraded" }
 */
import { Request, Response } from 'express';
import { isMasterDbHealthy } from '../db.js';
import { isRedisHealthy } from '../../lib/redis.js';
import { env } from '../../env.js';

const startTime = Date.now();
const VERSION = process.env.npm_package_version || '1.0.0';

export const healthController = {
  /**
   * Simple alive check — for load balancers / container orchestrators.
   * Always returns 200 while the process is running.
   */
  alive: (_req: Request, res: Response): void => {
    res.json({ status: 'healthy' });
  },

  /**
   * Detailed health check — checks DB, Redis.
   * Returns 503 if any critical dependency is degraded.
   */
  check: async (_req: Request, res: Response): Promise<void> => {
    const [masterDbOk, redisOk] = await Promise.all([
      isMasterDbHealthy(env.MASTER_DATABASE_URL),
      isRedisHealthy(),
    ]);

    const allHealthy = masterDbOk; // Redis is optional
    const status = allHealthy ? 'healthy' : 'degraded';
    const statusCode = allHealthy ? 200 : 503;

    let redisStatus: string = redisOk ? 'ok' : 'error';
    if (!env.REDIS_ENABLED) {
      redisStatus = 'disabled';
    }

    res.status(statusCode).json({
      status,
      version: VERSION,
      environment: env.NODE_ENV,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks: {
        masterDb: masterDbOk ? 'ok' : 'error',
        redis: redisStatus,
      },
    });
  },
};
