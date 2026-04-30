/**
 * Error Utilities — Frontend error handling helpers
 */

/**
 * Format error message for display to user.
 * Handles ApiError, generic Error, and unknown types.
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};

/**
 * Simple toast-like notification helper.
 * In Phase 2 this will be replaced with a proper toast library.
 */
export const showToast = {
  success: (message: string) => {
    // TODO: Replace with proper toast component in Phase 2
    console.log('✅', message);
  },
  error: (message: string) => {
    // TODO: Replace with proper toast component in Phase 2
    console.error('❌', message);
  },
  warning: (message: string) => {
    // TODO: Replace with proper toast component in Phase 2
    console.warn('⚠️', message);
  },
  info: (message: string) => {
    // TODO: Replace with proper toast component in Phase 2
    console.info('ℹ️', message);
  },
};
