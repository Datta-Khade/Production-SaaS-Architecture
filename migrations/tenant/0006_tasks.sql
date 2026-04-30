-- 0006_tasks.sql
-- Tasks table for the reference CRUD module

CREATE TABLE IF NOT EXISTS tasks_v2 (
  id SERIAL PRIMARY KEY,
  uuid TEXT NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'todo',
  due_date TIMESTAMP WITH TIME ZONE,
  
  -- Audit Columns (DB-1 Standard)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL REFERENCES users_v2(uuid),
  updated_by TEXT REFERENCES users_v2(uuid),
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- Index for efficient querying by creator and status
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks_v2(created_by) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks_v2(status) WHERE is_deleted = false;
