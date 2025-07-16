import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('products')
    .select('id, name, in_stock, low_stock_threshold');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const lowStock = (data ?? []).filter((product) => {
    const inStock = Number(product.in_stock);
    const threshold = Number(product.low_stock_threshold);
    return !isNaN(inStock) && !isNaN(threshold) && inStock <= threshold;
  });

  return NextResponse.json({ lowStock });
}
