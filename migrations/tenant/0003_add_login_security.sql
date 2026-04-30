-- Migration: 0003_add_login_security.sql
-- Description: Add login attempt locking columns to users_v2
-- NEVER modify this file after it has been applied

ALTER TABLE users_v2
  ADD COLUMN IF NOT EXISTS username          TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS failed_login_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until       TIMESTAMP NULL;

-- Allow lookup by username
CREATE INDEX IF NOT EXISTS idx_users_v2_username ON users_v2(username);

-- Backfill: set username = email for existing rows
UPDATE users_v2 SET username = email WHERE username IS NULL;
