import { NextRequest } from 'next/server';
// GET: List returns with product name
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('returns')
    .select('id, order_id, product_id, quantity, reason, created_at, products(name)')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const returns = (data || []).map((r: any) => ({
    id: r.id,
    order_id: r.order_id,
    product_name: r.products?.name || r.product_id,
    quantity: r.quantity,
    date: r.created_at,
    reason: r.reason,
  }));
  return NextResponse.json(returns);
}
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { order_id, product_id, product_name, quantity, reason } = await request.json();
  let pid = product_id;
  // If product_id is not provided, try to look up by product_name
  if (!pid && product_name) {
    const { data: prod, error: prodErr } = await supabase
      .from('products')
      .select('id')
      .eq('name', product_name)
      .single();
    if (prodErr || !prod) {
      return NextResponse.json({ error: 'Product not found' }, { status: 400 });
    }
    pid = prod.id;
  }
  if (!order_id || !pid || !quantity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  // 1. Record the return
  const { data: returnData, error: returnError } = await supabase
    .from('returns')
    .insert([{ order_id, product_id: pid, quantity, reason, user_uid: user.id }])
    .select()
    .single();
  if (returnError) {
    return NextResponse.json({ error: returnError.message }, { status: 500 });
  }
  // 2. Get current stock
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('in_stock')
    .eq('id', pid)
    .single();
  if (fetchError || !product) {
    return NextResponse.json({ error: fetchError?.message || 'Product not found' }, { status: 500 });
  }
  const newStock = Number(product.in_stock) + Number(quantity);
  const { error: stockError } = await supabase
    .from('products')
    .update({ in_stock: newStock })
    .eq('id', pid);
  if (stockError) {
    return NextResponse.json({ error: stockError.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, return: returnData });
}
