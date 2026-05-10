/**
 * Cache Utilities — Tenant-scoped Redis caching
 *
 * ALL cache keys MUST use tenantCacheKey() to prevent cross-tenant data leakage.
 * Never cache: file data, PII without encryption.
 *
 * When Redis is disabled (REDIS_ENABLED=false), all cache operations become no-ops:
 * - cacheGet returns null (cache miss)
 * - cacheSet, cacheInvalidate, cacheInvalidatePattern silently do nothing
 */
import { getRedis } from './redis.js';
import { logger } from './logger.js';

/**
 * Generate a tenant-scoped cache key.
 * Format: "tenant:{tenantId}:{resource}:{identifier}"
 */
export const tenantCacheKey = (tenantId: string, resource: string, identifier?: string): string => {
  const parts = ['tenant', tenantId, resource];
  if (identifier) {
    parts.push(identifier);
  }
  return parts.join(':');
};

/**
 * TTL Guidelines (seconds):
 * - User sessions:   900  (15 min — matches JWT expiry)
 * - Tenant metadata: 300  (5 min — tenantConnectionManager)
 * - List queries:    60   (invalidate on mutation)
 * - Config/settings: 600  (10 min — rarely changes)
 */
export const CACHE_TTL = {
  SESSION: 900,
  TENANT: 300,
  LIST: 60,
  CONFIG: 600,
} as const;

/**
 * Get a cached value. Returns null on cache miss, Redis failure, or Redis disabled.
 */
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const redis = getRedis();
    if (!redis) return null;
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    logger.warn(
      { key, error: (err as Error).message },
      'Cache GET failed — proceeding without cache',
    );
    return null;
  }
};

/**
 * Set a cached value with TTL (in seconds). No-op if Redis is disabled.
 */
export const cacheSet = async (key: string, value: unknown, ttlSeconds: number): Promise<void> => {
  try {
    const redis = getRedis();
    if (!redis) return;
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn(
      { key, error: (err as Error).message },
      'Cache SET failed — continuing without cache',
    );
  }
};

/**
 * Invalidate one or more cache keys. No-op if Redis is disabled.
 */
export const cacheInvalidate = async (...keys: string[]): Promise<void> => {
  try {
    const redis = getRedis();
    if (!redis) return;
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    logger.warn({ keys, error: (err as Error).message }, 'Cache INVALIDATE failed');
  }
};

/**
 * Invalidate all cache keys for a tenant + resource pattern.
 * Uses SCAN to avoid KEYS command (never use KEYS in production).
 * No-op if Redis is disabled.
 */
export const cacheInvalidatePattern = async (tenantId: string, resource: string): Promise<void> => {
  try {
    const redis = getRedis();
    if (!redis) return;
    const pattern = tenantCacheKey(tenantId, resource, '*');
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  } catch (err) {
    logger.warn(
      { tenantId, resource, error: (err as Error).message },
      'Cache pattern INVALIDATE failed',
    );
  }
};
