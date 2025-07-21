-- Row Level Security (RLS) Policies for Multi-Tenant Security
-- This is CRITICAL for production SaaS to prevent data leaks between tenants

-- Enable RLS on all tables with company_id
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sidebar_permissions ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's company_id
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
BEGIN
  -- Get company_id from profiles table for current authenticated user
  RETURN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for each table

-- Profiles: Users can only see profiles in their company
CREATE POLICY "Users can only access their company's profiles" ON profiles
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id());

-- Customers: Company-scoped access
CREATE POLICY "Users can only access their company's customers" ON customers
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id());

-- Employees: Company-scoped access
CREATE POLICY "Users can only access their company's employees" ON employees
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id());

-- Products: Company-scoped access
CREATE POLICY "Users can only access their company's products" ON products
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id());

-- Orders: Company-scoped access
CREATE POLICY "Users can only access their company's orders" ON orders
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id());

-- Order Items: Company-scoped access
CREATE POLICY "Users can only access their company's order items" ON order_items
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id());

-- Transactions: Company-scoped access
CREATE POLICY "Users can only access their company's transactions" ON transactions
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id());

-- Returns: Company-scoped access
CREATE POLICY "Users can only access their company's returns" ON returns
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id());

-- Settings: Company-scoped access
CREATE POLICY "Users can only access their company's settings" ON settings
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id());

-- Audit Log: Company-scoped access
CREATE POLICY "Users can only access their company's audit log" ON audit_log
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id());

-- User Roles: Tenant-scoped access
CREATE POLICY "Users can only access roles in their tenant" ON user_roles
  FOR ALL TO authenticated
  USING (tenant_id::UUID = get_user_company_id());

-- Sidebar Permissions: Users can only manage permissions for their company users/roles
CREATE POLICY "Users can only manage permissions for their company" ON sidebar_permissions
  FOR ALL TO authenticated
  USING (
    -- For user-specific permissions: check if the user belongs to same company
    (user_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = sidebar_permissions.user_id 
      AND company_id = get_user_company_id()
    )) OR
    -- For role-specific permissions: check if the role belongs to same company
    (role_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM roles 
      WHERE id = sidebar_permissions.role_id 
      AND company_id = get_user_company_id()
    ))
  );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_company_id TO authenticated;
