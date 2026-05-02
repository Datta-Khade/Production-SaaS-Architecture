-- Migration: 0005_menumaster_mgmt.sql
-- Description: Add Menu Management to Admin module
-- Applied to: Master DB

INSERT INTO menumaster (muid, name, display_name, route, parent_menu, is_active, sort_order, icon_name, position)
VALUES 
  ('menu-adm-menus', 'Menu Management', 'Menus', '/admin/menus', 'menu-adm-001', true, 3, 'Menu', 'sidebar')
ON CONFLICT (muid) DO NOTHING;
