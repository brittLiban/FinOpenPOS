-- Debug: Check for recent orders and webhook activity
-- Run this in your Supabase SQL editor

-- 1. Check all recent orders (last 24 hours)
SELECT 
  id,
  customer_name,
  customer_email,
  total_amount,
  status,
  stripe_session_id,
  user_uid,
  company_id,
  created_at
FROM orders 
WHERE created_at > now() - interval '24 hours'
ORDER BY created_at DESC;

-- 2. Check recent processed sessions (webhook tracking)
SELECT 
  session_id,
  processed_at,
  company_id
FROM processed_sessions 
WHERE processed_at > now() - interval '24 hours'
ORDER BY processed_at DESC;

-- 3. Check recent transactions
SELECT 
  id,
  description,
  amount,
  status,
  stripe_session_id,
  user_uid,
  company_id,
  created_at
FROM transactions 
WHERE created_at > now() - interval '24 hours'
ORDER BY created_at DESC;

-- 4. Check your specific company and user IDs
SELECT 
  'Your user ID' as label,
  id as value
FROM profiles 
WHERE company_id = 'a7703a2a-7d0a-4b1a-814a-c377e9c0e066'
UNION ALL
SELECT 
  'Your company ID' as label,
  'a7703a2a-7d0a-4b1a-814a-c377e9c0e066' as value;
