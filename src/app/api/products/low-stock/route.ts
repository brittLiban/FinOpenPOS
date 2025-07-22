import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();

  // Use a database function or view for better performance
  const { data, error } = await supabase
    .rpc('get_low_stock_products');

  if (error) {
    // Fallback to manual query if RPC doesn't exist
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('products')
      .select('id, name, in_stock, low_stock_threshold')
      .eq('archived', false)
      .filter('in_stock', 'lte', 'low_stock_threshold');

    if (fallbackError) {
      return NextResponse.json({ error: fallbackError.message }, { status: 500 });
    }

    return NextResponse.json({ lowStock: fallbackData || [] });
  }

  return NextResponse.json({ lowStock: data || [] });
}
