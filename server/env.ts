/**
 * Environment Variable Validation — THE BOOT GATE
 * 
 * The app REFUSES to start if any required env var is missing or malformed.
 * No "undefined" surprises deep in a request handler.
 * 
 * Usage: import { env } from './env.js' — guaranteed to be valid after boot.
 */
import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'node:path';

// Load .env.development for local dev from the project root
dotenv.config({ path: path.resolve(process.cwd(), '../.env.development') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.development') }); // Fallback if run from root

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  APP_URL: z.string().url().default('http://localhost:5005'),

  // Database — Master
  MASTER_DATABASE_URL: z.string().min(1, 'MASTER_DATABASE_URL is required'),

  // Database — Single tenant (dev only)
  DATABASE_URL: z.string().optional(),

  // Auth
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRY: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(32, 'REFRESH_TOKEN_SECRET must be at least 32 characters'),
  REFRESH_TOKEN_EXPIRY: z.string().default('7d'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Feature Flags
  AUTH_BYPASS: z.preprocess((val) => val === 'true' || val === '1' || val === true, z.boolean()).default(false),
  MULTI_TENANT: z.preprocess((val) => val === 'true' || val === '1' || val === true, z.boolean()).default(true),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z.preprocess((val) => val === 'true' || val === '1' || val === true, z.boolean()).default(false),
  LOG_HTTP_REQUESTS: z.preprocess((val) => val === 'true' || val === '1' || val === true, z.boolean()).default(true),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().default(100),

  // Email (optional — queue-backed)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@production.so'),

  // Encryption — AES-256-GCM key (64 hex chars = 32 bytes)
  // Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be exactly 64 hex characters'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment validation failed:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
