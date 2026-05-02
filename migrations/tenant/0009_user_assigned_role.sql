-- Migration: 0009_user_assigned_role.sql
-- Description: Add assigned_role column to users_v2 to link with dynamic RBAC
-- Applied to: Tenant DBs
-- NEVER modify this file after it has been applied

-- 1. Add column
ALTER TABLE users_v2 ADD COLUMN IF NOT EXISTS assigned_role TEXT;

-- 2. Migrate existing 'role' values to 'assigned_role'
UPDATE users_v2 SET assigned_role = role WHERE assigned_role IS NULL;

-- 3. Add index
CREATE INDEX IF NOT EXISTS idx_users_v2_assigned_role ON users_v2(assigned_role);
