/**
 * Client-side shared validators — re-exports from shared package.
 * Import these in frontend forms instead of deep paths.
 */
export {
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  paginationSchema,
  searchQuerySchema,
  buildResponse,
  buildPaginatedResponse,
} from '@shared/modules/validators/common';

export type {
  LoginInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  PaginationInput,
  SearchQueryInput,
  ApiResponse,
  PaginatedResponse,
  PaginationMeta,
} from '@shared/modules/validators/common';
