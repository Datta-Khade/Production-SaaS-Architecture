/**
 * Tasks Schema — Reference CRUD Module
 *
 * Implements DB-1 standards: UUID primary key, standard audit columns.
 */
import { pgTable, serial, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { usersTable } from './users';

export const tasksTable = pgTable('tasks_v2', {
  id: serial('id').primaryKey(),
  uuid: text('uuid').notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('todo'),
  dueDate: timestamp('due_date', { withTimezone: true }),

  // Standard Audit Columns
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: text('created_by')
    .notNull()
    .references(() => usersTable.uuid),
  updatedBy: text('updated_by').references(() => usersTable.uuid),
  isDeleted: boolean('is_deleted').notNull().default(false),
});

export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;
