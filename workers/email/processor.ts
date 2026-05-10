/**
 * Email Worker — BullMQ processor for email jobs
 *
 * Processes jobs from the 'email' queue.
 * Errors are auto-retried per the queue config (3 attempts, exponential backoff).
 *
 * In Phase 1 this is a placeholder — integrate with SMTP in Phase 3+.
 */
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import pino from 'pino';
import type { EmailJobData } from './queue.js';
import { env } from '../../server/env.js';

// Worker runs as a separate process — create its own logger instance
const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.LOG_PRETTY
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
    : undefined,
  base: { service: 'email-worker' },
});

// 0. Check if Redis is enabled
if (!env.REDIS_ENABLED) {
  logger.fatal('❌ Redis is disabled via env — email worker cannot start (BullMQ requires Redis).');
  process.exit(1);
}

const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const processEmail = async (job: Job<EmailJobData>): Promise<void> => {
  const { tenantId, to, subject, from } = job.data;

  logger.info(
    { jobId: job.id, tenantId, to, subject, from: from || 'noreply@production.so' },
    'Processing email job',
  );

  // TODO: Integrate with actual SMTP transport in Phase 3+
  // Example with nodemailer:
  // const transporter = createTransport({ host: env.SMTP_HOST, ... });
  // await transporter.sendMail({ from, to, subject, html });

  // Simulate sending delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  logger.info({ jobId: job.id, to, tenantId }, 'Email sent successfully');
};

// Create worker
const worker = new Worker<EmailJobData>('email', processEmail, {
  connection: redisConnection,
  concurrency: 5, // Process up to 5 emails concurrently
  limiter: {
    max: 10, // Max 10 jobs per duration
    duration: 1000, // Per second
  },
});

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Job completed');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, 'Job failed');
});

worker.on('error', (err) => {
  logger.error({ error: err.message }, 'Worker error');
});

logger.info('Email worker started — listening for jobs');
