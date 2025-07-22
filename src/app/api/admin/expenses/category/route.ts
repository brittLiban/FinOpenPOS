
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';



// Top 10 selling products by revenue or quantity, with date range filter
export async function GET(request: Request) {
  const supabase = createClient();

  // Join order_items with products to get product name, sum price*quantity for each product
  const { data, error } = await supabase
    .from('order_items')
    .select('quantity, price, product_id, products(name)')
    .gt('quantity', 0);

  if (error) {
    console.error('Error fetching top selling products:', error);
    return NextResponse.json({ error: 'Failed to fetch top selling products' }, { status: 500 });
  }

  // Aggregate revenue and quantity by product
  const productStats: Record<string, { name: string, revenue: number, quantity: number }> = {};
  for (const item of data || []) {
    let name = 'Unnamed';
    if (item.products && typeof item.products === 'object') {
      if (Array.isArray(item.products)) {
        name = item.products[0]?.name || 'Unnamed';
      } else if ('name' in item.products) {
        name = (item.products as any).name || 'Unnamed';
      }
    }
    const revenue = (item.price || 0) * (item.quantity || 0);
    const quantity = item.quantity || 0;
    if (productStats[name]) {
      productStats[name].revenue += revenue;
      productStats[name].quantity += quantity;
    } else {
      productStats[name] = { name, revenue, quantity };
    }
  }

  // Get top 10 by revenue (default)
  const topProducts = Object.values(productStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Also return all stats for client-side toggling
  return NextResponse.json({ topProducts, allProductStats: Object.values(productStats) });
}
