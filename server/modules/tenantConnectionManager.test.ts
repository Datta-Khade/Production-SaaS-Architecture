import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getTenantConnection,
  getTenantByDomain,
  resetTenantCache,
} from './tenantConnectionManager.js';
import { getMasterDb } from './db.js';
import { cacheGet, cacheSet } from '../lib/cache.js';
import { runTenantMigrations } from './migrationRunner.js';
import { serverDecrypt, isEncrypted } from '../lib/serverEncryption.js';

// Mocks
vi.mock('./db.js');
vi.mock('../lib/cache.js');
vi.mock('./migrationRunner.js');
vi.mock('../lib/serverEncryption.js');

describe('TenantConnectionManager', () => {
  const mockTenant = {
    tuid: 'tenant-123',
    domain: 'test.localhost',
    db_url: 'postgres://test',
    plan: 'pro',
    is_active: true,
  };

  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation((cb) => cb([mockTenant])),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetTenantCache();
    (getMasterDb as any).mockReturnValue(mockDb);
    (cacheGet as any).mockResolvedValue(null);
    (isEncrypted as any).mockReturnValue(false);
  });

  describe('getTenantConnection', () => {
    it('should return tenant from cache if available', async () => {
      const cachedConn = { tuid: 'tenant-123', domain: 'test.localhost', dbUrl: 'postgres://test' };
      (cacheGet as any).mockResolvedValue(cachedConn);

      const result = await getTenantConnection('tenant-123');

      expect(result).toEqual(cachedConn);
      expect(getMasterDb).not.toHaveBeenCalled();
    });

    it('should query DB and run migrations on cache miss', async () => {
      mockDb.then.mockImplementationOnce((cb) => cb([mockTenant]));

      const result = await getTenantConnection('tenant-123');

      expect(result?.tuid).toBe('tenant-123');
      expect(runTenantMigrations).toHaveBeenCalledWith('postgres://test');
      expect(getMasterDb).toHaveBeenCalled();
    });

    it('should decrypt db_url if encrypted', async () => {
      (isEncrypted as any).mockReturnValue(true);
      (serverDecrypt as any).mockReturnValue('decrypted_url');
      mockDb.then.mockImplementationOnce((cb) => cb([mockTenant]));

      const result = await getTenantConnection('tenant-123');

      expect(result?.dbUrl).toBe('decrypted_url');
      expect(serverDecrypt).toHaveBeenCalled();
    });

    it('should return null if tenant is not found', async () => {
      mockDb.then.mockImplementationOnce((cb) => cb([]));

      const result = await getTenantConnection('nonexistent');

      expect(result).toBeNull();
    });

    it('should not run migrations twice for the same tenant in one session', async () => {
      mockDb.then.mockImplementation((cb) => cb([mockTenant]));

      await getTenantConnection('tenant-123'); // First time
      await getTenantConnection('tenant-123'); // Second time (cache miss again for simulation)

      expect(runTenantMigrations).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTenantByDomain', () => {
    it('should resolve tenant by domain name', async () => {
      mockDb.then.mockImplementationOnce((cb) => cb([mockTenant]));

      const result = await getTenantByDomain('test.localhost');

      expect(result?.domain).toBe('test.localhost');
      expect(cacheSet).toHaveBeenCalled();
    });
  });
});
