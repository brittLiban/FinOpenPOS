import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCompanyId } from '@/lib/supabase/getAuthenticatedCompanyId';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, companyId, supabase } = await getAuthenticatedCompanyId();

    const body = await request.json();
    const {
      name,
      description,
      amount,
      category,
      type,
      frequency,
      recurring_day,
      start_date,
      end_date
    } = body;

    const { data: expense, error } = await supabase
      .from('expenses')
      .update({
        name,
        description,
        amount,
        category,
        type,
        frequency: type === 'recurring' ? frequency : null,
        recurring_day: type === 'recurring' ? recurring_day : null,
        start_date: type === 'recurring' && start_date ? start_date : null,
        end_date: type === 'recurring' && end_date ? end_date : null,
      })
      .eq('id', params.id)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      console.error('Error updating expense:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ expense });
  } catch (error) {
    console.error('Error in expense PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, companyId, supabase } = await getAuthenticatedCompanyId();

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', params.id)
      .eq('company_id', companyId);

    if (error) {
      console.error('Error deleting expense:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in expense DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
