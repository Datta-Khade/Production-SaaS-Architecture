/**
 * Email Queue — BullMQ queue definition with retry config
 *
 * Enqueue from service layer — return 202 Accepted immediately.
 * NEVER send emails inline in request handlers.
 */
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../../server/env.js';
import { logger } from '../../server/lib/logger.js';

let redisConnection: IORedis | null = null;
let emailQueue: Queue<EmailJobData> | null = null;

const getQueue = () => {
  if (!env.REDIS_ENABLED) return null;

  if (!emailQueue) {
    redisConnection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });

    emailQueue = new Queue<EmailJobData>('email', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });
  }
  return emailQueue;
};

export interface EmailJobData {
  tenantId: string;
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Enqueue an email for sending.
 * Call this from service layer — never from controllers.
 * No-op if Redis is disabled.
 */
export const enqueueEmail = async (data: EmailJobData): Promise<void> => {
  const queue = getQueue();
  if (!queue) {
    logger.warn(
      { to: data.to, subject: data.subject },
      '⚠️ Redis disabled — cannot enqueue email. Sending inline or logging instead is recommended.',
    );
    return;
  }

  await queue.add('send-email', data, {
    priority: 1,
  });
};
