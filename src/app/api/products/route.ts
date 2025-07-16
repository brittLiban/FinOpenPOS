import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_uid', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const newProduct = await request.json();

  const { data, error } = await supabase
    .from('products')
    .insert([{ ...newProduct, user_uid: user.id }])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 🔁 Trigger product sync to Stripe
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/sync-products?product_id=${data[0].id}`);
  } catch (syncError) {
    console.error("⚠️ Sync to Stripe failed:", syncError);
    // Optional: log this somewhere or notify admin
  }

  return NextResponse.json(data[0])
}
