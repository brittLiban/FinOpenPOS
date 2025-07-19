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
