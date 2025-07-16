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
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { order_id, product_id, product_name, quantity, reason } = await req.json();
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

  // 1. Get order and product info for refund
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, stripe_session_id')
    .eq('id', order_id)
    .single();
  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  const { data: item, error: itemError } = await supabase
    .from('order_items')
    .select('price')
    .eq('order_id', order_id)
    .eq('product_id', pid)
    .single();
  if (itemError || !item) {
    return NextResponse.json({ error: 'Order item not found' }, { status: 404 });
  }

  // 2. Refund in Stripe (partial refund for this item * quantity)
  let refund = null;
  try {
    if (order.stripe_session_id) {
      // Get the session from Stripe
      const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
      const payment_intent = session.payment_intent as string;
      if (payment_intent) {
        refund = await stripe.refunds.create({
          payment_intent,
          amount: Math.round(item.price * quantity * 100), // Stripe expects cents
        });
      }
    }
  } catch (err) {
    return NextResponse.json({ error: 'Stripe refund failed', details: (err as any).message }, { status: 500 });
  }

  // 3. Record the return
  const { data: returnData, error: returnError } = await supabase
    .from('returns')
    .insert([{ order_id, product_id: pid, quantity, reason, user_uid: user.id }])
    .select()
    .single();
  if (returnError) {
    return NextResponse.json({ error: returnError.message }, { status: 500 });
  }
  // 4. Update stock
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
  return NextResponse.json({ success: true, return: returnData, refund });
}
// ...existing code...
