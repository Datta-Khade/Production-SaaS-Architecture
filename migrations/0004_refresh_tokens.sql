-- Migration: 0004_refresh_tokens.sql
-- Description: Refresh tokens stored hashed in DB per device/session
-- NEVER modify this file after it has been applied

CREATE TABLE IF NOT EXISTS refresh_tokens_v2 (
  id          SERIAL PRIMARY KEY,
  uuid        TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  user_uuid   TEXT NOT NULL,
  token_hash  TEXT NOT NULL UNIQUE,    -- bcrypt hash of refresh token
  device      TEXT,                    -- optional device/browser label
  ip_address  TEXT,
  expires_at  TIMESTAMP NOT NULL,
  is_revoked  BOOLEAN NOT NULL DEFAULT false,

  -- Audit
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_uuid  ON refresh_tokens_v2(user_uuid);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash       ON refresh_tokens_v2(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active     ON refresh_tokens_v2(is_revoked, expires_at)
  WHERE is_revoked = false;
