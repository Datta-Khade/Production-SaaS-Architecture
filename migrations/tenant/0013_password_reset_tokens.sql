-- 0013_password_reset_tokens.sql
-- Store hashed password reset tokens for users.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uuid TEXT NOT NULL REFERENCES users_v2(uuid) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for cleanup and lookup
CREATE INDEX IF NOT EXISTS idx_reset_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_reset_token_user ON password_reset_tokens(user_uuid);
CREATE INDEX IF NOT EXISTS idx_reset_token_expires ON password_reset_tokens(expires_at) WHERE is_used = false;
