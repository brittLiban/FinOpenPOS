import { NextRequest, NextResponse } from 'next/server';
import { addUser } from '../role-utils';
import { createClient } from '@/lib/supabase/server';
import { getCompanyId } from '@/lib/supabase/getCompanyId';

export async function POST(req: NextRequest) {
  try {
    const { email, password, role_id } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }
    
    // Get the current admin user (the one making the request)
    const supabase = createClient();
    const {
      data: { user: adminUser },
      error: adminError,
    } = await supabase.auth.getUser();
    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }
    
    // Get company_id from admin user
    let companyId: string | null = null;
    try {
      companyId = getCompanyId(adminUser);
    } catch {
      // fallback: try to fetch from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', adminUser.id)
        .single();
      companyId = profile?.company_id || null;
    }
    
    if (!companyId) {
      return NextResponse.json({ error: 'Could not resolve company_id for admin.' }, { status: 400 });
    }
    
    const userId = await addUser(email, password, role_id, companyId, adminUser.id);
    return NextResponse.json({ userId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add user.' }, { status: 500 });
  }
}
