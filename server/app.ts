/**
 * Express App Factory — Configures and returns the Express application
 *
 * Middleware order matters:
 * 1. API Docs (before Helmet — avoids CSP conflicts with Swagger UI)
 * 2. Security (helmet, cors)
 * 3. Body parsing (json, cookie)
 * 4. Request logging (pino-http)
 * 5. Routes
 * 6. 404 handler
 * 7. Global error handler (MUST be last)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import { env } from './env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { globalErrorHandler } from './middleware/globalErrorHandler.js';
import routes from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load OpenAPI spec once at startup — fail loudly if the file is missing
const specPath = path.resolve(__dirname, '../docs/openapi.yaml');
const swaggerSpec = yaml.load(fs.readFileSync(specPath, 'utf8')) as object;

export const createApp = (): express.Application => {
  const app = express();

  // ─── API Docs (/api/v2/docs) ─────────────────────────────────
  // Mounted BEFORE Helmet so Swagger UI's inline scripts are not
  // blocked by Content-Security-Policy headers.
  // In production, consider placing this behind an IP allowlist or
  // basic-auth middleware.
  app.use(
    '/api/v2/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Production SaaS API Docs',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: env.NODE_ENV !== 'production',
      },
    }),
  );

  // Serve the raw OpenAPI spec as JSON for tooling (Postman, code-gen, etc.)
  app.get('/api/v2/docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });

  // ─── Security ───────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    }),
  );

  app.use(
    cors({
      origin:
        env.NODE_ENV === 'production'
          ? env.APP_URL
          : ['http://localhost:5173', 'http://localhost:3000', env.APP_URL],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'x-tenant-id',
        'x-tenant-domain',
        'x-request-id',
      ],
    }),
  );

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

  // ─── Global Error Handler (MUST be last) ───────────────────
  app.use(globalErrorHandler);

  return app;
};
