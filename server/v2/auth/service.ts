/**
 * Auth Service — Business logic for authentication
 *
 * Rules:
 * - ZERO req/res references — pure business logic
 * - Real DB lookup via getDb()
 * - bcrypt for password comparison (cost 12)
 * - Login attempt locking after MAX_FAILED_ATTEMPTS
 * - Refresh tokens stored hashed in DB (SHA-256)
 * - Audit every login success/failure
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../env.js';
import type { JwtPayload, UserRole } from '../../middleware/auth.js';
import { UnauthorizedError, ForbiddenError, ValidationError } from '../../../shared/v2/errors/index.js';
import { hashToken } from '../../../shared/v2/lib/encryption.js';
import { logger } from '../../lib/logger.js';
import { getRawPool, runWithDb } from '../db.js';
import { auditLog } from '../lib/auditLog.js';
import { getTenantByDomain } from '../tenantConnectionManager.js';

const MAX_FAILED_ATTEMPTS = 10;
const LOCK_DURATION_MINUTES = 30;

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface DbUser {
  uuid: string;
  email: string;
  username: string;
  password_hash: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  is_active: boolean;
  failed_login_count: number;
  locked_until: Date | null;
}

// ── Token Helpers ───────────────────────────────────────────

const generateTokens = (claims: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair => {
  const accessToken = jwt.sign(claims, env.JWT_SECRET as string, {
    expiresIn: env.JWT_EXPIRY as any,
    issuer:   'production.so',
    audience: 'production.so',
  });

  const refreshToken = jwt.sign(
    { sub: claims.sub, type: 'refresh', jti: uuidv4() },
    env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: env.REFRESH_TOKEN_EXPIRY as any }
  );

  return { accessToken, refreshToken };
};

// ── Auth Service ────────────────────────────────────────────

export const authService = {

  /**
   * Authenticate user by username/email + password + domain.
   * Returns token pair + user (without password_hash).
   * Tracks failures and locks account after threshold.
   */
  login: async (
    username: string,
    password: string,
    _domain: string,
    ipAddress?: string
  ): Promise<TokenPair & { user: Omit<DbUser, 'password_hash'> }> => {

    const tenantConn = await getTenantByDomain(_domain);
    if (!tenantConn) {
       // Do not reveal if tenant doesn't exist, just return invalid creds
       throw new UnauthorizedError('Invalid credentials');
    }

    return runWithDb(tenantConn.dbUrl, async () => {
      const db = getRawPool();

      // Look up user by username OR email
      const result = await db.query<DbUser>(
      `SELECT uuid, email, username, password_hash, role, first_name, last_name,
              is_active, failed_login_count, locked_until
       FROM users_v2
       WHERE (username = $1 OR email = $1)
         AND is_deleted = false
       LIMIT 1`,
      [username]
    );

    const user = result.rows[0];

    // Generic error — don't reveal if user exists
    const invalidCredentials = (): never => {
      throw new UnauthorizedError('Invalid credentials');
    };

    if (!user) {
      await auditLog.track({
        actor: null,
        action: 'login_failed',
        entity: 'users_v2',
        after: { username, reason: 'user_not_found' },
        ipAddress,
      });
      return invalidCredentials();
    }

    // Check account locked
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      const minutesLeft = Math.ceil(
        (new Date(user.locked_until).getTime() - Date.now()) / 60000
      );
      await auditLog.track({
        actor: { sub: user.uuid, email: user.email },
        action: 'login_failed',
        entity: 'users_v2',
        entityUuid: user.uuid,
        after: { reason: 'account_locked', minutesLeft },
        ipAddress,
      });
      throw new ForbiddenError(
        `Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`
      );
    }

    // Check account active
    if (!user.is_active) {
      throw new ForbiddenError('Account is disabled. Contact your administrator.');
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      const newFailCount = user.failed_login_count + 1;
      const shouldLock = newFailCount >= MAX_FAILED_ATTEMPTS;

      await db.query(
        `UPDATE users_v2
         SET failed_login_count = $1,
             locked_until = $2,
             updated_at = NOW()
         WHERE uuid = $3`,
        [
          newFailCount,
          shouldLock ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000) : null,
          user.uuid,
        ]
      );

      await auditLog.track({
        actor: { sub: user.uuid, email: user.email },
        action: shouldLock ? 'account_locked' : 'login_failed',
        entity: 'users_v2',
        entityUuid: user.uuid,
        after: { attempt: newFailCount, locked: shouldLock },
        ipAddress,
      });

      if (shouldLock) {
        throw new ForbiddenError(
          `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts. Try again in ${LOCK_DURATION_MINUTES} minutes.`
        );
      }

      const attemptsLeft = MAX_FAILED_ATTEMPTS - newFailCount;
      throw new UnauthorizedError(
        `Invalid credentials. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining before lock.`
      );
    }

    // ✅ Password correct — reset failure counter
    await db.query(
      `UPDATE users_v2
       SET failed_login_count = 0, locked_until = NULL, updated_at = NOW()
       WHERE uuid = $1`,
      [user.uuid]
    );

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      sub:    user.uuid,
      email:  user.email,
      role:   user.role,
      domain: _domain,
    });

    // Store refresh token hash in DB
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await db.query(
      `INSERT INTO refresh_tokens_v2 (user_uuid, token_hash, ip_address, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [user.uuid, tokenHash, ipAddress ?? null, expiresAt]
    );

    // Audit successful login
    await auditLog.track({
      actor: { sub: user.uuid, email: user.email },
      action: 'login',
      entity: 'users_v2',
      entityUuid: user.uuid,
      ipAddress,
    });

      logger.info({ userUuid: user.uuid, email: user.email }, 'User logged in');

      const { password_hash: _, ...userWithoutPassword } = user;
      return { accessToken, refreshToken, user: userWithoutPassword };
    });
  },

  /**
   * Validate a refresh token against the DB and issue a new token pair.
   * Rotates the refresh token (old one revoked, new one issued).
   */
  refresh: async (
    rawToken: string,
    ipAddress?: string
  ): Promise<TokenPair> => {
    // Verify JWT signature first
    let decoded: { sub: string; type: string };
    try {
      decoded = jwt.verify(rawToken, env.REFRESH_TOKEN_SECRET) as { sub: string; type: string };
      if (decoded.type !== 'refresh') throw new Error('wrong type');
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const db = getRawPool();
    const tokenHash = hashToken(rawToken);

    // Find token in DB
    const result = await db.query(
      `SELECT rt.uuid, rt.user_uuid, rt.is_revoked, rt.expires_at,
              u.email, u.role, u.is_active, u.is_deleted
       FROM refresh_tokens_v2 rt
       JOIN users_v2 u ON u.uuid = rt.user_uuid
       WHERE rt.token_hash = $1`,
      [tokenHash]
    );

    const tokenRow = result.rows[0];

    if (!tokenRow || tokenRow.is_revoked || new Date() > new Date(tokenRow.expires_at)) {
      throw new UnauthorizedError('Refresh token is invalid or expired');
    }

    if (!tokenRow.is_active || tokenRow.is_deleted) {
      throw new ForbiddenError('Account is disabled');
    }

    // Revoke old token
    await db.query(
      `UPDATE refresh_tokens_v2 SET is_revoked = true, updated_at = NOW() WHERE uuid = $1`,
      [tokenRow.uuid]
    );

    // Generate new pair
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      sub:    tokenRow.user_uuid,
      email:  tokenRow.email,
      role:   tokenRow.role,
      domain: 'localhost',
    });

    // Store new refresh token
    const newHash = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.query(
      `INSERT INTO refresh_tokens_v2 (user_uuid, token_hash, ip_address, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [tokenRow.user_uuid, newHash, ipAddress ?? null, expiresAt]
    );

    return { accessToken, refreshToken: newRefreshToken };
  },

  /**
   * Revoke a specific refresh token (logout from current device).
   */
  logout: async (rawToken: string): Promise<void> => {
    const db = getRawPool();
    const tokenHash = hashToken(rawToken);
    await db.query(
      `UPDATE refresh_tokens_v2 SET is_revoked = true, updated_at = NOW()
       WHERE token_hash = $1`,
      [tokenHash]
    );
  },

  /**
   * Get user profile by UUID.
   */
  getProfile: async (userUuid: string): Promise<Omit<DbUser, 'password_hash'>> => {
    const db = getRawPool();
    const result = await db.query<DbUser>(
      `SELECT uuid, email, username, role, first_name, last_name, is_active,
              failed_login_count, locked_until
       FROM users_v2
       WHERE uuid = $1 AND is_deleted = false`,
      [userUuid]
    );

    const user = result.rows[0];
    if (!user) throw new UnauthorizedError('User not found');

    const { password_hash: _, ...profile } = user;
    return profile;
  },

  /**
   * Change a user's password (verifies current password first).
   */
  changePassword: async (
    userUuid: string,
    currentPassword: string,
    newPassword: string,
    ipAddress?: string
  ): Promise<void> => {
    const db = getRawPool();

    const result = await db.query<DbUser>(
      `SELECT uuid, email, password_hash FROM users_v2
       WHERE uuid = $1 AND is_deleted = false`,
      [userUuid]
    );

    const user = result.rows[0];
    if (!user) throw new UnauthorizedError('User not found');

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) throw new ValidationError('Current password is incorrect');

    const newHash = await bcrypt.hash(newPassword, 12);
    await db.query(
      `UPDATE users_v2 SET password_hash = $1, updated_at = NOW() WHERE uuid = $2`,
      [newHash, userUuid]
    );

    // Revoke ALL refresh tokens (force re-login on all devices)
    await db.query(
      `UPDATE refresh_tokens_v2 SET is_revoked = true, updated_at = NOW()
       WHERE user_uuid = $1`,
      [userUuid]
    );

    await auditLog.track({
      actor: { sub: user.uuid, email: user.email },
      action: 'password_change',
      entity: 'users_v2',
      entityUuid: user.uuid,
      ipAddress,
    });
  },

  /**
   * Hash a password (bcrypt cost 12 for production).
   */
  hashPassword: async (password: string): Promise<string> => {
    return bcrypt.hash(password, 12);
  },
};
