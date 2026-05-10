import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authService } from './service.js';
import { getTenantByDomain } from '../tenantConnectionManager.js';
import { getRawPool, runWithDb } from '../db.js';
import { auditLog } from '../lib/auditLog.js';
import { emailService } from '../../lib/email.js';
import {
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from '../../../shared/modules/errors/index.js';

// Mocks
vi.mock('../tenantConnectionManager.js');
vi.mock('../db.js');
vi.mock('../lib/auditLog.js');
vi.mock('../../lib/email.js');
vi.mock('bcryptjs');
vi.mock('jsonwebtoken');

describe('AuthService', () => {
  const mockUser = {
    uuid: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    password_hash: 'hashed_password',
    role: 'user',
    assigned_role: null,
    first_name: 'Test',
    last_name: 'User',
    is_active: true,
    failed_login_count: 0,
    locked_until: null,
  };

  const mockDb = {
    query: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getTenantByDomain as any).mockResolvedValue({ dbUrl: 'postgres://test' });
    (runWithDb as any).mockImplementation((_url: string, cb: any) => cb());
    (getRawPool as any).mockReturnValue(mockDb);
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] }); // Select user
      mockDb.query.mockResolvedValueOnce({}); // Update reset fails
      mockDb.query.mockResolvedValueOnce({}); // Insert refresh token

      (bcrypt.compare as any).mockResolvedValue(true);
      (jwt.sign as any).mockReturnValue('mock_token');

      const result = await authService.login('testuser', 'password123', 'test.localhost');

      expect(result.accessToken).toBe('mock_token');
      expect(result.user.uuid).toBe(mockUser.uuid);
      expect(mockDb.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'), ['testuser']);
      expect(auditLog.track).toHaveBeenCalledWith(expect.objectContaining({ action: 'login' }));
    });

    it('should throw UnauthorizedError if user is not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await expect(authService.login('wronguser', 'password123', 'test.localhost')).rejects.toThrow(
        UnauthorizedError,
      );

      expect(auditLog.track).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'login_failed' }),
      );
    });

    it('should throw UnauthorizedError and increment fails on password mismatch', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] });
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        authService.login('testuser', 'wrongpassword', 'test.localhost'),
      ).rejects.toThrow(UnauthorizedError);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE users_v2\s+SET failed_login_count/i),
        expect.anything(),
      );
    });

    it('should throw ForbiddenError if account is locked', async () => {
      const lockedUser = {
        ...mockUser,
        locked_until: new Date(Date.now() + 1000 * 60 * 10), // Locked for 10 mins
      };
      mockDb.query.mockResolvedValueOnce({ rows: [lockedUser] });

      await expect(authService.login('testuser', 'password123', 'test.localhost')).rejects.toThrow(
        ForbiddenError,
      );

      expect(auditLog.track).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login_failed',
          after: expect.objectContaining({ reason: 'account_locked' }),
        }),
      );
    });

    it('should throw ForbiddenError if account is disabled', async () => {
      const disabledUser = { ...mockUser, is_active: false };
      mockDb.query.mockResolvedValueOnce({ rows: [disabledUser] });

      await expect(authService.login('testuser', 'password123', 'test.localhost')).rejects.toThrow(
        ForbiddenError,
      );
    });
  });

  describe('refresh', () => {
    it('should rotate tokens with valid refresh token', async () => {
      const mockTokenData = {
        uuid: 'rt-123',
        user_uuid: 'user-123',
        is_revoked: false,
        expires_at: new Date(Date.now() + 1000000),
        email: 'test@example.com',
        role: 'user',
        assigned_role: null,
        is_active: true,
        is_deleted: false,
      };

      (jwt.verify as any).mockReturnValue({ sub: 'user-123', type: 'refresh' });
      mockDb.query.mockResolvedValueOnce({ rows: [mockTokenData] }); // Find token
      mockDb.query.mockResolvedValueOnce({}); // Revoke old
      mockDb.query.mockResolvedValueOnce({}); // Insert new
      (jwt.sign as any).mockReturnValue('new_token');

      const result = await authService.refresh('valid_refresh_token');

      expect(result.accessToken).toBe('new_token');
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE refresh_tokens_v2\s+SET is_revoked = true/i),
        expect.anything(),
      );
    });

    it('should throw UnauthorizedError for revoked token', async () => {
      (jwt.verify as any).mockReturnValue({ sub: 'user-123', type: 'refresh' });
      mockDb.query.mockResolvedValueOnce({ rows: [{ is_revoked: true }] });

      await expect(authService.refresh('revoked_token')).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('logout', () => {
    it('should revoke the refresh token', async () => {
      mockDb.query.mockResolvedValueOnce({});
      await authService.logout('some_token');
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE refresh_tokens_v2\s+SET is_revoked = true/i),
        expect.anything(),
      );
    });
  });

  describe('changePassword', () => {
    it('should update password and revoke all tokens if current password is correct', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] }); // Select user
      (bcrypt.compare as any).mockResolvedValue(true);
      (bcrypt.hash as any).mockResolvedValue('new_hashed_password');
      mockDb.query.mockResolvedValueOnce({}); // Update password
      mockDb.query.mockResolvedValueOnce({}); // Revoke all tokens

      await authService.changePassword('user-123', 'oldPassword', 'newPassword');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE users_v2\s+SET password_hash/i),
        expect.anything(),
      );
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE refresh_tokens_v2\s+SET is_revoked = true/i),
        expect.anything(),
      );
      expect(auditLog.track).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'password_change' }),
      );
    });

    it('should throw ValidationError if current password is wrong', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] });
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        authService.changePassword('user-123', 'wrongOldPassword', 'newPassword'),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('forgotPassword', () => {
    it('should generate a reset token and send an email if user exists', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ uuid: 'user-123', email: 'test@example.com', is_active: true }],
      });
      mockDb.query.mockResolvedValueOnce({}); // Insert token

      await authService.forgotPassword('testuser', 'test.localhost');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringMatching(/INSERT INTO password_reset_tokens/i),
        expect.anything(),
      );
      expect(emailService.sendPasswordReset).toHaveBeenCalledWith(
        'test@example.com',
        expect.stringContaining('token='),
      );
    });

    it('should not reveal user existence if not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      await authService.forgotPassword('nonexistent', 'test.localhost');

      // Should not have inserted a token
      const insertCalls = mockDb.query.mock.calls.filter((call) =>
        call[0].includes('INSERT INTO password_reset_tokens'),
      );
      expect(insertCalls.length).toBe(0);

      // Should not have sent an email
      expect(emailService.sendPasswordReset).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should update password and mark token as used if valid', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            uuid: 'token-123',
            user_uuid: 'user-123',
            expires_at: new Date(Date.now() + 10000),
          },
        ],
      });
      mockDb.query.mockResolvedValueOnce({}); // Update user password
      mockDb.query.mockResolvedValueOnce({}); // Mark token used
      mockDb.query.mockResolvedValueOnce({}); // Revoke all refresh tokens

      await authService.resetPassword('valid_token', 'test.localhost', 'newPassword123');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE users_v2\s+SET password_hash/i),
        expect.anything(),
      );
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE password_reset_tokens\s+SET is_used = true/i),
        expect.anything(),
      );
    });
  });
});
