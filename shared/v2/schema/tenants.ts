/**
 * Tenants Table Schema — Master DB
 * 
 * Every tenant gets a fully isolated PostgreSQL database.
 * This table lives in the master DB and maps tuid → db_url.
 */
import { pgTable, serial, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const tenantsTable = pgTable('tenants', {
  id:           serial('id').primaryKey(),
  tuid:         text('tuid').notNull().unique(),           // e.g. "acme-corp-x7f2"
  domain:       text('domain').notNull().unique(),         // e.g. "acme.production.so"
  db_url:       text('db_url').notNull(),                  // Full PostgreSQL connection string
  company_name: text('company_name').notNull(),
  plan:         text('plan').notNull().default('starter'), // starter | pro | enterprise
  is_active:    boolean('is_active').default(true),
  is_deleted:   boolean('is_deleted').default(false),
  created_at:   timestamp('created_at').defaultNow(),
  updated_at:   timestamp('updated_at').defaultNow(),
});

export type Tenant = typeof tenantsTable.$inferSelect;
export type NewTenant = typeof tenantsTable.$inferInsert;
