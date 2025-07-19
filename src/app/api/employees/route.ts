import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET all employees
export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('user_uid', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// CREATE employee
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const newEmployee = await request.json();
  const { data, error } = await supabase
    .from('employees')
    .insert([{ ...newEmployee, user_uid: user.id }])
    .select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Audit log
  const { logAudit } = await import('@/lib/log-audit');
  await logAudit({
    userId: user.id,
    actionType: 'create',
    entityType: 'employee',
    entityId: data[0]?.id ? String(data[0].id) : undefined,
    details: { created: data[0] }
  });
  return NextResponse.json(data[0]);
}
