-- Migration: 0008_admin_role_access.sql
-- Description: Seed initial permissions for the admin role
-- Applied to: Tenant DBs
-- NEVER modify this file after it has been applied

-- Grant 'admin' (role-ad-001) access to Dashboard and Tasks
INSERT INTO roleaccess (rauid, role_uuid, menu_uuid, canview, cancreate, canedit, candelete, sort_order)
VALUES 
  ('acc-ad-db',  'role-ad-001', 'menu-db-001', true, true, true, true, 1),
  ('acc-ad-db-a','role-ad-001', 'menu-db-all', true, true, true, true, 2),
  ('acc-ad-tk',  'role-ad-001', 'menu-tk-001', true, true, true, true, 3)
ON CONFLICT (rauid) DO NOTHING;

-- Grant 'user' (role-us-001) limited access (e.g. only Dashboard)
INSERT INTO roleaccess (rauid, role_uuid, menu_uuid, canview, cancreate, canedit, candelete, sort_order)
VALUES 
  ('acc-us-db',  'role-us-001', 'menu-db-001', true, false, false, false, 1)
ON CONFLICT (rauid) DO NOTHING;
