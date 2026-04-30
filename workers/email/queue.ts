/**
 * Email Queue — BullMQ queue definition with retry config
 * 
 * Enqueue from service layer — return 202 Accepted immediately.
 * NEVER send emails inline in request handlers.
 */
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export interface EmailJobData {
  tenantId: string;
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export const emailQueue = new Queue<EmailJobData>('email', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,  // Keep last 100 completed
    removeOnFail: 500,      // Keep last 500 failed for debugging
  },
});

/**
 * Enqueue an email for sending.
 * Call this from service layer — never from controllers.
 */
export const enqueueEmail = async (data: EmailJobData): Promise<void> => {
  await emailQueue.add('send-email', data, {
    priority: 1, // Higher priority for transactional emails
  });
};
