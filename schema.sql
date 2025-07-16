-- Add archived column to products table
ALTER TABLE products ADD COLUMN archived boolean NOT NULL DEFAULT false;
-- Drop tables if they exist
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS payment_methods;

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    in_stock INTEGER DEFAULT 0,
    user_uid UUID NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    barcode TEXT,
    low_stock_threshold INTEGER DEFAULT 5,
    stripe_product_id TEXT,
    stripe_price_id TEXT,
    archived BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    user_uid UUID NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT REFERENCES customers(id),
    total_amount NUMERIC NOT NULL,
    user_uid UUID NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    payment_method_id INTEGER,
    amount_total BIGINT,
    stripe_session_id TEXT,
    customer_email TEXT,
    customer_name TEXT,
    payment_method_name TEXT
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id),
    product_id BIGINT REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price NUMERIC NOT NULL,
    user_uid UUID NOT NULL
);

CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    description TEXT,
    order_id INTEGER REFERENCES orders(id),
    payment_method_id INTEGER REFERENCES payment_methods(id),
    amount NUMERIC NOT NULL,
    user_uid UUID NOT NULL,
    type TEXT,
    category TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert initial payment methods
INSERT INTO payment_methods (name) VALUES ('Credit Card'), ('Debit Card'), ('Cash');