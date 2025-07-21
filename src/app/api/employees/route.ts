import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET all employees
export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // Get user's company_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();
    
  if (!profile?.company_id) {
    return NextResponse.json({ error: 'No company associated with user' }, { status: 400 });
  }
  
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const role = searchParams.get('role');
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabase
    .from('employees')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply server-side filters
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  if (role) {
    query = query.eq('role', role);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// CREATE employee
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // Get user's company_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();
    
  if (!profile?.company_id) {
    return NextResponse.json({ error: 'No company associated with user' }, { status: 400 });
  }
  
  const newEmployee = await request.json();
  const { data, error } = await supabase
    .from('employees')
    .insert([{ ...newEmployee, user_uid: user.id, company_id: profile.company_id }])
    .select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Audit log
  const { logAudit } = await import('@/lib/log-audit');
  await logAudit({
    userId: user.id,
    actionType: 'create',
    entityType: 'employee',
    entityId: data[0]?.id ? String(data[0].id) : undefined,
    companyId: profile.company_id,
    details: { created: data[0] }
  });
  return NextResponse.json(data[0]);
}
