/**
 * Tenant Connection Manager — Resolves tenant ID to database connection
 * 
 * Flow:
 * 1. Check Redis cache for tenant metadata (TTL 5min)
 * 2. If cache miss, query master DB tenants table
 * 3. Cache result in Redis
 * 4. Return db_url for the tenant
 * 
 * Connection pools are limited to max 5 per tenant.
 */
import { eq, and } from 'drizzle-orm';
import { getMasterDb } from './db.js';
import { tenantsTable, type Tenant } from '../../shared/v2/schema/tenants.js';
import { cacheGet, cacheSet, tenantCacheKey, CACHE_TTL } from '../lib/cache.js';
import { logger } from '../lib/logger.js';
import { env } from '../env.js';

export interface TenantConnection {
  tuid: string;
  domain: string;
  dbUrl: string;
  plan: string;
  isActive: boolean;
}

/**
 * Resolve a tenant ID (tuid) to a database connection.
 * Returns null if tenant not found or inactive.
 * 
 * Cached in Redis for 5 minutes to reduce master DB load.
 */
export const getTenantConnection = async (tuid: string): Promise<TenantConnection | null> => {
  const cacheKey = tenantCacheKey('master', 'tenant', tuid);

  // 1. Check Redis cache
  const cached = await cacheGet<TenantConnection>(cacheKey);
  if (cached) {
    logger.debug({ tuid }, 'Tenant resolved from cache');
    return cached;
  }

  // 2. Query master DB
  try {
    const masterDb = getMasterDb(env.MASTER_DATABASE_URL);
    const results = await masterDb
      .select()
      .from(tenantsTable)
      .where(
        and(
          eq(tenantsTable.tuid, tuid),
          eq(tenantsTable.is_active, true),
          eq(tenantsTable.is_deleted, false)
        )
      )
      .limit(1);

    if (results.length === 0) {
      logger.warn({ tuid }, 'Tenant not found or inactive');
      return null;
    }

    const tenant: Tenant = results[0];
    const connection: TenantConnection = {
      tuid: tenant.tuid,
      domain: tenant.domain,
      dbUrl: tenant.db_url,
      plan: tenant.plan,
      isActive: tenant.is_active ?? false,
    };

    // 3. Cache in Redis (TTL 5 min)
    await cacheSet(cacheKey, connection, CACHE_TTL.TENANT);
    logger.debug({ tuid }, 'Tenant resolved from master DB and cached');

    return connection;
  } catch (err) {
    logger.error({ tuid, error: (err as Error).message }, 'Failed to resolve tenant from master DB');
    throw err;
  }
};

/**
 * Resolve a tenant by domain (e.g. "acme.production.so")
 * Used as fallback when x-tenant-id header is not present.
 */
export const getTenantByDomain = async (domain: string): Promise<TenantConnection | null> => {
  const cacheKey = tenantCacheKey('master', 'tenant-domain', domain);

  const cached = await cacheGet<TenantConnection>(cacheKey);
  if (cached) return cached;

  try {
    const masterDb = getMasterDb(env.MASTER_DATABASE_URL);
    const results = await masterDb
      .select()
      .from(tenantsTable)
      .where(
        and(
          eq(tenantsTable.domain, domain),
          eq(tenantsTable.is_active, true),
          eq(tenantsTable.is_deleted, false)
        )
      )
      .limit(1);

    if (results.length === 0) return null;

    const tenant = results[0];
    const connection: TenantConnection = {
      tuid: tenant.tuid,
      domain: tenant.domain,
      dbUrl: tenant.db_url,
      plan: tenant.plan,
      isActive: tenant.is_active ?? false,
    };

    await cacheSet(cacheKey, connection, CACHE_TTL.TENANT);
    return connection;
  } catch (err) {
    logger.error({ domain, error: (err as Error).message }, 'Failed to resolve tenant by domain');
    throw err;
  }
};
