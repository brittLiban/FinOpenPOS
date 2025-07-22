
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';



// Revenue by product category, across all users
export async function GET(request: Request) {
  const supabase = createClient();

  // Join order_items with products to get category, sum price*quantity for each category
  const { data, error } = await supabase
    .from('order_items')
    .select('quantity, price, product_id, products(category)')
    .gt('quantity', 0);

  if (error) {
    console.error('Error fetching revenue by product category:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue by product category' }, { status: 500 });
  }

  // Aggregate revenue by category
  const revenueByCategory: Record<string, number> = {};
  for (const item of data || []) {
    const category = Array.isArray(item.products) ? (item.products[0]?.category || 'Uncategorized') : (item.products?.category || 'Uncategorized');
    const revenue = (item.price || 0) * (item.quantity || 0);
    if (revenueByCategory[category]) {
      revenueByCategory[category] += revenue;
    } else {
      revenueByCategory[category] = revenue;
    }
  }

  return NextResponse.json({ revenueByCategory });
}
