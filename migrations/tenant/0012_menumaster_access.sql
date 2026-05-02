-- Migration: 0012_menumaster_access.sql
-- Description: Grant Menu Management access to superadmin
-- Applied to: Tenant DBs

INSERT INTO roleaccess (rauid, role_uuid, menu_uuid, canview, cancreate, canedit, candelete, sort_order)
VALUES 
  ('acc-sa-adm-men', 'role-sa-001', 'menu-adm-menus', true, true, true, true, 3)
ON CONFLICT (rauid) DO NOTHING;
