-- Table for global settings (e.g., tax rate)
CREATE TABLE IF NOT EXISTS settings (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default tax rate (8.25%) if not exists
INSERT INTO settings (key, value)
SELECT 'tax_rate', '8.25'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'tax_rate');
-- Table for employee management
CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  user_uid UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_employees_user_uid ON employees(user_uid);
-- Audit log table for tracking all user actions
-- Tracks all CRUD actions, including employee management, product, order, etc.
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- e.g. 'create', 'update', 'delete', 'transaction', etc.
    entity_type TEXT NOT NULL, -- e.g. 'employee', 'product', 'order', etc.
    entity_id TEXT,            -- ID of the affected entity (string for flexibility)
    details JSONB,             -- Arbitrary details about the change
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by user and time
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
-- Table for sidebar permissions (per user or per role)
CREATE TABLE IF NOT EXISTS sidebar_permissions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id), -- nullable, for per-user permissions
  role_id INTEGER REFERENCES roles(id), -- nullable, for per-role permissions
  item_key TEXT NOT NULL, -- matches SIDEBAR_ITEMS key
  enabled BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, item_key),
  UNIQUE(role_id, item_key)
);
-- Table for tracking product returns
CREATE TABLE IF NOT EXISTS returns (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id),
  product_id BIGINT REFERENCES products(id),
  quantity INTEGER NOT NULL,
  reason TEXT,
  user_uid UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
