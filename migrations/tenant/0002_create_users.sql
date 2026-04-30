-- Migration: 0002_create_users.sql
-- Description: Create users table for tenant databases
-- Applied to: Tenant DBs
-- NEVER modify this file after it has been applied

CREATE TABLE IF NOT EXISTS users_v2 (
  id              SERIAL PRIMARY KEY,
  uuid            TEXT NOT NULL UNIQUE,
  username        TEXT UNIQUE,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'user',     -- superadmin | admin | manager | user
  is_active       BOOLEAN DEFAULT true NOT NULL,

  -- Audit columns (MANDATORY on every table)
  created_at      TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMP DEFAULT NOW() NOT NULL,
  created_by_uuid TEXT,
  updated_by_uuid TEXT,
  is_deleted      BOOLEAN DEFAULT false NOT NULL,
  deleted_at      TIMESTAMP,
  deleted_by_uuid TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_v2_uuid       ON users_v2(uuid);
CREATE INDEX IF NOT EXISTS idx_users_v2_username   ON users_v2(username);
CREATE INDEX IF NOT EXISTS idx_users_v2_email      ON users_v2(email);
CREATE INDEX IF NOT EXISTS idx_users_v2_role       ON users_v2(role);
CREATE INDEX IF NOT EXISTS idx_users_v2_active     ON users_v2(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_v2_not_deleted ON users_v2(is_deleted) WHERE is_deleted = false;
