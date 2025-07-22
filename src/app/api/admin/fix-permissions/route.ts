import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/service';



export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const admin = createAdminClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    console.log('Fixing permissions for user:', user.id, user.email);

    // Get user's profile(s) - handle multiple or missing profiles
    const { data: profiles, error: profileError } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id);

    if (profileError) {
      return NextResponse.json(
        { error: 'Profile query failed', details: profileError.message }, 
        { status: 500 }
      );
    }

    console.log('Found profiles:', profiles);

    // Handle missing or duplicate profiles
    let profile = null;
    if (!profiles || profiles.length === 0) {
      // No profile exists - this is the problem! Let's create one
      return NextResponse.json(
        { 
          error: 'No profile found. You need to run the recovery process first.',
          suggestion: 'Go to /recovery and enter your email to fix your account.',
          profiles: profiles
        }, 
        { status: 400 }
      );
    } else if (profiles.length > 1) {
      // Multiple profiles - use the one with company_id, or the first one
      profile = profiles.find(p => p.company_id) || profiles[0];
      console.log('Multiple profiles found, using:', profile);
    } else {
      profile = profiles[0];
    }

    console.log('Using profile:', profile);

    if (!profile.company_id) {
      return NextResponse.json(
        { error: 'No company_id in profile. Need to run recovery first.' }, 
        { status: 400 }
      );
    }

    // Simplified approach: Find any admin role or create a company-specific one
    let adminRole;
    
    // First, try to find any existing admin role for this company
    const { data: companyRoles, error: companyRolesError } = await admin
      .from('roles')
      .select('*')
      .eq('company_id', profile.company_id);

    if (companyRoles && companyRoles.length > 0) {
      // Use the first role found for this company (or find one named admin/owner)
      adminRole = companyRoles.find(r => r.name.toLowerCase().includes('admin') || r.name.toLowerCase().includes('owner')) || companyRoles[0];
      console.log('Using existing company role:', adminRole);
    } else {
      // No roles exist for this company, create one with a unique name
      const uniqueRoleName = `owner_${profile.company_id.slice(0, 8)}_${Date.now()}`;
      const { data: newRole, error: roleError } = await admin
        .from('roles')
        .insert({
          name: uniqueRoleName,
          company_id: profile.company_id
        })
        .select()
        .single();

      if (roleError) {
        console.warn('Failed to create role, will skip role assignment:', roleError);
        adminRole = null; // We'll skip role assignment but continue with company_users
      } else {
        adminRole = newRole;
        console.log('Created new unique admin role:', adminRole);
      }
    }

    // Assign role to user via sidebar_permissions
    let roleAssignmentResult = null;
    if (adminRole) {
      // Check if user already has this role assigned via sidebar_permissions
      const { data: existingPermission, error: permissionCheckError } = await admin
        .from('sidebar_permissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('role_id', adminRole.id)
        .single();

      if (permissionCheckError && permissionCheckError.code === 'PGRST116') {
        // No existing permission, create full admin permissions
        const sidebarItems = [
          'dashboard', 'pos', 'orders', 'products', 'customers', 
          'employees', 'inventory', 'returns', 'settings', 'audit-log'
        ];
        
        const permissionInserts = sidebarItems.map(item => ({
          user_id: user.id,
          role_id: adminRole.id,
          company_id: profile.company_id,
          item_key: item,
          enabled: true
        }));

        const { data: rolePermissions, error: rolePermissionError } = await admin
          .from('sidebar_permissions')
          .insert(permissionInserts)
          .select();

        if (rolePermissionError) {
          console.warn('Could not assign admin role to user:', rolePermissionError);
          roleAssignmentResult = { error: rolePermissionError.message };
        } else {
          console.log('Admin permissions assigned via sidebar_permissions:', rolePermissions);
          roleAssignmentResult = { success: true, permissions: rolePermissions };
        }
      } else if (permissionCheckError) {
        console.warn('Error checking existing permissions:', permissionCheckError);
        roleAssignmentResult = { error: permissionCheckError.message };
      } else {
        console.log('User already has admin role assigned');
        roleAssignmentResult = { success: true, existing: existingPermission };
      }
    } else {
      roleAssignmentResult = { skipped: 'No role available to assign' };
    }

    // User ownership is handled through profile.company_id relationship
    // No separate company_users table in this schema
    const companyMembershipResult = { 
      success: true, 
      message: 'Company ownership established through profile.company_id',
      companyId: profile.company_id
    };

    return NextResponse.json({
      success: true,
      message: 'Permissions fix completed!',
      user: { id: user.id, email: user.email },
      profile,
      results: {
        adminRole: adminRole ? { id: adminRole.id, name: adminRole.name } : null,
        roleAssignment: roleAssignmentResult,
        companyMembership: companyMembershipResult
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Permission fix error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message }, 
      { status: 500 }
    );
  }
}
