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
