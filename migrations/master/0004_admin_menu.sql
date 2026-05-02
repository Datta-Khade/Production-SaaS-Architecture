-- Migration: 0004_admin_menu.sql
-- Description: Add Admin header and sub-menus to Master DB
-- Applied to: Master DB

-- 1. Add Admin Header
INSERT INTO menumaster (muid, name, display_name, route, parent_menu, is_active, sort_order, icon_name, position)
VALUES 
  ('menu-adm-001', 'Admin', 'Admin', '/admin', NULL, true, 4, 'Shield', 'header')
ON CONFLICT (muid) DO NOTHING;

-- 2. Add Admin Sub-menus (Sidebar)
INSERT INTO menumaster (muid, name, display_name, route, parent_menu, is_active, sort_order, icon_name, position)
VALUES 
  ('menu-adm-users', 'User Management', 'Users', '/admin/users', 'menu-adm-001', true, 1, 'Users', 'sidebar'),
  ('menu-adm-roles', 'Role Management', 'Roles', '/admin/roles', 'menu-adm-001', true, 2, 'Lock', 'sidebar')
ON CONFLICT (muid) DO NOTHING;
