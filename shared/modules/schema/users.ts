import { pgTable, text, varchar, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

/**
 * Users Table Schema (Tenant DB)
 */
export const usersTable = pgTable('users_v2', {
  id: integer('id').primaryKey(),
  uuid: text('uuid').notNull().unique(),
  username: text('username').unique(),
  email: varchar('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  role: text('role').default('user').notNull(), // Legacy system role
  assigned_role: text('assigned_role'), // Dynamic role from rolemaster
  is_active: boolean('is_active').default(true).notNull(),
  failed_login_count: integer('failed_login_count').default(0).notNull(),
  locked_until: timestamp('locked_until'),

  // Audit columns
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  created_by_uuid: text('created_by_uuid'),
  updated_by_uuid: text('updated_by_uuid'),
  is_deleted: boolean('is_deleted').default(false).notNull(),
  deleted_at: timestamp('deleted_at'),
  deleted_by_uuid: text('deleted_by_uuid'),
});

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
