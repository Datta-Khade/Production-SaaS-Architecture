/**
 * Redis Client — Singleton connection for caching, sessions, and pub/sub
 * 
 * Uses ioredis with automatic reconnection.
 * All cache keys MUST be tenant-scoped via tenantCacheKey().
 */
import Redis from 'ioredis';
import { env } from '../env.js';
import { logger } from './logger.js';

let redisClient: Redis | null = null;

export const getRedis = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (env.NODE_ENV === 'development' && times > 3) {
          logger.warn('Redis reconnection disabled after 3 attempts to prevent console spam. Please start Redis if you need caching features.');
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
 * Check if Redis is healthy
 */
export const isRedisHealthy = async (): Promise<boolean> => {
  try {
    const redis = getRedis();
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
