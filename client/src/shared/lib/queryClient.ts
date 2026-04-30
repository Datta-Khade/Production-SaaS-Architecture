/**
 * TanStack Query Client + API Request Function (tenantFetch)
 *
 * tenantFetch() / apiRequest() is the SINGLE source for all API calls.
 * It auto-injects:
 *   Authorization: Bearer <token>
 *   X-Tenant-Domain: <domain>
 *
 * Implements AUTH-5 Silent Refresh Flow:
 *   1. Request fails with 401
 *   2. Call POST /api/v2/auth/refresh
 *   3. Retry original request once with new token
 *   4. If refresh fails → logout + redirect to /login
 *
 * NEVER use raw fetch() — always use apiRequest() / tenantFetch().
 */
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { getAccessToken, getTenantDomain, setAccessToken, logout } from './auth';

// ── Query Client ─────────────────────────────────────────────

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            30_000,
      retry:                1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      // Create a global notification here (e.g. toast.error)
      // Since this is a skeleton, we use console.error + alert for unhandled query errors
      console.error(`[Global Query Error]: ${error.message}`);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error(`[Global Mutation Error]: ${error.message}`);
      // Fallback alert for mutations if not handled locally
      // alert(`Error: ${error.message}`);
    },
  }),
});

// ── API Error Class ──────────────────────────────────────────

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

// ── Silent Refresh ───────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

const processQueue = (token: string | null): void => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
};

const silentRefresh = async (): Promise<string | null> => {
  if (isRefreshing) {
    // Queue subsequent callers while a refresh is in progress
    return new Promise((resolve) => {
      refreshQueue.push(resolve);
    });
  }

  isRefreshing = true;
  try {
    const domain = getTenantDomain();
    const headers: Record<string, string> = {};
    if (domain) headers['X-Tenant-Domain'] = domain;

    const res = await fetch('/api/v2/auth/refresh', {
      method:      'POST',
      headers,
      credentials: 'include', // Send httpOnly refresh cookie
    });

    if (!res.ok) {
      processQueue(null);
      return null;
    }

    const data = await res.json();
    const newToken = data.data?.accessToken ?? null;
    setAccessToken(newToken);
    processQueue(newToken);
    return newToken;
  } catch {
    processQueue(null);
    return null;
  } finally {
    isRefreshing = false;
  }
};

// ── Core Request Function ────────────────────────────────────

/**
 * Centralized API request — use everywhere.
 * Automatically injects auth + tenant headers.
 * Handles 401 → silent refresh → retry once.
 */
export const apiRequest = async <T>(
  method: string,
  endpoint: string,
  body?: unknown,
  isRetry = false
): Promise<T> => {
  const token  = getAccessToken();
  const domain = getTenantDomain();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (domain) {
    headers['X-Tenant-Domain'] = domain;
  }

  const res = await fetch(`/api/v2${endpoint}`, {
    method,
    headers,
    body:        body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  // ── 401: Try silent refresh ──────────────────────────────
  if (res.status === 401 && !isRetry) {
    const newToken = await silentRefresh();

    if (!newToken) {
      // Refresh failed — force logout
      logout();
      window.location.href = '/login';
      throw new ApiError('Session expired. Please log in again.', 401, 'SESSION_EXPIRED');
    }

    // Retry the original request once with the new token
    return apiRequest<T>(method, endpoint, body, true);
  }

  if (!res.ok) {
    let errorData: { message: string; code: string } = {
      message: 'An unexpected error occurred',
      code:    'UNKNOWN',
    };
    try {
      errorData = await res.json();
    } catch {
      // Ignore parse errors
    }
    throw new ApiError(errorData.message, res.status, errorData.code);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
};

/** Alias for consistency with AUTH-4 spec naming */
export const tenantFetch = apiRequest;
