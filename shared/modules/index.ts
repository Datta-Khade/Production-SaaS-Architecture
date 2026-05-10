/**
 * Shared Package — Barrel Export
 *
 * Everything exported from here is available to ALL packages via:
 *   import { ... } from '@production/shared'   (server/workers)
 *   import { ... } from '@shared/modules/...'       (client via path alias)
 */

// Schemas
export * from './schema/audit.js';
export * from './schema/tenants.js';
export * from './schema/tasks.js';

// Validators & Types
export * from './validators/common.js';

// Errors
export * from './errors/index.js';

// Utilities
export * from './lib/encryption.js';
