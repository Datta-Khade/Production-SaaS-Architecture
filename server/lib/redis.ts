/**
 * Redis Client — Singleton connection for caching, sessions, and pub/sub
 *
 * Uses ioredis with automatic reconnection.
 * All cache keys MUST be tenant-scoped via tenantCacheKey().
 *
 * Redis is OPTIONAL — controlled by REDIS_ENABLED env var.
 * When disabled, getRedis() returns null and all Redis-dependent features become no-ops.
 */
import Redis from 'ioredis';
import { env } from '../env.js';
import { logger } from './logger.js';

let redisClient: Redis | null = null;

/**
 * Check if Redis is enabled via REDIS_ENABLED env var.
 */
export const isRedisEnabled = (): boolean => env.REDIS_ENABLED;

/**
 * Get the Redis client instance.
 * Returns null if Redis is disabled (REDIS_ENABLED=false).
 * Callers MUST handle null — use isRedisEnabled() to check before calling if needed.
 */
export const getRedis = (): Redis | null => {
  if (!env.REDIS_ENABLED) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (env.NODE_ENV === 'development' && times > 3) {
          logger.warn(
            'Redis reconnection disabled after 3 attempts to prevent console spam. Please start Redis if you need caching features.',
          );
          return null;
        }
        const delay = Math.min(times * 200, 3000);
        logger.warn({ attempt: times, delay }, 'Redis reconnecting...');
        return delay;
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });

    redisClient.on('error', (err) => {
      logger.error({ error: err.message }, 'Redis connection error');
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });
  }

  return redisClient;
};

/**
 * Check if Redis is healthy.
 * Returns false if Redis is disabled.
 */
export const isRedisHealthy = async (): Promise<boolean> => {
  if (!env.REDIS_ENABLED) return false;

  try {
    const redis = getRedis();
    if (!redis) return false;
    const result = await redis.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
};

/**
 * Graceful shutdown
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected');
  }
};
