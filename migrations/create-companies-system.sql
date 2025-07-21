-- Companies table for SaaS tenant management
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'US',
  postal_code TEXT,
  website TEXT,
  
  -- Subscription/billing info
  subscription_status TEXT DEFAULT 'trial', -- trial, active, suspended, cancelled
  subscription_plan TEXT DEFAULT 'basic', -- basic, pro, enterprise
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '14 days'),
  subscription_ends_at TIMESTAMPTZ,
  
  -- Usage limits
  max_users INTEGER DEFAULT 5,
  max_products INTEGER DEFAULT 1000,
  max_orders_per_month INTEGER DEFAULT 500,
  
  -- Feature flags
  features JSONB DEFAULT '{}', -- {"advanced_reporting": true, "api_access": false}
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Billing
  stripe_customer_id TEXT UNIQUE,
  billing_email TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_subscription_status ON companies(subscription_status);
CREATE INDEX IF NOT EXISTS idx_companies_stripe_customer_id ON companies(stripe_customer_id);

-- Company admins table (first user becomes owner)
CREATE TABLE IF NOT EXISTS company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member
  joined_at TIMESTAMPTZ DEFAULT now(),
  invited_by UUID REFERENCES profiles(id),
  
  UNIQUE(company_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON company_users(user_id);

-- Company invitations
CREATE TABLE IF NOT EXISTS company_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES profiles(id),
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(company_id, email)
);

-- Usage tracking for billing
CREATE TABLE IF NOT EXISTS company_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- users, products, orders, api_calls
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  
  UNIQUE(company_id, metric_type, period_start)
);

-- RLS for company tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_usage ENABLE ROW LEVEL SECURITY;

-- Company RLS policies
CREATE POLICY "Users can only see their own company" ON companies
  FOR ALL TO authenticated
  USING (id = auth.get_user_company_id());

CREATE POLICY "Company users can see their company relationships" ON company_users
  FOR ALL TO authenticated
  USING (company_id = auth.get_user_company_id());

CREATE POLICY "Company admins can manage invitations" ON company_invitations
  FOR ALL TO authenticated
  USING (company_id = auth.get_user_company_id());

CREATE POLICY "Company admins can see usage data" ON company_usage
  FOR ALL TO authenticated
  USING (company_id = auth.get_user_company_id());
