/**
 * Tenant Middleware — Resolve x-tenant-id header to a scoped DB connection
 * 
 * Flow:
 * 1. Extract x-tenant-id from header OR domain claim from JWT
 * 2. tenantConnectionManager looks up tuid → db_url (cached in Redis, TTL 5min)
 * 3. Attaches tenant-scoped DB connection to request context
 * 4. ALL subsequent queries in that request use this tenant-scoped connection
 */
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, NotFoundError } from '../../shared/modules/errors/index.js';
import { getTenantConnection, getTenantByDomain } from '../modules/tenantConnectionManager.js';
import { runWithDb } from '../modules/db.js';
import { env } from '../env.js';


/**
 * Resolve tenant from request headers or JWT domain claim.
 * In single-tenant mode (dev), uses DATABASE_URL directly.
 */
export const requireTenant = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  // Single-tenant mode (Replit / local dev)
  if (!env.MULTI_TENANT) {
    req.tenantId = 'dev-tenant';
    if (env.DATABASE_URL) {
      return runWithDb(env.DATABASE_URL, next);
    }
    return next();
  }

  // Multi-tenant: resolve from header or JWT
  const tenantId = req.headers['x-tenant-id'] as string | undefined;
  const tenantDomain = req.headers['x-tenant-domain'] as string | undefined;

  if (!tenantId && !tenantDomain) {
    throw new UnauthorizedError('Missing x-tenant-id or x-tenant-domain header');
  }

  try {
    let connection;
    if (tenantDomain) {
      connection = await getTenantByDomain(tenantDomain);
    } else if (tenantId) {
      connection = await getTenantConnection(tenantId);
    }

    if (!connection) {
      throw new NotFoundError(`Tenant not found: ${tenantDomain || tenantId}`);
    }

    req.tenantId = connection.tuid;
    return runWithDb(connection.dbUrl, next);
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof UnauthorizedError) {
      throw err;
    }
    throw new Error(`Failed to resolve tenant: ${(err as Error).message}`);
  }
};
