-- Update products table to match application expectations
-- Run this in your Supabase SQL editor

-- Add missing columns to products table (most already exist based on schema)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image TEXT; -- Only missing column from current schema

-- Update existing records to have default company_id if needed
-- UPDATE products SET company_id = 'your-default-company-uuid' WHERE company_id IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Enable Row Level Security for multi-tenancy
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Add RLS policy (update this with your actual function)
-- CREATE POLICY "Users can only access their company's products" ON products
--   FOR ALL TO authenticated
--   USING (company_id = get_user_company_id());
