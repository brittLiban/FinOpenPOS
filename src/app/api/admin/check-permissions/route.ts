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

    // Get user's profile(s) - handle multiple or missing profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id);

    if (profileError) {
      return NextResponse.json(
        { error: 'Profile query failed', details: profileError.message }, 
        { status: 500 }
      );
    }

    // Check profile status
    let profile = null;
    let profileStatus = 'missing';
    
    if (profiles && profiles.length > 0) {
      if (profiles.length === 1) {
        profile = profiles[0];
        profileStatus = 'found';
      } else {
        profile = profiles[0]; // Use first one
        profileStatus = `duplicate (${profiles.length} found)`;
      }
    }

    // Check user's roles via sidebar_permissions (which links users to roles)
    let userRoles = null;
    let rolesError = null;
    
    try {
      const result = await supabase
        .from('sidebar_permissions')
        .select(`
          *,
          roles (
            id,
            name,
            company_id
          )
        `)
        .eq('user_id', user.id);
      
      userRoles = result.data;
      rolesError = result.error;
    } catch (error: any) {
      rolesError = { message: 'sidebar_permissions query failed', details: error.message };
    }

    // Also check roles for the user's company
    let companyRoles = null;
    if (profile?.company_id) {
      try {
        const result = await supabase
          .from('roles')
          .select('*')
          .eq('company_id', profile.company_id);
        
        companyRoles = result.data;
      } catch (error: any) {
        console.warn('Could not fetch company roles:', error);
      }
    }

    // Check company details (only if profile has company_id)
    let company = null;
    let companyError = null;
    
    if (profile?.company_id) {
      const result = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();
      
      company = result.data;
      companyError = result.error;
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      },
      profile: {
        data: profile,
        status: profileStatus,
        all_profiles: profiles
      },
      company: {
        data: company,
        error: companyError?.message
      },
      permissions: {
        roles: userRoles || [],
        companyRoles: companyRoles || [],
        hasAdminRole: userRoles?.some(ur => ur.roles?.name?.toLowerCase().includes('admin') || ur.roles?.name?.toLowerCase().includes('owner')) || false,
        isCompanyOwner: profile?.company_id ? true : false, // If user has company_id in profile, they're effectively the owner
        rolesError: rolesError?.message
      },
      issues: {
        noProfile: !profile,
        noCompanyId: !profile?.company_id,
        duplicateProfiles: profiles?.length > 1,
        noRoles: !userRoles || userRoles.length === 0,
        noDirectRoleAssignment: !userRoles || userRoles.length === 0
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
