-- Add platform fee percentage to companies table
-- This allows different companies to have different platform fee rates

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS platform_fee_percentage DECIMAL(5,4) DEFAULT 0.025; -- Default to 2.5%

-- Add index for platform fee queries
CREATE INDEX IF NOT EXISTS idx_companies_platform_fee ON companies(platform_fee_percentage);

-- Update existing companies to have the default platform fee if null
UPDATE companies 
SET platform_fee_percentage = 0.025 
WHERE platform_fee_percentage IS NULL;

-- Add comment explaining the field
COMMENT ON COLUMN companies.platform_fee_percentage IS 'Platform fee percentage (e.g., 0.025 = 2.5%)';
