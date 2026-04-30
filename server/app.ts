/**
 * Express App Factory — Configures and returns the Express application
 * 
 * Middleware order matters:
 * 1. Security (helmet, cors)
 * 2. Body parsing (json, cookie)
 * 3. Request logging (pino-http)
 * 4. Routes
 * 5. 404 handler
 * 6. Global error handler (MUST be last)
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { globalErrorHandler } from './middleware/globalErrorHandler.js';
import { NotFoundError } from '../shared/v2/errors/index.js';
import routes from './routes.js';

export const createApp = (): express.Application => {
  const app = express();

  // ─── Security ───────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  }));
  
  app.use(cors({
    origin: env.NODE_ENV === 'production' 
      ? env.APP_URL 
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-request-id'],
  }));

  // ─── Body Parsing ──────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // ─── Request Logging ───────────────────────────────────────
  app.use(requestLogger);

  // ─── Trust proxy (for rate limiting behind nginx/LB) ───────
  app.set('trust proxy', 1);

  // ─── Routes ────────────────────────────────────────────────
  app.use(routes);

  // ─── 404 Handler ───────────────────────────────────────────
  app.use((_req, _res, next) => {
    next(new NotFoundError('Route not found'));
  });

  // ─── Global Error Handler (MUST be last) ───────────────────
  app.use(globalErrorHandler);

  return app;
};
