import { NextResponse } from 'next/server';
import { getAuthenticatedCompanyId } from '@/lib/supabase/getAuthenticatedCompanyId';

export async function GET() {
  try {
    const { companyId, supabase } = await getAuthenticatedCompanyId();

    const { data: company, error } = await supabase
      .from('companies')
      .select('platform_fee_percent')
      .eq('id', companyId)
      .single();

    if (error) {
      console.error('Error fetching company platform fee:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      platformFeePercent: company.platform_fee_percent || 2.50 
    });
  } catch (error) {
    console.error('Error in platform fee GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { companyId, supabase } = await getAuthenticatedCompanyId();
    const body = await request.json();
    const { platformFeePercent } = body;

    // Validate the platform fee percentage
    if (typeof platformFeePercent !== 'number' || platformFeePercent < 0 || platformFeePercent > 10) {
      return NextResponse.json({ 
        error: 'Platform fee percentage must be a number between 0 and 10' 
      }, { status: 400 });
    }

    const { data: updatedCompany, error } = await supabase
      .from('companies')
      .update({ platform_fee_percent: platformFeePercent })
      .eq('id', companyId)
      .select('platform_fee_percent')
      .single();

    if (error) {
      console.error('Error updating platform fee:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      platformFeePercent: updatedCompany.platform_fee_percent,
      message: 'Platform fee updated successfully'
    });
  } catch (error) {
    console.error('Error in platform fee PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
