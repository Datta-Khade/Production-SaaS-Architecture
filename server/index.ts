/**
 * Server Entry Point — Bootstrap and start
 * 
 * Startup sequence:
 * 1. Validate environment variables (env.ts — the boot gate)
 * 2. Connect to Redis
 * 3. Run pending migrations on master DB
 * 4. Create Express app
 * 5. Start listening
 * 
 * Graceful shutdown on SIGTERM/SIGINT.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { env } from './env.js';
import { logger } from './lib/logger.js';

// ── Global Error Handling (OPS-2) ────────────────────────────
process.on('uncaughtException', (err: Error) => {
  logger.fatal({ err, message: err.message, stack: err.stack }, 'Uncaught Exception — crashing safely');
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.fatal({ reason }, 'Unhandled Rejection — crashing safely');
  process.exit(1);
});

import { getRedis, closeRedis } from './lib/redis.js';
import { closeAllPools } from './modules/db.js';
import { runMigrations } from './modules/migrationRunner.js';
import { createApp } from './app.js';
import { setupVite, serveStatic, log } from './vite.js';

const start = async (): Promise<void> => {
  logger.info({ env: env.NODE_ENV, port: env.PORT }, '🚀 Starting production-app server...');

  // 1. Connect to Redis
  try {
    const redis = getRedis();
    await redis.connect();
    logger.info('✅ Redis connected');
  } catch (err) {
    logger.warn({ error: (err as Error).message }, '⚠️ Redis connection failed — continuing without cache');
  }

  // 2. Run pending migrations on master DB
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  try {
    await runMigrations(env.MASTER_DATABASE_URL, path.resolve(__dirname, '../migrations', 'master'));
    logger.info('✅ Master DB migrations complete');
  } catch (err) {
    logger.error({ error: (err as Error).message }, '❌ Migration failed — server will not start');
    process.exit(1);
  }

  // 3. Create Express app
  const app = createApp();
  const server = createServer(app);

  // 4. Setup Frontend (Dev Middleware or Static Serving)
  if (app.get("env") === "development") {
    await setupVite(app, server);
    log('✨ Vite dev middleware enabled');
  } else {
    serveStatic(app);
    log('📁 Serving static frontend from dist/public');
  }

  // 5. Start listening
  const port = parseInt(process.env.PORT || "5005", 10);
  const url = process.env.APP_URL;
  const multiTenant = process.env.MULTI_TENANT;
  const authBypass = process.env.AUTH_BYPASS;

  const httpServer = server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
    log(` Environment variables: ${url} multiTenant: ${multiTenant} authBypass: ${authBypass}`)
  });

  // ─── Graceful Shutdown ──────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, `${signal} received — shutting down gracefully...`);

    httpServer.close(async () => {
      logger.info('HTTP server closed');

      await Promise.allSettled([
        closeRedis(),
        closeAllPools(),
      ]);

      logger.info('All connections closed — exiting');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Catch unhandled rejections — log and continue (don't crash)
  process.on('unhandledRejection', (reason) => {
    logger.error({ error: reason }, 'Unhandled promise rejection');
  });

  process.on('uncaughtException', (err) => {
    logger.fatal({ error: err.message, stack: err.stack }, 'Uncaught exception — shutting down');
    process.exit(1);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
