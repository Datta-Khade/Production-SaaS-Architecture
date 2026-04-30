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
import { UnauthorizedError, ForbiddenError } from '../../shared/v2/errors/index.js';

// Extend Express Request with user context
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export interface JwtPayload {
  sub: string;       // userUuid
  email: string;
  role: UserRole;
  domain: string;    // tenant domain — fallback tenant resolution
  iat: number;
  exp: number;
}

export type UserRole = 'superadmin' | 'admin' | 'manager' | 'user';

/**
 * Role hierarchy — higher index = more permissions
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  user:       0,
  manager:    1,
  admin:      2,
  superadmin: 3,
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
export const requireRole = (minimumRole: UserRole) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const userLevel = ROLE_HIERARCHY[req.user.role];
    const requiredLevel = ROLE_HIERARCHY[minimumRole];

    if (userLevel === undefined || userLevel < requiredLevel) {
      throw new ForbiddenError(`Insufficient permissions. Required: ${minimumRole}, Current: ${req.user.role}`);
    }

    next();
  };
};
