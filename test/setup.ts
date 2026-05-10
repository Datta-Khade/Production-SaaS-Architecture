import { beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';
import path from 'path';

/**
 * Test Setup — Load test environment variables
 */
beforeAll(() => {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

  // Set some defaults for tests if not provided
  process.env.NODE_ENV = 'test';
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test-secret-at-least-32-chars-long-!!!';
  if (!process.env.ENCRYPTION_KEY) process.env.ENCRYPTION_KEY = 'a'.repeat(64);
});

afterAll(() => {
  // Global cleanup if needed
});
