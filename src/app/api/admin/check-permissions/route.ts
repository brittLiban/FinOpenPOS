import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'Profile not found', details: profileError.message }, 
        { status: 404 }
      );
    }

    // Check user's roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        *,
        roles (
          id,
          name,
          company_id
        )
      `)
      .eq('user_id', user.id);

    // Check company ownership
    const { data: companyUser, error: companyUserError } = await supabase
      .from('company_users')
      .select('*')
      .eq('user_id', user.id);

    // Check company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      },
      profile,
      company,
      permissions: {
        roles: userRoles || [],
        companyUser: companyUser || [],
        hasAdminRole: userRoles?.some(ur => ur.roles?.name === 'admin') || false,
        isCompanyOwner: companyUser?.some(cu => cu.role === 'owner') || false,
        rolesError: rolesError?.message,
        companyUserError: companyUserError?.message
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Admin check error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message }, 
      { status: 500 }
    );
  }
}
