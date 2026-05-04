-- 0014_default_admin.sql
-- Create a default superadmin user

INSERT INTO users_v2 (
  uuid, 
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  role, 
  is_active
)
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'admin@dev.localhost', 
  'admin@dev.localhost', 
  '$2a$12$Z5sQVZU2BCjzwbea.5TzYOOAS11aSSHgoyr3sxqMuik.40UbgRDQO', -- Admin@1234
  'Super', 
  'Admin', 
  'superadmin', 
  true
)
ON CONFLICT (email) DO NOTHING;
