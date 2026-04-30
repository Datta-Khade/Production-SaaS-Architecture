/**
 * Auth Utilities — Token & tenant management for frontend
 *
 * Access tokens: in-memory (cleared on page refresh — most secure)
 * Refresh tokens: httpOnly cookie (managed by server)
 * Tenant domain: SecureLocalStorage (persists across sessions, encrypted)
 */
import { SecureLocalStorage } from './secureStorage';

const TENANT_DOMAIN_KEY = 'tenant_domain';

// ── In-memory token storage ──────────────────────────────────
let accessToken: string | null = null;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const getAccessToken = (): string | null => accessToken;

export const clearAccessToken = (): void => {
  accessToken = null;
};

// ── Tenant domain storage (SecureLocalStorage) ─────────────────────
export const setTenantDomain = (domain: string): void => {
  SecureLocalStorage.setItem(TENANT_DOMAIN_KEY, domain);
};

export const getTenantDomain = (): string | null => {
  return SecureLocalStorage.getItem<string>(TENANT_DOMAIN_KEY);
};

export const clearTenantDomain = (): void => {
  SecureLocalStorage.removeItem(TENANT_DOMAIN_KEY);
};

// ── Legacy alias (keep for backwards compat) ─────────────────
/** @deprecated Use setTenantDomain / getTenantDomain */
export const setTenantId = setTenantDomain;
/** @deprecated Use setTenantDomain / getTenantDomain */
export const getTenantId = getTenantDomain;

// ── Auth state ───────────────────────────────────────────────
export const isAuthenticated = (): boolean => accessToken !== null;

/**
 * Decode a JWT payload without verification (client-side only).
 * For display purposes ONLY — never trust for security decisions.
 */
export const decodeToken = (token: string): Record<string, unknown> | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(payload);
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return Date.now() >= (decoded.exp as number) * 1000 - 30_000;
};

/**
 * Full logout — clears all auth state.
 */
export const logout = (): void => {
  clearAccessToken();
  clearTenantDomain();
};
