-- Add multi-tenant fields to companies table
-- Run this in your Supabase SQL editor

-- Add subdomain and Stripe fields to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS subdomain VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS business_type VARCHAR(50) DEFAULT 'retail',
ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS platform_fee_percentage DECIMAL(5,2) DEFAULT 2.5,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add index for subdomain lookups
CREATE INDEX IF NOT EXISTS idx_companies_subdomain ON companies(subdomain);
CREATE INDEX IF NOT EXISTS idx_companies_stripe_account ON companies(stripe_account_id);

-- Add additional fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100), 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a function to generate unique subdomains
CREATE OR REPLACE FUNCTION generate_unique_subdomain(company_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_subdomain TEXT;
    final_subdomain TEXT;
    counter INTEGER := 1;
    exists_check BOOLEAN;
BEGIN
    -- Generate base subdomain from company name
    base_subdomain := LOWER(
        TRIM(
            REGEXP_REPLACE(
                REGEXP_REPLACE(company_name, '[^a-zA-Z0-9]', '-', 'g'),
                '-+', '-', 'g'
            ),
            '-'
        )
    );
    
    -- Ensure it's not too long
    base_subdomain := SUBSTRING(base_subdomain FROM 1 FOR 20);
    
    -- Check if base subdomain is available
    final_subdomain := base_subdomain;
    
    LOOP
        SELECT EXISTS(SELECT 1 FROM companies WHERE subdomain = final_subdomain) INTO exists_check;
        
        IF NOT exists_check THEN
            EXIT; -- Subdomain is available
        END IF;
        
        final_subdomain := base_subdomain || counter::TEXT;
        counter := counter + 1;
    END LOOP;
    
    RETURN final_subdomain;
END;
$$ LANGUAGE plpgsql;

-- Create table for tracking Stripe webhook events (prevent duplicates)
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_stripe_id ON stripe_webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_company ON stripe_webhook_events(company_id);

-- Update RLS policies for new fields
-- Allow users to read their own company's subdomain (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own company subdomain' AND tablename = 'companies') THEN
        CREATE POLICY "Users can read own company subdomain" ON companies
            FOR SELECT USING (
                auth.uid() IN (
                    SELECT id FROM profiles WHERE company_id = companies.id
                )
            );
    END IF;
END $$;

COMMENT ON TABLE companies IS 'Stores company information with multi-tenant support';
COMMENT ON COLUMN companies.subdomain IS 'Unique subdomain for multi-tenant access (e.g., company.yourpos.com)';
COMMENT ON COLUMN companies.stripe_account_id IS 'Stripe Connect account ID for payment processing';
COMMENT ON COLUMN companies.platform_fee_percentage IS 'Platform fee percentage for Stripe transactions';
