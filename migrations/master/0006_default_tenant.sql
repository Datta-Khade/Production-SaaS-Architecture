-- 0006_default_tenant.sql
-- Create a default tenant for development/testing

INSERT INTO tenants (tuid, domain, db_url, company_name, plan, is_active)
VALUES (
  'dev-tenant', 
  'dev.localhost', 
  'postgresql://postgres:sailadmin@postgres:5432/tenant_db', 
  'Development Company', 
  'enterprise', 
  true
)
ON CONFLICT (tuid) DO NOTHING;
