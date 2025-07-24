-- Development Stripe setup for company
-- Run this in your Supabase SQL editor to enable Stripe sync in development

-- First, let's see what companies exist
-- SELECT id, name, stripe_account_id, stripe_charges_enabled FROM companies;

-- Update your company with a test Stripe account ID
-- Replace 'your-company-id-here' with your actual company ID from above query
UPDATE companies 
SET 
  stripe_account_id = 'acct_dev_test_' || substr(id::text, 1, 8),  -- Creates a test account ID
  stripe_charges_enabled = true,
  stripe_payouts_enabled = false,  -- Keep false for development
  stripe_onboarding_complete = false  -- Keep false since this is just for testing
WHERE id = 'a7703a2a-7d0a-4b1a-814a-c377e9c0e066';  -- Your company ID from the logs

-- Verify the update
SELECT id, name, stripe_account_id, stripe_charges_enabled, stripe_onboarding_complete 
FROM companies 
WHERE id = 'a7703a2a-7d0a-4b1a-814a-c377e9c0e066';
