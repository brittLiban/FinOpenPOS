import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();

    // Query for low stock products directly
    const { data, error } = await supabase
      .from('products')
      .select('id, name, in_stock, low_stock_threshold')
      .eq('archived', false)
      .not('low_stock_threshold', 'is', null);

    if (error) {
      console.error('Low stock query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter for products where in_stock <= low_stock_threshold
    const lowStockProducts = data?.filter(product => 
      product.in_stock <= product.low_stock_threshold
    ) || [];

    return NextResponse.json({ lowStock: lowStockProducts });
  } catch (err: any) {
    console.error('Unexpected error in low-stock route:', err);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: err.message 
    }, { status: 500 });
  }
}
