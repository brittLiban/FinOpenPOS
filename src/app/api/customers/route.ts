import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'



export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let query = supabase
    .from('customers')
    .select('id, name, email, phone, status, created_at')
    .eq('user_uid', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply server-side filtering
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error } = await query;

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

  const newCustomer = await request.json();

  const { data, error } = await supabase
    .from('customers')
    .insert([
      { ...newCustomer, user_uid: user.id }
    ])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Audit log
  const { logAudit } = await import("@/lib/log-audit");
  await logAudit({
    userId: user.id,
    actionType: 'create',
    entityType: 'customer',
    entityId: data[0]?.id ? String(data[0].id) : undefined,
    details: { created: data[0] }
  });

  return NextResponse.json(data[0])
}
