-- Performance Indexes for Multi-Tenant FinOpenPOS
-- These indexes will dramatically improve query performance for company-scoped data

-- Company ID indexes for multi-tenant isolation (CRITICAL for performance)
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_company_id ON orders(company_id);
CREATE INDEX IF NOT EXISTS idx_order_items_company_id ON order_items(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_company_id ON transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_returns_company_id ON returns(company_id);
CREATE INDEX IF NOT EXISTS idx_roles_company_id ON roles(company_id);
CREATE INDEX IF NOT EXISTS idx_settings_company_id ON settings(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_company_id ON payment_methods(company_id);
-- Note: sidebar_permissions doesn't have company_id, uses foreign key relationships
CREATE INDEX IF NOT EXISTS idx_processed_sessions_company_id ON processed_sessions(company_id);

-- User-based indexes for fast user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_uid ON customers(user_uid);
CREATE INDEX IF NOT EXISTS idx_employees_user_uid ON employees(user_uid);
CREATE INDEX IF NOT EXISTS idx_products_user_uid ON products(user_uid);
CREATE INDEX IF NOT EXISTS idx_orders_user_uid ON orders(user_uid);
CREATE INDEX IF NOT EXISTS idx_order_items_user_uid ON order_items(user_uid);
CREATE INDEX IF NOT EXISTS idx_transactions_user_uid ON transactions(user_uid);
CREATE INDEX IF NOT EXISTS idx_returns_user_uid ON returns(user_uid);

-- User roles and permissions (critical for auth)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sidebar_permissions_user_id ON sidebar_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_sidebar_permissions_role_id ON sidebar_permissions(role_id);

-- Foreign key indexes for joins
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method_id ON orders(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_product_id ON returns(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method_id ON transactions(payment_method_id);

-- Email lookups (common for user management)
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Date-based indexes for reporting and analytics
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_employees_created_at ON employees(created_at);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_returns_created_at ON returns(created_at);

-- Product-specific indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_archived ON products(archived);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;

-- Order status for filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- Settings key lookup
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Stripe integration indexes
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_stripe_product_id ON products(stripe_product_id) WHERE stripe_product_id IS NOT NULL;

-- Composite indexes for common query patterns
-- Company + User queries (very common in multi-tenant apps)
CREATE INDEX IF NOT EXISTS idx_customers_company_user ON customers(company_id, user_uid);
CREATE INDEX IF NOT EXISTS idx_products_company_user ON products(company_id, user_uid);
CREATE INDEX IF NOT EXISTS idx_orders_company_user ON orders(company_id, user_uid);

-- Company + Date queries (for reporting)
CREATE INDEX IF NOT EXISTS idx_orders_company_date ON orders(company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_company_date ON transactions(company_id, created_at);

-- Company + Status queries
CREATE INDEX IF NOT EXISTS idx_orders_company_status ON orders(company_id, status);
CREATE INDEX IF NOT EXISTS idx_customers_company_status ON customers(company_id, status);

-- Low stock product monitoring
CREATE INDEX IF NOT EXISTS idx_products_company_stock ON products(company_id, in_stock, low_stock_threshold);

-- Comments explaining the benefits
/*
PERFORMANCE BENEFITS:

1. Company ID Indexes:
   - Make multi-tenant queries 10-100x faster
   - Essential for WHERE company_id = 'xxx' filters
   
2. User UID Indexes:
   - Fast user-specific data retrieval
   - Critical for user dashboards and permissions
   
3. Foreign Key Indexes:
   - Speed up JOINs between tables
   - Prevent full table scans on relationships
   
4. Date Indexes:
   - Fast filtering by date ranges
   - Essential for reports and analytics
   
5. Composite Indexes:
   - Optimize common multi-column queries
   - Cover company + user, company + date patterns
   
6. Partial Indexes:
   - Save space by only indexing non-null values
   - Useful for optional fields like barcode, stripe_session_id

USAGE IMPACT:
- Queries filtering by company_id will be 10-100x faster
- User dashboards will load much quicker
- Reports and analytics will be responsive
- JOIN operations between tables will be optimized
*/
