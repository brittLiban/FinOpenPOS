-- Sample products with barcodes for testing the barcode scanner
-- Run this script to populate your database with test products

-- First, let's add some sample products with various barcode formats
INSERT INTO products (name, price, in_stock, barcode, category, company_id, created_at) VALUES
  ('Coca-Cola 12oz Can', 1.99, 50, '049000050202', 'Beverages', 1, NOW()),
  ('Snickers Chocolate Bar', 2.49, 25, '040000485285', 'Candy', 1, NOW()),
  ('Bananas (per lb)', 0.89, 100, '4011', 'Produce', 1, NOW()),
  ('Bread Loaf - Wonder', 3.29, 15, '072250003032', 'Bakery', 1, NOW()),
  ('Milk 1 Gallon - 2%', 4.99, 20, '011110087546', 'Dairy', 1, NOW()),
  ('iPhone Lightning Cable', 19.99, 10, '190198001787', 'Electronics', 1, NOW()),
  ('Tide Laundry Detergent', 12.99, 8, '037000137887', 'Household', 1, NOW()),
  ('Red Bull Energy Drink', 3.99, 30, '9002490100084', 'Beverages', 1, NOW()),
  ('Kleenex Tissues', 4.49, 12, '036000997811', 'Household', 1, NOW()),
  ('Kit Kat Chocolate Bar', 1.79, 40, '034000002634', 'Candy', 1, NOW());

-- Note: These are real UPC barcodes for common products
-- You can test these barcodes with your scanner

-- To test, you can:
-- 1. Go to /admin/checkout
-- 2. Scan or manually enter any of these barcodes:
--    - 049000050202 (Coca-Cola)
--    - 040000485285 (Snickers)
--    - 4011 (Bananas - short format)
--    - 190198001787 (iPhone Cable)
--    - 9002490100084 (Red Bull - EAN-13)

-- Test cases:
-- ✅ Existing barcode → Should auto-add to cart
-- ✅ Unknown barcode → Should prompt to create new product  
-- ✅ Multiple scans → Should increase quantity
-- ✅ Manual entry → Should work same as scanning
