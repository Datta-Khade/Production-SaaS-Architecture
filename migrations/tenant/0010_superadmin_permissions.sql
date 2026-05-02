-- Migration: 0010_superadmin_permissions.sql
-- Description: Grant superadmin access to all menus
-- Applied to: Tenant DBs

-- Grant 'superadmin' (role-sa-001) access to Dashboard and Tasks
INSERT INTO roleaccess (rauid, role_uuid, menu_uuid, canview, cancreate, canedit, candelete, sort_order)
VALUES 
  ('acc-sa-db',  'role-sa-001', 'menu-db-001', true, true, true, true, 1),
  ('acc-sa-db-a','role-sa-001', 'menu-db-all', true, true, true, true, 2),
  ('acc-sa-tk',  'role-sa-001', 'menu-tk-001', true, true, true, true, 3)
ON CONFLICT (rauid) DO NOTHING;

-- Grant 'manager' (role-mg-001) access
INSERT INTO roleaccess (rauid, role_uuid, menu_uuid, canview, cancreate, canedit, candelete, sort_order)
VALUES 
  ('acc-mg-db',  'role-mg-001', 'menu-db-001', true, true, true, false, 1),
  ('acc-mg-db-a','role-mg-001', 'menu-db-all', true, true, true, false, 2),
  ('acc-mg-tk',  'role-mg-001', 'menu-tk-001', true, true, true, false, 3)
ON CONFLICT (rauid) DO NOTHING;
