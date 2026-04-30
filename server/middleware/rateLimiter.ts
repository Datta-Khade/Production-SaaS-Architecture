/**
 * Rate Limiter — Per-tenant rate limiting using Redis sliding window
 * 
 * Prevents any single tenant from overwhelming the API.
 * Configurable via RATE_LIMIT_WINDOW_MS and RATE_LIMIT_MAX env vars.
 */
import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../lib/redis.js';
import { env } from '../env.js';
import { RateLimitError } from '../../shared/v2/errors/index.js';
import { logger } from '../lib/logger.js';

/**
 * Rate limit per tenant using Redis sliding window counter.
 * Falls back to allowing requests if Redis is unavailable.
 */
export const rateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const tenantId = req.tenantId || 'anonymous';
  const windowMs = env.RATE_LIMIT_WINDOW_MS;
  const maxRequests = env.RATE_LIMIT_MAX;

  try {
    const redis = getRedis();
    const key = `ratelimit:${tenantId}:${req.path}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Sliding window using sorted set
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);   // Remove expired entries
    pipeline.zadd(key, now, `${now}`);                 // Add current request
    pipeline.zcard(key);                                // Count requests in window
    pipeline.expire(key, Math.ceil(windowMs / 1000));   // Set TTL

    const results = await pipeline.exec();
    const requestCount = results?.[2]?.[1] as number || 0;

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
    // If Redis fails, allow the request through (fail-open)
    logger.warn({ error: (err as Error).message }, 'Rate limiter Redis error — allowing request');
    next();
  }
};
