-- Add Stripe Connect fields to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_account_type TEXT CHECK (stripe_account_type IN ('standard', 'express', 'custom'));
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS platform_fee_percent DECIMAL(5,2) DEFAULT 2.50; -- Default 2.5% platform fee

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_companies_stripe_account_id ON companies(stripe_account_id);

-- Add comments for documentation
COMMENT ON COLUMN companies.stripe_account_id IS 'Stripe Connect account ID for this company';
COMMENT ON COLUMN companies.stripe_account_type IS 'Type of Stripe Connect account: standard, express, or custom';
COMMENT ON COLUMN companies.stripe_onboarding_complete IS 'Whether the company has completed Stripe onboarding';
COMMENT ON COLUMN companies.platform_fee_percent IS 'Platform fee percentage charged to this company';
