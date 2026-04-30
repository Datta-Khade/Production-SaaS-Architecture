-- Migration: 0001_init_master.sql
-- Description: Initialize master database with tenants table and migrations tracking
-- Applied to: Master DB (production_master)
-- NEVER modify this file after it has been applied

-- Migrations tracking table
CREATE TABLE IF NOT EXISTS _migrations (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  applied_at  TIMESTAMP DEFAULT NOW()
);

-- Tenants table — maps tuid to database connection string
CREATE TABLE IF NOT EXISTS tenants (
  id            SERIAL PRIMARY KEY,
  tuid          TEXT NOT NULL UNIQUE,           -- e.g. "acme-corp-x7f2"
  domain        TEXT NOT NULL UNIQUE,           -- e.g. "acme.production.so"
  db_url        TEXT NOT NULL,                  -- Full PostgreSQL connection string
  company_name  TEXT NOT NULL,
  plan          TEXT NOT NULL DEFAULT 'starter', -- starter | pro | enterprise
  is_active     BOOLEAN DEFAULT true,
  is_deleted    BOOLEAN DEFAULT false,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast tenant resolution
CREATE INDEX IF NOT EXISTS idx_tenants_tuid   ON tenants(tuid);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active) WHERE is_active = true;
