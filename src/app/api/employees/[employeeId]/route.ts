import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// UPDATE employee
export async function PUT(request: Request, { params }: { params: { employeeId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const updatedEmployee = await request.json();
  const { data, error } = await supabase
    .from('employees')
    .update({ ...updatedEmployee, user_uid: user.id })
    .eq('id', params.employeeId)
    .eq('user_uid', user.id)
    .select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: 'Employee not found or not authorized' }, { status: 404 });
  // Audit log
  const { logAudit } = await import('@/lib/log-audit');
  await logAudit({
    userId: user.id,
    actionType: 'update',
    entityType: 'employee',
    entityId: params.employeeId,
    details: { updated: data[0] }
  });
  return NextResponse.json(data[0]);
}

// DELETE employee
export async function DELETE(request: Request, { params }: { params: { employeeId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', params.employeeId)
    .eq('user_uid', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Audit log
  const { logAudit } = await import('@/lib/log-audit');
  await logAudit({
    userId: user.id,
    actionType: 'delete',
    entityType: 'employee',
    entityId: params.employeeId,
    details: { message: 'Employee deleted' }
  });
  return NextResponse.json({ message: 'Employee deleted' });
}
