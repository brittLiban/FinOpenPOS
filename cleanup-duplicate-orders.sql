-- Remove duplicate orders safely, handling foreign key constraints
-- Run this step by step in your Supabase SQL editor

-- STEP 1: First, let's see what we're dealing with
SELECT 
  o.id as order_id,
  o.customer_name,
  o.created_at,
  o.total_amount,
  r.id as return_id,
  r.quantity as return_quantity,
  r.reason as return_reason
FROM orders o
LEFT JOIN returns r ON o.id = r.order_id
WHERE o.company_id = 'a7703a2a-7d0a-4b1a-814a-c377e9c0e066'
ORDER BY o.created_at DESC;

-- STEP 2: Move returns from order 200 to order 199 (the surviving duplicate)
UPDATE returns 
SET order_id = 199 
WHERE order_id = 200;

-- STEP 3: Now safely delete order 200
DELETE FROM orders WHERE id = 200;

-- STEP 4: Delete order 202 if it has no returns
DELETE FROM orders 
WHERE id = 202 
  AND NOT EXISTS (SELECT 1 FROM returns WHERE order_id = 202);

-- STEP 5: Verify the cleanup worked
SELECT 
  o.id as order_id,
  o.customer_name,
  o.created_at,
  o.total_amount,
  COUNT(r.id) as return_count
FROM orders o
LEFT JOIN returns r ON o.id = r.order_id
WHERE o.company_id = 'a7703a2a-7d0a-4b1a-814a-c377e9c0e066'
GROUP BY o.id, o.customer_name, o.created_at, o.total_amount
ORDER BY o.created_at DESC;
