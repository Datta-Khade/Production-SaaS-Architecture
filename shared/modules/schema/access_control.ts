import { pgTable, serial, text, boolean, integer } from 'drizzle-orm/pg-core';
import { auditColumns } from './audit.js';

/**
 * Menu Master Table — Master DB
 * Stores global menu definitions available to all tenants.
 */
export const menuMasterTable = pgTable('menumaster', {
  id: serial('id').primaryKey(),
  muid: text('muid').notNull().unique(), // Public UUID
  name: text('name').notNull(),
  display_name: text('display_name').notNull(),
  route: text('route'),
  parent_menu: text('parent_menu'), // References muid of parent if any
  icon_name: text('icon_name'), // Lucide icon name
  position: text('position').default('header'), // header | sidebar
  is_active: boolean('is_active').default(true).notNull(),
  sort_order: integer('sort_order').default(0).notNull(),
  is_sync: boolean('is_sync').default(false).notNull(),
  ...auditColumns,
});

/**
 * Role Master Table — Master DB
 * Stores global role definitions available to all tenants.
 */
export const roleMasterTable = pgTable('rolemaster', {
  id: serial('id').primaryKey(),
  ruid: text('ruid').notNull().unique(), // Public UUID
  assigned_role: text('assigned_role').notNull(),
  roletype: text('roletype'),
  orderby: integer('orderby').default(0),
  is_active: boolean('is_active').default(true).notNull(),
  sort_order: integer('sort_order').default(0).notNull(),
  is_sync: boolean('is_sync').default(false).notNull(),
  ...auditColumns,
});

/**
 * Role Access Table — Tenant DB
 * Maps roles to menu permissions for a specific tenant.
 * Note: Cross-DB references to menuMasterTable and roleMasterTable
 * are handled via muid and ruid respectively.
 */
export const roleAccessTable = pgTable('roleaccess', {
  id: serial('id').primaryKey(),
  rauid: text('rauid').notNull().unique(), // Public UUID
  menu_uuid: text('menu_uuid').notNull(), // References menumaster.muid
  role_uuid: text('role_uuid').notNull(), // References rolemaster.ruid
  canview: boolean('canview').default(false).notNull(),
  cancreate: boolean('cancreate').default(false).notNull(),
  canedit: boolean('canedit').default(false).notNull(),
  candelete: boolean('candelete').default(false).notNull(),
  sort_order: integer('sort_order').default(0).notNull(),
  is_sync: boolean('is_sync').default(false).notNull(),
  ...auditColumns,
});

export type MenuMaster = typeof menuMasterTable.$inferSelect;
export type NewMenuMaster = typeof menuMasterTable.$inferInsert;

export type RoleMaster = typeof roleMasterTable.$inferSelect;
export type NewRoleMaster = typeof roleMasterTable.$inferInsert;

export type RoleAccess = typeof roleAccessTable.$inferSelect;
export type NewRoleAccess = typeof roleAccessTable.$inferInsert;
