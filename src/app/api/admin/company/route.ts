import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCompanyId } from '@/lib/supabase/getAuthenticatedCompanyId';


export async function GET() {
  try {
    const { companyId, supabase } = await getAuthenticatedCompanyId();

    const { data: company, error } = await supabase
      .from('companies')
      .select('name, email, phone, address, city, state, country, postal_code, website')
      .eq('id', companyId)
      .single();

    if (error) {
      console.error('Error fetching company info:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error('Error in company info GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { companyId, supabase } = await getAuthenticatedCompanyId();
    const body = await request.json();
    
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      country,
      postal_code,
      website
    } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ 
        error: 'Company name and email are required' 
      }, { status: 400 });
    }

    const { data: updatedCompany, error } = await supabase
      .from('companies')
      .update({
        name,
        email,
        phone,
        address,
        city,
        state,
        country,
        postal_code,
        website,
        updated_at: new Date().toISOString()
      })
      .eq('id', companyId)
      .select('name, email, phone, address, city, state, country, postal_code, website')
      .single();

    if (error) {
      console.error('Error updating company info:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      company: updatedCompany,
      message: 'Company information updated successfully'
    });
  } catch (error) {
    console.error('Error in company info PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
