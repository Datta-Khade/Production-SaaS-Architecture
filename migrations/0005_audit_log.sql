-- Migration: 0005_audit_log.sql
-- Description: Audit log table for tracking critical actions
-- Applied to: Tenant DBs
-- NEVER modify this file after it has been applied

CREATE TABLE IF NOT EXISTS audit_log_v2 (
  id          SERIAL PRIMARY KEY,
  uuid        TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,

  -- Who did it
  actor_uuid  TEXT,                   -- user uuid (null = system)
  actor_email TEXT,

  -- What happened
  action      TEXT NOT NULL,          -- login | create | update | delete | approve | export
  entity      TEXT NOT NULL,          -- table/module name e.g. "users_v2"
  entity_uuid TEXT,                   -- uuid of the affected record

  -- Diff data
  before_data JSONB,
  after_data  JSONB,

  -- Request context
  ip_address  TEXT,
  request_id  TEXT,

  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor      ON audit_log_v2(actor_uuid);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity     ON audit_log_v2(entity, entity_uuid);
CREATE INDEX IF NOT EXISTS idx_audit_log_action     ON audit_log_v2(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log_v2(created_at DESC);
