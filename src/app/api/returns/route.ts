import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { order_id, product_id, quantity, reason } = await request.json();
  if (!order_id || !product_id || !quantity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // 1. Record the return
  const { data: returnData, error: returnError } = await supabase
    .from('returns')
    .insert([{ order_id, product_id, quantity, reason, user_uid: user.id }])
    .select()
    .single();
  if (returnError) {
    return NextResponse.json({ error: returnError.message }, { status: 500 });
  }


  // 2. Get current stock
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('in_stock')
    .eq('id', product_id)
    .single();
  if (fetchError || !product) {
    return NextResponse.json({ error: fetchError?.message || 'Product not found' }, { status: 500 });
  }

  const newStock = Number(product.in_stock) + Number(quantity);
  const { error: stockError } = await supabase
    .from('products')
    .update({ in_stock: newStock })
    .eq('id', product_id);
  if (stockError) {
    return NextResponse.json({ error: stockError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, return: returnData });
}
