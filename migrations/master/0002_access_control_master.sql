-- Migration: 0002_access_control_master.sql
-- Description: Create menumaster and rolemaster tables in Master DB
-- Applied to: Master DB
-- NEVER modify this file after it has been applied

-- Menu Master Table
CREATE TABLE IF NOT EXISTS menumaster (
  id              SERIAL PRIMARY KEY,
  muid            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  display_name    TEXT NOT NULL,
  route           TEXT,
  parent_menu     TEXT,
  is_active       BOOLEAN DEFAULT true NOT NULL,
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

-- Role Master Table
CREATE TABLE IF NOT EXISTS rolemaster (
  id              SERIAL PRIMARY KEY,
  ruid            TEXT NOT NULL UNIQUE,
  assigned_role   TEXT NOT NULL,
  roletype        TEXT,
  orderby         INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT true NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_menumaster_muid ON menumaster(muid);
CREATE INDEX IF NOT EXISTS idx_rolemaster_ruid ON rolemaster(ruid);
CREATE INDEX IF NOT EXISTS idx_menumaster_active ON menumaster(is_active) WHERE is_active = true AND is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_rolemaster_active ON rolemaster(is_active) WHERE is_active = true AND is_deleted = false;
