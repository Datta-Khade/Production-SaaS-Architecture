import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { isMasterDbHealthy } from '../db.js';
import { isRedisHealthy } from '../../lib/redis.js';
import { env } from '../../env.js';

// Mocks
vi.mock('../db.js');
vi.mock('../../lib/redis.js');
vi.mock('../../env.js', () => ({
  env: {
    REDIS_ENABLED: true,
    NODE_ENV: 'test',
    MASTER_DATABASE_URL: 'postgres://test',
    LOG_LEVEL: 'info',
  },
}));

describe('Health API Integration', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return 200 healthy', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });
  });

  describe('GET /api/v2/health', () => {
    it('should return 200 healthy when DB and Redis are ok', async () => {
      (isMasterDbHealthy as any).mockResolvedValue(true);
      (isRedisHealthy as any).mockResolvedValue(true);

      const res = await request(app).get('/api/v2/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.checks.masterDb).toBe('ok');
      expect(res.body.checks.redis).toBe('ok');
    });

    it('should return 503 degraded when DB is down', async () => {
      (isMasterDbHealthy as any).mockResolvedValue(false);
      (isRedisHealthy as any).mockResolvedValue(true);

      const res = await request(app).get('/api/v2/health');

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('degraded');
      expect(res.body.checks.masterDb).toBe('error');
    });

    it('should show redis as error if redis is down but enabled', async () => {
      (isMasterDbHealthy as any).mockResolvedValue(true);
      (isRedisHealthy as any).mockResolvedValue(false);

      const res = await request(app).get('/api/v2/health');

      expect(res.status).toBe(200); // Healthy because Redis is optional
      expect(res.body.checks.redis).toBe('error');
    });
  });
});
