/**
 * Auth Controller — HTTP in/out ONLY, zero business logic
 *
 * POST /api/v2/auth/login           → Issue JWT + refresh token
 * POST /api/v2/auth/refresh         → Refresh access token from httpOnly cookie
 * GET  /api/v2/auth/profile         → Current user profile
 * POST /api/v2/auth/change-password → Change password (requires current)
 * POST /api/v2/auth/logout          → Clear refresh token cookie
 */
import { Request, Response } from 'express';
import { loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from '../../../shared/modules/validators/common.js';
import { ValidationError } from '../../../shared/modules/errors/index.js';
import { authService } from './service.js';
import { env } from '../../env.js';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path:     '/api/v2/auth',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
};

const getIp = (req: Request): string =>
  (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
  req.socket.remoteAddress ||
  'unknown';

export const authController = {

  /**
   * POST /api/v2/auth/login
   * Body: { username, password, domain }
   */
  login: async (req: Request, res: Response): Promise<void> => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0]?.message || 'Invalid input');
    }

    const { username, password, domain } = parsed.data;
    const result = await authService.login(username, password, domain, getIp(req));

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  },

  /**
   * POST /api/v2/auth/refresh
   * Cookie: refresh_token (httpOnly)
   */
  refresh: async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw new ValidationError('Refresh token not found');
    }

    const tokens = await authService.refresh(refreshToken, getIp(req));

    // Rotate cookie
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({
      success: true,
      data: { accessToken: tokens.accessToken },
    });
  },

  /**
   * GET /api/v2/auth/profile
   * Requires: authenticate middleware
   */
  profile: async (req: Request, res: Response): Promise<void> => {
    const user = await authService.getProfile(req.user!.sub);
    res.json({ success: true, data: user });
  },

  /**
   * POST /api/v2/auth/change-password
   * Requires: authenticate middleware
   * Body: { current_password, new_password }
   */
  changePassword: async (req: Request, res: Response): Promise<void> => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0]?.message || 'Invalid input');
    }

    await authService.changePassword(
      req.user!.sub,
      parsed.data.current_password,
      parsed.data.new_password,
      getIp(req)
    );

    // Clear refresh cookie — user must re-login on all devices
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure:   env.NODE_ENV === 'production',
      sameSite: 'strict',
      path:     '/api/v2/auth',
    });

    res.json({
      success: true,
      data: null,
      message: 'Password changed successfully. Please log in again.',
    });
  },

  /**
   * POST /api/v2/auth/logout
   */
  logout: async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (refreshToken) {
      await authService.logout(refreshToken).catch(() => {
        // Ignore — token may already be invalid
      });
    }

    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure:   env.NODE_ENV === 'production',
      sameSite: 'strict',
      path:     '/api/v2/auth',
    });

    res.json({ success: true, data: null, message: 'Logged out successfully' });
  },

  /**
   * POST /api/v2/auth/forgot-password
   * Body: { email, domain }
   */
  forgotPassword: async (req: Request, res: Response): Promise<void> => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0]?.message || 'Invalid input');
    }

    await authService.forgotPassword(parsed.data.username, parsed.data.domain);

    res.json({
      success: true,
      data: null,
      message: 'If an account exists for that email, a reset link has been sent.',
    });
  },

  /**
   * POST /api/v2/auth/reset-password
   * Body: { token, domain, new_password }
   */
  resetPassword: async (req: Request, res: Response): Promise<void> => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0]?.message || 'Invalid input');
    }

    await authService.resetPassword(
      parsed.data.token,
      parsed.data.domain,
      parsed.data.new_password
    );

    res.json({
      success: true,
      data: null,
      message: 'Password has been reset successfully. You can now log in.',
    });
  },
};

