/**
 * Request Logger — Pino HTTP middleware with tenant + correlation context
 * 
 * Every log line automatically includes:
 * { timestamp, level, tenantId, requestId, userId, method, path, statusCode, responseTime }
 */
import pinoHttp from 'pino-http';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger.js';

export const requestLogger = pinoHttp({
  logger,
  
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
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} → ${res.statusCode}`;
  },

  customErrorMessage: (req, res) => {
    return `${req.method} ${req.url} → ${res.statusCode}`;
  },

  // Don't log health check requests (too noisy)
  autoLogging: {
    ignore: (req) => req.url === '/api/health',
  },

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
