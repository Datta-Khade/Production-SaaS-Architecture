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
import type { EmailJobData } from './queue.js';

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const processEmail = async (job: Job<EmailJobData>): Promise<void> => {
  const { tenantId, to, subject, html, from } = job.data;

  console.log(`📧 Processing email job ${job.id}:`, {
    tenantId,
    to,
    subject,
    from: from || 'noreply@production.so',
  });

  // TODO: Integrate with actual SMTP transport in Phase 3+
  // Example with nodemailer:
  // const transporter = createTransport({ host: env.SMTP_HOST, ... });
  // await transporter.sendMail({ from, to, subject, html });

  // Simulate sending delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log(`✅ Email sent to ${to} (tenant: ${tenantId})`);
};

// Create worker
const worker = new Worker<EmailJobData>('email', processEmail, {
  connection: redisConnection,
  concurrency: 5,        // Process up to 5 emails concurrently
  limiter: {
    max: 10,              // Max 10 jobs per duration
    duration: 1000,       // Per second
  },
});

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('Worker error:', err.message);
});

console.log('📧 Email worker started — listening for jobs...');
