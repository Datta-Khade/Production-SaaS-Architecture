-- Migration: 0011_admin_menu_access.sql
-- Description: Grant Admin menu access to superadmin and admin roles
-- Applied to: Tenant DBs

-- Grant 'superadmin' (role-sa-001) access to all admin menus
INSERT INTO roleaccess (rauid, role_uuid, menu_uuid, canview, cancreate, canedit, candelete, sort_order)
VALUES 
  ('acc-sa-adm',     'role-sa-001', 'menu-adm-001',   true, true, true, true, 4),
  ('acc-sa-adm-usr', 'role-sa-001', 'menu-adm-users', true, true, true, true, 1),
  ('acc-sa-adm-rol', 'role-sa-001', 'menu-adm-roles', true, true, true, true, 2)
ON CONFLICT (rauid) DO NOTHING;

-- Grant 'admin' (role-ad-001) access to admin menus
INSERT INTO roleaccess (rauid, role_uuid, menu_uuid, canview, cancreate, canedit, candelete, sort_order)
VALUES 
  ('acc-ad-adm',     'role-ad-001', 'menu-adm-001',   true, true, true, false, 4),
  ('acc-ad-adm-usr', 'role-ad-001', 'menu-adm-users', true, true, true, false, 1),
  ('acc-ad-adm-rol', 'role-ad-001', 'menu-adm-roles', true, true, true, false, 2)
ON CONFLICT (rauid) DO NOTHING;
