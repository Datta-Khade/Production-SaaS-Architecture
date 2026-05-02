-- Migration: 0007_role_access_tenant.sql
-- Description: Create roleaccess table in Tenant DB
-- Applied to: Tenant DBs
-- NEVER modify this file after it has been applied

CREATE TABLE IF NOT EXISTS roleaccess (
  id              SERIAL PRIMARY KEY,
  rauid           TEXT NOT NULL UNIQUE,
  menu_uuid       TEXT NOT NULL,            -- References menumaster.muid (Cross-DB)
  role_uuid       TEXT NOT NULL,            -- References rolemaster.ruid (Cross-DB)
  canview         BOOLEAN DEFAULT false NOT NULL,
  cancreate       BOOLEAN DEFAULT false NOT NULL,
  canedit         BOOLEAN DEFAULT false NOT NULL,
  candelete       BOOLEAN DEFAULT false NOT NULL,
  sort_order      INTEGER DEFAULT 0 NOT NULL,
  is_sync         BOOLEAN DEFAULT false NOT NULL,

  -- Audit columns
  created_at      TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMP DEFAULT NOW() NOT NULL,
  created_by_uuid TEXT,
  updated_by_uuid TEXT,
  is_deleted      BOOLEAN DEFAULT false NOT NULL,
  deleted_at      TIMESTAMP,
  deleted_by_uuid TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_roleaccess_rauid     ON roleaccess(rauid);
CREATE INDEX IF NOT EXISTS idx_roleaccess_menu_uuid ON roleaccess(menu_uuid);
CREATE INDEX IF NOT EXISTS idx_roleaccess_role_uuid ON roleaccess(role_uuid);
CREATE INDEX IF NOT EXISTS idx_roleaccess_active    ON roleaccess(is_deleted) WHERE is_deleted = false;
