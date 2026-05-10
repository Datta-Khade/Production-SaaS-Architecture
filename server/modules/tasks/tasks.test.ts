import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { tasksService } from './service.js';
import { getTenantByDomain } from '../tenantConnectionManager.js';
import jwt from 'jsonwebtoken';

// Mocks
vi.mock('./service.js');
vi.mock('../tenantConnectionManager.js');
vi.mock('jsonwebtoken');
vi.mock('../../env.js', () => ({
  env: {
    MULTI_TENANT: true,
    NODE_ENV: 'test',
    JWT_SECRET: 'test-secret-at-least-32-chars-long-!!!',
    LOG_LEVEL: 'info',
  },
}));

describe('Tasks API Integration', () => {
  const app = createApp();
  const mockUser = {
    sub: 'user-uuid',
    email: 'user@test.com',
    role: 'user',
    domain: 'test.localhost',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock tenant resolution
    (getTenantByDomain as any).mockResolvedValue({
      tuid: 'tenant-123',
      domain: 'test.localhost',
      dbUrl: 'postgres://test',
      isActive: true,
    });

    // Mock JWT verification
    (jwt.verify as any).mockReturnValue(mockUser);
  });

  describe('GET /api/v2/tasks', () => {
    it('should return list of tasks', async () => {
      const mockTasks = { data: [{ uuid: 't1', title: 'Task 1' }], total: 1 };
      (tasksService.getTasks as any).mockResolvedValue(mockTasks);

      const res = await request(app)
        .get('/api/v2/tasks')
        .set('x-tenant-domain', 'test.localhost')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });
  });

  describe('POST /api/v2/tasks', () => {
    it('should create a task', async () => {
      const newTask = { title: 'New Task', status: 'todo' };
      (tasksService.createTask as any).mockResolvedValue({ uuid: 'new-t', ...newTask });

      const res = await request(app)
        .post('/api/v2/tasks')
        .set('x-tenant-domain', 'test.localhost')
        .set('Authorization', 'Bearer valid-token')
        .send(newTask);

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('New Task');
    });

    it('should return 400 for invalid input', async () => {
      const res = await request(app)
        .post('/api/v2/tasks')
        .set('x-tenant-domain', 'test.localhost')
        .set('Authorization', 'Bearer valid-token')
        .send({ status: 'todo' }); // Missing title

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
