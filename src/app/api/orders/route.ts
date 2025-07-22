import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';



export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  
  // Server-side filtering and pagination
  const id = searchParams.get('id');
  const customer = searchParams.get('customer');
  const email = searchParams.get('email');
  const status = searchParams.get('status');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabase
    .from('orders')
    .select(`
      id,
      customer_name,
      customer_email,
      payment_method_name,
      total_amount,
      status,
      created_at
    `)
    .eq('user_uid', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply server-side filters
  if (id) {
    query = query.eq('id', parseInt(id));
  }

  if (customer) {
    query = query.ilike('customer_name', `%${customer}%`);
  }

  if (email) {
    query = query.ilike('customer_email', `%${email}%`);
  }

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    customer_id,
    customer_name,
    customer_email,
    payment_method_id,
    payment_method_name,
    total_amount,
    status = 'completed',
    products = [],
    stripe_session_id
  } = await req.json();

  try {
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        customer_id,
        customer_name,
        customer_email,
        payment_method_id,
        payment_method_name,
        total_amount,
        status,
        stripe_session_id,
        user_uid: user.id,
      })
      .select('*')
      .single();

    if (orderErr) throw orderErr;

    if (products.length) {
      const rows = products.map((p: any) => ({
        order_id: order.id,
        product_id: p.id,
        quantity: p.quantity,
        price: p.price,
        user_uid: user.id,
      }));
      const { error: itemErr } = await supabase.from('order_items').insert(rows);
      if (itemErr) throw itemErr;
      // Inventory decrement removed; handled by Stripe webhook only
    }

    await supabase.from('transactions').insert({
      order_id: order.id,
      payment_method_id,
      amount: total_amount,
      user_uid: user.id,
      status: 'completed',
      category: 'selling',
      type: 'income',
      description: `Payment for order #${order.id}`,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err: any) {
    console.error('POST /orders error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
