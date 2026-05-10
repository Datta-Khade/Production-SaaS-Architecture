/**
 * Rate Limiter — Per-tenant rate limiting using Redis sliding window
 *
 * Prevents any single tenant from overwhelming the API.
 * Configurable via RATE_LIMIT_WINDOW_MS and RATE_LIMIT_MAX env vars.
 *
 * Two variants:
 * - rateLimiter:       Fails OPEN when Redis is down (general API endpoints)
 * - strictRateLimiter: Fails CLOSED when Redis is down (auth endpoints like login)
 */
import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../lib/redis.js';
import { env } from '../env.js';
import { RateLimitError } from '../../shared/modules/errors/index.js';
import { logger } from '../lib/logger.js';

/**
 * Create a rate limiter middleware with configurable fail behavior.
 *
 * @param failClosed - If true, block requests when Redis is unavailable (use for auth endpoints).
 *                     If false, allow requests through when Redis is unavailable (use for general API).
 */
const createRateLimiter = (failClosed: boolean) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenantId || 'anonymous';
    const windowMs = env.RATE_LIMIT_WINDOW_MS;
    const maxRequests = env.RATE_LIMIT_MAX;

    try {
      const redis = getRedis();
      if (!redis) {
        return next();
      }

      const key = `ratelimit:${tenantId}:${req.path}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Sliding window using sorted set
      const pipeline = redis.pipeline();
      pipeline.zremrangebyscore(key, 0, windowStart); // Remove expired entries
      pipeline.zadd(key, now, `${now}`); // Add current request
      pipeline.zcard(key); // Count requests in window
      pipeline.expire(key, Math.ceil(windowMs / 1000)); // Set TTL

      const results = await pipeline.exec();
      const requestCount = (results?.[2]?.[1] as number) || 0;

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requestCount));
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));

      if (requestCount > maxRequests) {
        logger.warn({ tenantId, path: req.path, requestCount, maxRequests }, 'Rate limit exceeded');
        throw new RateLimitError('Too many requests. Please try again later.');
      }

      next();
    } catch (err) {
      if (err instanceof RateLimitError) {
        throw err;
      }

      if (failClosed) {
        // Auth endpoints: block requests when Redis is unavailable (fail-closed)
        logger.error(
          { error: (err as Error).message, path: req.path },
          'Rate limiter Redis error — blocking request (fail-closed)',
        );
        throw new RateLimitError('Service temporarily unavailable. Please try again later.');
      }

      // General endpoints: allow requests through when Redis fails (fail-open)
      logger.warn(
        { error: (err as Error).message },
        'Rate limiter Redis error — allowing request (fail-open)',
      );
      next();
    }
  };
};

/**
 * Standard rate limiter — fails OPEN when Redis is unavailable.
 * Use for general API endpoints where availability is prioritized.
 */
export const rateLimiter = createRateLimiter(false);

/**
 * Strict rate limiter — fails CLOSED when Redis is unavailable.
 * Use for auth endpoints (login, forgot-password) where brute-force protection is critical.
 */
export const strictRateLimiter = createRateLimiter(true);
