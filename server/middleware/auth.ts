/**
 * Authentication Middleware — JWT verification + role-based access control
 * 
 * authenticate: Verify JWT from Authorization header, attach req.user
 * requireRole: Enforce minimum role level (superadmin > admin > manager > user)
 * 
 * Rules:
 * - Role checks happen ONLY in middleware, NEVER in service or repository
 * - Never derive permissions from request body — always from verified JWT
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { UnauthorizedError, ForbiddenError } from '../../shared/modules/errors/index.js';

import { accessControlRepository } from '../modules/access_control/repository.js';
import { logger } from '../lib/logger.js';

export interface JwtPayload {
  sub: string;       // userUuid
  email: string;
  role: string;      // Now dynamic from rolemaster
  domain: string;    // tenant domain — fallback tenant resolution
  iat: number;
  exp: number;
  tenantId?: string;
}

export type UserRole = 'superadmin' | 'admin' | 'manager' | 'user';

/**
 * Cached role hierarchy to avoid DB lookups on every request.
 * Maps role name -> orderby value.
 */
let roleHierarchyCache: Record<string, number> | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

const getRoleHierarchy = async (): Promise<Record<string, number>> => {
  if (roleHierarchyCache && (Date.now() - lastCacheUpdate < CACHE_TTL)) {
    return roleHierarchyCache;
  }

  try {
    const roles = await accessControlRepository.getAllRoles();
    const hierarchy: Record<string, number> = {};
    roles.forEach(r => {
      hierarchy[r.assigned_role] = r.orderby ?? 0;
    });
    roleHierarchyCache = hierarchy;
    lastCacheUpdate = Date.now();
    return hierarchy;
  } catch (err) {
    logger.error({ error: (err as Error).message }, 'Failed to fetch role hierarchy from DB');
    return {}; // Fallback to empty if DB fails
  }
};

/**
 * Verify JWT from Authorization header and attach decoded payload to req.user.
 * Throws UnauthorizedError if token is missing, invalid, or expired.
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  // Allow auth bypass in development (NEVER in production)
  if (env.AUTH_BYPASS && env.NODE_ENV === 'development') {
    req.user = {
      sub:    'dev-user-uuid',
      email:  'admin@dev.localhost',
      role:   'superadmin',
      domain: 'dev.localhost',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header');
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token has expired');
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    throw new UnauthorizedError('Authentication failed');
  }
};

/**
 * Require a minimum role level for the route.
 * Must be used AFTER authenticate middleware.
 * 
 * Usage: requireRole('admin') — allows admin and superadmin
 */
export const requireRole = (minimumRole: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const hierarchy = await getRoleHierarchy();
    const userRole = req.user.role;
    if (!userRole) {
      throw new UnauthorizedError('User role not found');
    }

    const userLevel = hierarchy[userRole];
    const requiredLevel = hierarchy[minimumRole];

    if (userLevel === undefined || userLevel < requiredLevel) {
      throw new ForbiddenError(`Insufficient permissions. Required: ${minimumRole}, Current: ${req.user.role}`);
    }

    next();
  };
};

