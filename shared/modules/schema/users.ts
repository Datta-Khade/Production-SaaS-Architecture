import { pgTable, text, varchar } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users_v2', {
  uuid: text('uuid').primaryKey(),
  username: text('username').unique(),
  email: varchar('email').notNull(),
});
