-- Migration: 0012_menumaster_access.sql
-- Description: Grant Menu Management access to superadmin
-- Applied to: Tenant DBs

INSERT INTO roleaccess (rauid, role_uuid, menu_uuid, canview, cancreate, canedit, candelete, sort_order)
VALUES 
  ('acc-sa-adm-men', 'role-sa-001', 'menu-adm-menus', true, true, true, true, 3),
  ('ra-adm-access-sa','role-sa-001', 'menu-adm-access',true, true, true, true, 4)
ON CONFLICT (rauid) DO NOTHING;

-- Ensure Admin header and submenus for superadmin
INSERT INTO roleaccess (rauid, menu_uuid, role_uuid, canview, cancreate, canedit, candelete, is_sync)
VALUES 
  ('ra-adm-header-sa', 'menu-adm-001',   'role-sa-001', true, true, true, true, true),
  ('ra-adm-users-sa',  'menu-adm-users', 'role-sa-001', true, true, true, true, true),
  ('ra-adm-roles-sa',  'menu-adm-roles', 'role-sa-001', true, true, true, true, true)
ON CONFLICT (rauid) DO NOTHING;
