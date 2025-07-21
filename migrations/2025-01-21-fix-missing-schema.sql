-- Fix missing schema elements that are causing errors

-- Add missing columns to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add missing column to roles table
ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add missing column to user_roles table
ALTER TABLE user_roles 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Create company_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS company_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_company_id ON user_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);

-- Generate unique slugs for existing companies
UPDATE companies 
SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '''', '')) || '-' || SUBSTRING(id::TEXT FROM 1 FOR 8)
WHERE slug IS NULL;

-- Make sure all slugs are unique by adding UUID suffix to duplicates
WITH duplicate_slugs AS (
    SELECT slug, COUNT(*) as count
    FROM companies 
    WHERE slug IS NOT NULL
    GROUP BY slug 
    HAVING COUNT(*) > 1
),
companies_to_update AS (
    SELECT c.id, c.slug,
           ROW_NUMBER() OVER (PARTITION BY c.slug ORDER BY c.created_at) as rn
    FROM companies c
    INNER JOIN duplicate_slugs d ON c.slug = d.slug
)
UPDATE companies 
SET slug = companies.slug || '-' || SUBSTRING(companies.id::TEXT FROM 1 FOR 8)
FROM companies_to_update ctu
WHERE companies.id = ctu.id AND ctu.rn > 1;

-- Now add the unique constraint
ALTER TABLE companies ADD CONSTRAINT companies_slug_unique UNIQUE (slug);

-- Add RLS policies for company_users table
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see company_users for their own company
CREATE POLICY "Users can view company_users for their company" ON company_users
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy: Users can insert company_users for their company  
CREATE POLICY "Users can insert company_users for their company" ON company_users
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy: Users can update company_users for their company
CREATE POLICY "Users can update company_users for their company" ON company_users
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy: Users can delete company_users for their company
CREATE POLICY "Users can delete company_users for their company" ON company_users
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Update user_roles RLS policy to include company_id filtering
DROP POLICY IF EXISTS "Users can view their roles" ON user_roles;
CREATE POLICY "Users can view their roles" ON user_roles
    FOR SELECT USING (
        user_id = auth.uid() OR 
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );
