import { NextRequest, NextResponse } from 'next/server';
import { addUser } from '../role-utils';
import { createClient } from '@/lib/supabase/server';
import { getCompanyId } from '@/lib/supabase/getCompanyId';

export async function POST(req: NextRequest) {
  try {
    console.log('=== ADD USER API START ===');
    const { email, password, role_id } = await req.json();
    console.log('Request data:', { email, role_id });
    
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }
    
    // Get the current admin user (the one making the request)
    const supabase = createClient();
    const {
      data: { user: adminUser },
      error: adminError,
    } = await supabase.auth.getUser();
    
    console.log('Admin user:', adminUser?.id, adminError);
    
    if (adminError || !adminUser) {
      console.log('Admin authentication failed:', adminError);
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }
    
    // Get company_id from admin user
    let companyId: string | null = null;
    try {
      companyId = getCompanyId(adminUser);
      console.log('Company ID from getCompanyId:', companyId);
    } catch (error) {
      console.log('getCompanyId failed, trying fallback:', error);
      // fallback: try to fetch from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', adminUser.id)
        .single();
      companyId = profile?.company_id || null;
      console.log('Company ID from profiles fallback:', companyId);
    }
    
    if (!companyId) {
      console.log('No company ID found for admin user');
      return NextResponse.json({ error: 'Could not resolve company_id for admin.' }, { status: 400 });
    }
    
    console.log('About to call addUser with:', { email, role_id, companyId, adminUserId: adminUser.id });
    const userId = await addUser(email, password, role_id, companyId, adminUser.id);
    console.log('User created successfully:', userId);
    
    return NextResponse.json({ userId });
  } catch (error: any) {
    console.error('=== ADD USER API ERROR ===', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: error.message || 'Failed to add user.' }, { status: 500 });
  }
}
