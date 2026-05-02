/**
 * Global Error Handler — Catches ALL thrown errors and formats consistent JSON responses
 * 
 * Rules:
 * - Custom error classes (AppError subclasses) map to their statusCode
 * - Unknown errors always return 500
 * - Stack traces NEVER sent to client
 * - All errors are logged with full context
 */
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/modules/errors/index.js';
import { logger } from '../lib/logger.js';

interface ErrorResponse {
  success: false;
  code: string;
  message: string;
}

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Determine if this is an operational (known) error
  const isOperational = err instanceof AppError && err.isOperational;
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';

  // Log the error
  if (statusCode >= 500) {
    logger.error({
      err,
      method: req.method,
      path: req.path,
      statusCode,
      tenantId: (req as any).tenantId,
      userId: (req as any).user ? (req as any).user.sub : undefined,
    }, `[${statusCode}] ${err.message}`);
  } else {
    logger.warn({
      code,
      message: err.message,
      method: req.method,
      path: req.path,
      statusCode,
    }, `[${statusCode}] ${err.message}`);
  }

  // Build response — NEVER include stack traces
  const response: ErrorResponse = {
    success: false,
    code,
    message: isOperational ? err.message : 'An unexpected error occurred',
  };

  res.status(statusCode).json(response);
};

