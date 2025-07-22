import { NextResponse } from 'next/server';
import { getAuthenticatedCompanyId } from '@/lib/supabase/getAuthenticatedCompanyId';



export async function GET() {
  try {
    const { companyId, supabase } = await getAuthenticatedCompanyId();

    const { data, error } = await supabase
      .from('payment_methods')
      .select('id, name')
      .eq('company_id', companyId);

    if (error) {
      console.error('Error fetching payment methods:', error);
      return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 401 });
  }
}
