/**
 * Audit Columns — MANDATORY on every table
 * 
 * These columns are automatically spread into every Drizzle table definition.
 * - created_by_uuid / updated_by_uuid are set in the SERVICE layer, never from client input
 * - Soft delete via is_deleted (never hard DELETE in production)
 */
import { boolean, text, timestamp } from 'drizzle-orm/pg-core';

export const auditColumns = {
  created_at:      timestamp('created_at').defaultNow().notNull(),
  updated_at:      timestamp('updated_at').defaultNow().notNull(),
  created_by_uuid: text('created_by_uuid'),
  updated_by_uuid: text('updated_by_uuid'),
  is_deleted:      boolean('is_deleted').default(false).notNull(),
  deleted_at:      timestamp('deleted_at'),
  deleted_by_uuid: text('deleted_by_uuid'),
};
