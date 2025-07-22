import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCompanyId } from '@/lib/supabase/getAuthenticatedCompanyId';



export async function GET(request: NextRequest) {
  try {
    const { user, companyId, supabase } = await getAuthenticatedCompanyId();
    const { searchParams } = new URL(request.url);
    const breakdown = searchParams.get('breakdown');
    const recent = searchParams.get('recent');
    const limit = searchParams.get('limit');

    // Handle breakdown by category request
    if (breakdown === 'true') {
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('category, amount')
        .eq('company_id', companyId);

      if (error) {
        console.error('Error fetching expense breakdown:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Group by category and sum amounts
      const categoryBreakdown = expenses.reduce((acc: any, expense: any) => {
        if (!acc[expense.category]) {
          acc[expense.category] = 0;
        }
        acc[expense.category] += expense.amount;
        return acc;
      }, {});

      return NextResponse.json({ expenses: categoryBreakdown });
    }

    // Handle recent expenses request
    if (recent === 'true') {
      const limitValue = limit ? parseInt(limit) : 5;
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('*, expense_transactions!inner(*)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limitValue);

      if (error) {
        console.error('Error fetching recent expenses:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ expenses });
    }

    // Default: return all expenses
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error('Error in expenses GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
      .insert({
        company_id: companyId,
        name,
        description,
        amount,
        category,
        type,
        frequency: type === 'recurring' ? frequency : null,
        recurring_day: type === 'recurring' ? recurring_day : null,
        start_date: type === 'recurring' && start_date ? start_date : null,
        end_date: type === 'recurring' && end_date ? end_date : null,
        user_uid: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating expense:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ expense });
  } catch (error) {
    console.error('Error in expenses POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
