/**
 * Async Handler — Wraps async route handlers to catch promise rejections
 *
 * Without this, unhandled promise rejections in async handlers would crash the process.
 * This forwards all errors to Express's next() → globalErrorHandler.
 */
import { Request, Response, NextFunction, RequestHandler } from 'express';

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
