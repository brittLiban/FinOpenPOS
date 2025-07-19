import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const updatedCustomer = await request.json();
  const customerId = params.customerId;

  const { data, error } = await supabase
    .from('customers')
    .update({ ...updatedCustomer, user_uid: user.id })
    .eq('id', customerId)
    .eq('user_uid', user.id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (data.length === 0) {
    return NextResponse.json({ error: 'Customer not found or not authorized' }, { status: 404 })
  }

  // Audit log
  const { logAudit } = await import("@/lib/log-audit");
  await logAudit({
    userId: user.id,
    actionType: 'update',
    entityType: 'customer',
    entityId: String(customerId),
    details: { updated: data[0] }
  });

  return NextResponse.json(data[0])
}

export async function DELETE(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const customerId = params.customerId;

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId)
    .eq('user_uid', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Audit log
  const { logAudit } = await import("@/lib/log-audit");
  await logAudit({
    userId: user.id,
    actionType: 'delete',
    entityType: 'customer',
    entityId: String(customerId),
    details: { message: 'Customer deleted' }
  });

  return NextResponse.json({ message: 'Customer deleted successfully' })
}
