/**
 * Database Access Layer — Tenant-scoped Drizzle instance
 * 
 * getDb() returns the tenant-scoped Drizzle instance from AsyncLocalStorage.
 * withTransaction() wraps multi-table writes in a database transaction.
 * 
 * Rules:
 * - Every repository MUST use getDb() — never import db/pool directly
 * - Multi-table writes MUST use withTransaction()
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { logger } from '../lib/logger.js';

const { Pool } = pg;

// AsyncLocalStorage holds the current request's tenant DB connection
const dbStorage = new AsyncLocalStorage<{ db: NodePgDatabase; pool: pg.Pool }>();

// Pool cache — one pool per unique connection string (max 5 connections each)
const poolCache = new Map<string, pg.Pool>();

/**
 * Create or retrieve a connection pool for a given database URL.
 * Max 5 connections per tenant to prevent exhaustion.
 */
const getPool = (dbUrl: string): pg.Pool => {
  const existing = poolCache.get(dbUrl);
  if (existing) return existing;

  const pool = new Pool({
    connectionString: dbUrl,
    max: 5,  // Max 5 connections per tenant — PgBouncer required at scale
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    logger.error({ error: err.message }, 'Unexpected pool client error');
  });

  poolCache.set(dbUrl, pool);
  return pool;
};


/**
 * Run a callback within a scoped DB context.
 * Used by tenant middleware to wrap the entire request.
 */
export const runWithDb = <T>(dbUrl: string, fn: () => T): T => {
  const pool = getPool(dbUrl);
  const db = drizzle(pool);
  return dbStorage.run({ db, pool }, fn);
};

/**
 * Get the current request's tenant-scoped Drizzle instance.
 * EVERY repository must use this — never import db directly.
 * 
 * @throws Error if called outside a request context (no tenant resolved)
 */
export const getDb = (): NodePgDatabase => {
  const store = dbStorage.getStore();
  if (!store?.db) {
    throw new Error('Database not available — getDb() called outside request context. Ensure requireTenant middleware is applied.');
  }
  return store.db;
};

/**
 * Get the raw pg Pool for the current request's tenant.
 * Use when you need raw SQL that Drizzle doesn't support well.
 * EVERY service/repository must use this — never create your own pool.
 */
export const getRawPool = (): pg.Pool => {
  const store = dbStorage.getStore();
  if (!store?.pool) {
    throw new Error('Database pool not available — getRawPool() called outside request context.');
  }
  return store.pool;
};

/**
 * Transaction wrapper for multi-table writes.
 * Usage:
 *   return withTransaction(async (tx) => {
 *     await repo1.create(data, tx);
 *     await repo2.createRelated(data, tx);
 *   });
 */
export const withTransaction = async <T>(
  fn: (tx: NodePgDatabase) => Promise<T>
): Promise<T> => {
  const db = getDb();
  return db.transaction(async (tx) => {
    return fn(tx as unknown as NodePgDatabase);
  });
};

/**
 * Get a Drizzle instance for the master DB (used for tenant lookups).
 */
let masterDb: NodePgDatabase | null = null;
let masterPool: pg.Pool | null = null;

export const getMasterDb = (masterDbUrl: string): NodePgDatabase => {
  if (!masterDb) {
    masterPool = getPool(masterDbUrl);
    masterDb = drizzle(masterPool);
  }
  return masterDb;
};

/**
 * Check if the master DB is healthy
 */
export const isMasterDbHealthy = async (masterDbUrl: string): Promise<boolean> => {
  try {
    const pool = getPool(masterDbUrl);
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch {
    return false;
  }
};

/**
 * Graceful shutdown — close all pools
 */
export const closeAllPools = async (): Promise<void> => {
  const closePromises: Promise<void>[] = [];
  for (const [url, pool] of poolCache) {
    closePromises.push(pool.end());
    poolCache.delete(url);
  }
  await Promise.all(closePromises);
  masterDb = null;
  masterPool = null;
  logger.info('All database pools closed');
};
