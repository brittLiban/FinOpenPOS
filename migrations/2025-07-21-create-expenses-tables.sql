-- Create expenses table for comprehensive expense tracking
CREATE TABLE IF NOT EXISTS expenses (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL, -- 'rent', 'utilities', 'supplies', 'marketing', 'payroll', 'insurance', 'misc', etc.
  type TEXT NOT NULL DEFAULT 'one-time', -- 'recurring', 'one-time'
  frequency TEXT, -- 'monthly', 'quarterly', 'yearly' (for recurring expenses)
  recurring_day INTEGER, -- Day of month for recurring expenses (1-31)
  start_date DATE, -- Start date for recurring expenses
  end_date DATE, -- End date for recurring expenses (optional)
  is_active BOOLEAN DEFAULT true,
  user_uid UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create expense_transactions table to track actual expense payments
CREATE TABLE IF NOT EXISTS expense_transactions (
  id BIGSERIAL PRIMARY KEY,
  expense_id BIGINT REFERENCES expenses(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT, -- 'cash', 'card', 'bank_transfer', 'check', etc.
  reference_number TEXT, -- Invoice number, check number, etc.
  notes TEXT,
  user_uid UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_company_id ON expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_uid ON expenses(user_uid);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(type);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_company_id ON expense_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_expense_id ON expense_transactions(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_payment_date ON expense_transactions(payment_date);

-- Add RLS policies for multi-tenancy
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_transactions ENABLE ROW LEVEL SECURITY;

-- Expenses policies
CREATE POLICY "Users can view expenses for their company" ON expenses
  FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can insert expenses for their company" ON expenses
  FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can update expenses for their company" ON expenses
  FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can delete expenses for their company" ON expenses
  FOR DELETE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- Expense transactions policies
CREATE POLICY "Users can view expense transactions for their company" ON expense_transactions
  FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can insert expense transactions for their company" ON expense_transactions
  FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can update expense transactions for their company" ON expense_transactions
  FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can delete expense transactions for their company" ON expense_transactions
  FOR DELETE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
