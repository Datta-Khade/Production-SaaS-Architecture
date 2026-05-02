-- Migration: 0003_navigation_metadata.sql
-- Description: Add icon_name and position to menumaster, and seed initial roles/menus
-- Applied to: Master DB
-- NEVER modify this file after it has been applied

-- 1. Alter table
ALTER TABLE menumaster ADD COLUMN IF NOT EXISTS icon_name TEXT;
ALTER TABLE menumaster ADD COLUMN IF NOT EXISTS position TEXT DEFAULT 'header';

-- 2. Seed Initial Roles
INSERT INTO rolemaster (ruid, assigned_role, roletype, orderby, is_active, sort_order)
VALUES 
  ('role-sa-001', 'superadmin', 'system', 3, true, 1),
  ('role-ad-001', 'admin',      'system', 2, true, 2),
  ('role-mg-001', 'manager',    'system', 1, true, 3),
  ('role-us-001', 'user',       'system', 0, true, 4)
ON CONFLICT (ruid) DO NOTHING;

-- 3. Seed Initial Menus (Header)
INSERT INTO menumaster (muid, name, display_name, route, icon_name, position, sort_order)
VALUES 
  ('menu-db-001', 'Dashboard', 'Dashboard', '/dashboard', 'BarChart3', 'header', 1),
  ('menu-tk-001', 'Tasks',     'Tasks',     '/tasks',     'FileText',  'header', 2)
ON CONFLICT (muid) DO NOTHING;

-- 4. Seed Sidebar Items (Children of Dashboard)
INSERT INTO menumaster (muid, name, display_name, route, icon_name, position, parent_menu, sort_order)
VALUES 
  ('menu-db-all', 'All', 'All', '/dashboard', 'LayoutGrid', 'sidebar', 'menu-db-001', 1)
ON CONFLICT (muid) DO NOTHING;
