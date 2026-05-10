import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { usersService } from './service.js';
import { accessControlRepository } from '@server/modules/access_control/repository';
import { getTenantByDomain } from '../tenantConnectionManager.js';
import { resetRoleHierarchyCache } from '../../middleware/auth.js';
import jwt from 'jsonwebtoken';

// Mocks
vi.mock('./service.js');
vi.mock('@server/modules/access_control/repository');
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

describe('Users API Integration', () => {
  const app = createApp();
  const mockAdminUser = {
    sub: 'admin-uuid',
    email: 'admin@test.com',
    role: 'superadmin',
    domain: 'test.localhost',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetRoleHierarchyCache();

    // Mock tenant resolution
    (getTenantByDomain as any).mockResolvedValue({
      tuid: 'tenant-123',
      domain: 'test.localhost',
      dbUrl: 'postgres://test',
      isActive: true,
    });

    // Mock role hierarchy for requireRole
    (accessControlRepository.getAllRoles as any).mockResolvedValue([
      { assigned_role: 'superadmin', orderby: 100 },
      { assigned_role: 'admin', orderby: 80 },
      { assigned_role: 'user', orderby: 10 },
    ]);

    // Mock JWT verification
    (jwt.verify as any).mockReturnValue(mockAdminUser);
  });

  describe('GET /api/v2/admin/users', () => {
    it('should return all users for superadmin', async () => {
      const mockUsers = [{ uuid: 'u1', username: 'user1' }];
      (usersService.getAllUsers as any).mockResolvedValue(mockUsers);

      const res = await request(app)
        .get('/api/v2/admin/users')
        .set('x-tenant-domain', 'test.localhost')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockUsers);
    });

    it('should return 401 if token is missing', async () => {
      const res = await request(app).get('/api/v2/admin/users');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v2/admin/users', () => {
    it('should create a user and return 201', async () => {
      const newUser = { username: 'newuser', email: 'new@test.com' };
      (usersService.createUser as any).mockResolvedValue({ uuid: 'new-uuid', ...newUser });

      const res = await request(app)
        .post('/api/v2/admin/users')
        .set('x-tenant-domain', 'test.localhost')
        .set('Authorization', 'Bearer valid-token')
        .send(newUser);

      expect(res.status).toBe(201);
      expect(res.body.data.uuid).toBe('new-uuid');
      expect(usersService.createUser).toHaveBeenCalledWith(
        expect.objectContaining(newUser),
        mockAdminUser.sub,
      );
    });
  });

  describe('DELETE /api/v2/admin/users/:uuid', () => {
    it('should delete a user and return 200', async () => {
      (usersService.deleteUser as any).mockResolvedValue(undefined);

      const res = await request(app)
        .delete('/api/v2/admin/users/target-uuid')
        .set('x-tenant-domain', 'test.localhost')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(usersService.deleteUser).toHaveBeenCalledWith('target-uuid', mockAdminUser.sub);
    });
  });
});
