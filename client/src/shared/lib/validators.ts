/**
 * Client-side shared validators — re-exports from shared package.
 * Import these in frontend forms instead of deep paths.
 */
export {
  loginSchema,
  changePasswordSchema,
  paginationSchema,
  searchQuerySchema,
  buildResponse,
  buildPaginatedResponse,
} from '@shared/v2/validators/common';

export type {
  LoginInput,
  ChangePasswordInput,
  PaginationInput,
  SearchQueryInput,
  ApiResponse,
  PaginatedResponse,
  PaginationMeta,
} from '@shared/v2/validators/common';
