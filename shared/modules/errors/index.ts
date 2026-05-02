/**
 * Custom Error Classes — MANDATORY for all service-layer errors
 * 
 * These are caught by globalErrorHandler and mapped to consistent HTTP responses.
 * NEVER throw raw `new Error()` — always use these specific classes.
 * Stack traces are NEVER sent to the client.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code || this.name.replace(/Error$/, '').toUpperCase().replace(/([A-Z])/g, '_$1').replace(/^_/, '');
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 400 — Client sent invalid input */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

/** 401 — Missing or invalid authentication */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/** 403 — Authenticated but insufficient permissions */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

/** 404 — Requested resource does not exist */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

/** 409 — Conflict (e.g. duplicate email) */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

/** 429 — Too many requests */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}
