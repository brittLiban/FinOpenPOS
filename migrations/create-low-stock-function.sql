-- Create function for efficient low stock queries
CREATE OR REPLACE FUNCTION get_low_stock_products()
RETURNS TABLE (
  id INTEGER,
  name TEXT,
  in_stock INTEGER,
  low_stock_threshold INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.in_stock,
    p.low_stock_threshold
  FROM products p
  WHERE p.archived = false 
    AND p.in_stock <= p.low_stock_threshold
    AND p.low_stock_threshold IS NOT NULL
    AND p.in_stock IS NOT NULL
  ORDER BY (p.low_stock_threshold - p.in_stock) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_low_stock_products() TO authenticated;
