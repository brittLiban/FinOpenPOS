import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedCompanyId } from '@/lib/supabase/getAuthenticatedCompanyId';



export async function GET(request: Request) {
  const supabase = createClient();
  
  try {
    const { companyId, supabase } = await getAuthenticatedCompanyId();

    // Get total of all expense transactions (actual payments made)
    const { data: expenseTransactions, error: transactionsError } = await supabase
      .from('expense_transactions')
      .select('amount')
      .eq('company_id', companyId);

    if (transactionsError) {
      console.error('Error fetching expense transactions:', transactionsError);
      return NextResponse.json({ error: 'Failed to fetch expense transactions' }, { status: 500 });
    }

    const totalExpenses = expenseTransactions?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;

    return NextResponse.json({ totalExpenses });
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
