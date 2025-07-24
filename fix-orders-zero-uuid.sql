-- Fix orders to show up by updating company_id from the default UUID
-- Run this in your Supabase SQL editor

-- First, let's see what we're working with
SELECT 
  id,
  customer_name,
  user_uid,
  company_id,
  created_at,
  total_amount
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;

-- Update orders that have the default company_id (all zeros) to match the user's actual company
UPDATE orders 
SET company_id = profiles.company_id
FROM profiles 
WHERE orders.user_uid = profiles.id 
  AND orders.company_id = '00000000-0000-0000-0000-000000000000';

-- Verify the fix worked
SELECT 
  id,
  customer_name,
  user_uid,
  company_id,
  created_at,
  total_amount
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;
