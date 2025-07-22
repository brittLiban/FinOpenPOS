-- Disable RLS for expenses tables since we're using application-level security
-- This matches the pattern used by other tables in the system

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view expenses for their company" ON expenses;
DROP POLICY IF EXISTS "Users can insert expenses for their company" ON expenses;
DROP POLICY IF EXISTS "Users can update expenses for their company" ON expenses;
DROP POLICY IF EXISTS "Users can delete expenses for their company" ON expenses;

DROP POLICY IF EXISTS "Users can view expense transactions for their company" ON expense_transactions;
DROP POLICY IF EXISTS "Users can insert expense transactions for their company" ON expense_transactions;
DROP POLICY IF EXISTS "Users can update expense transactions for their company" ON expense_transactions;
DROP POLICY IF EXISTS "Users can delete expense transactions for their company" ON expense_transactions;

-- Disable RLS (use application-level security instead)
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE expense_transactions DISABLE ROW LEVEL SECURITY;
