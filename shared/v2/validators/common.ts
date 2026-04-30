/**
 * Common Validators — Shared Zod schemas for request/response validation
 *
 * Single source of truth for input validation.
 * Used by both frontend forms and backend controllers.
 */
import { z } from 'zod';

// ============================================================
// Pagination
// ============================================================

export const paginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ============================================================
// Common Field Validators
// ============================================================

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const emailSchema = z.string().email('Invalid email address').max(255);

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters');

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must not exceed 100 characters')
  .trim();

// ============================================================
// Auth Validators (AUTH-1: username + password + domain)
// ============================================================

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(255),
  password: z.string().min(1, 'Password is required'),
  domain:   z.string().min(1, 'Domain is required').max(100),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password:     passwordSchema,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ============================================================
// Common Query Validators
// ============================================================

export const searchQuerySchema = z.object({
  search:    z.string().max(200).optional(),
  sortBy:    z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  ...paginationSchema.shape,
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

// ============================================================
// API Response Types (API-1, API-2)
// Standard envelope: { success, data, meta }
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

/** Pagination meta block — use `meta` key (not `pagination`) */
export interface PaginationMeta {
  page:  number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

/**
 * Build a standard paginated response object.
 * Use this in every controller that returns a list.
 */
export const buildPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> => ({
  success: true,
  data,
  meta: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  },
});

/**
 * Build a standard success response object.
 */
export const buildResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  ...(message ? { message } : {}),
});
