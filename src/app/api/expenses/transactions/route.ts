import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCompanyId } from '@/lib/supabase/getAuthenticatedCompanyId';



export async function GET() {
  try {
    const { user, companyId, supabase } = await getAuthenticatedCompanyId();

    const { data: transactions, error } = await supabase
      .from('expense_transactions')
      .select(`
        *,
        expenses!inner(name, category)
      `)
      .eq('company_id', companyId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching expense transactions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Error in expense transactions GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, companyId, supabase } = await getAuthenticatedCompanyId();

    const body = await request.json();
    const {
      expense_id,
      amount,
      payment_date,
      payment_method,
      reference_number,
      notes
    } = body;

    const { data: transaction, error } = await supabase
      .from('expense_transactions')
      .insert({
        expense_id,
        company_id: companyId,
        amount,
        payment_date,
        payment_method,
        reference_number,
        notes,
        user_uid: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating expense transaction:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Error in expense transactions POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
