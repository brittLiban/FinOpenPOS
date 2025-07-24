-- Fix existing orders to have proper company_id
-- Run this in your Supabase SQL editor

-- Update orders that have user_uid but missing/null company_id
UPDATE orders 
SET company_id = profiles.company_id
FROM profiles 
WHERE orders.user_uid = profiles.id 
  AND (orders.company_id IS NULL OR orders.company_id = '00000000-0000-0000-0000-000000000000');

-- Verify the update
SELECT 
  id,
  customer_name,
  user_uid,
  company_id,
  created_at,
  total_amount
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;
