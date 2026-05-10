/**
 * Request Logger — Pino HTTP middleware with tenant + correlation context
 *
 * Every log line automatically includes:
 * { timestamp, level, tenantId, requestId, userId, method, path, statusCode, responseTime }
 */
import pinoHttp from 'pino-http';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger.js';
import { env } from '../env.js';

export const requestLogger = pinoHttp({
  logger: logger.child({ name: 'express' }),

  // Generate a unique request ID for correlation
  genReqId: (req) => {
    const existingId = req.headers['x-request-id'] as string;
    return existingId || uuidv4();
  },

  // Enrich every log line with tenant and user context
  customProps: (req) => ({
    tenantId: (req as any).tenantId || 'unknown',
    userId: (req as any).user ? (req as any).user.sub : 'anonymous',
  }),

  // Custom log message format
  customSuccessMessage: (req, res, responseTime) => {
    return `${req.method} ${req.url} ${res.statusCode} in ${responseTime}ms`;
  },

  customErrorMessage: (req, res, responseTime) => {
    return `${req.method} ${req.url} ${res.statusCode} in ${responseTime}ms`;
  },

  // Don't log health check requests or Vite noise (too noisy)
  autoLogging: env.LOG_HTTP_REQUESTS
    ? {
        ignore: (req) => {
          const noisyPaths = ['/api/health', '/@vite/client', '/src/', '/node_modules/'];
          return noisyPaths.some((path) => req.url?.includes(path));
        },
      }
    : false,

  // Custom serializers to reduce log size
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-tenant-id': req.headers['x-tenant-id'],
        'content-type': req.headers['content-type'],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});
