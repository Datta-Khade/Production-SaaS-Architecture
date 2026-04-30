/**
 * Pino Logger — Structured JSON logging with tenant context
 * 
 * NEVER use console.log in server code — always use logger or req.log
 * Every log line automatically includes: timestamp, level, tenantId, requestId, userId
 */
import pino from 'pino';
import { env } from '../env.js';

const transport = env.LOG_PRETTY
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    }
  : undefined;

export const logger = pino({
  level: env.LOG_LEVEL,
  transport,
  base: {
    env: env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  // Redact sensitive fields from logs
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
    censor: '[REDACTED]',
  },
});

/**
 * Create a child logger with tenant context
 */
export const createTenantLogger = (tenantId: string, requestId?: string) => {
  return logger.child({
    tenantId,
    ...(requestId && { requestId }),
  });
};
