import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/service';

// This API route uses authentication and must be dynamic
export const dynamic = 'force-dynamic';

// Get role permissions
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const admin = createAdminClient();
    
    // Get current user
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user's company_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userData.user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated with user' }, { status: 400 });
    }

    // Get all roles for this company
    const { data: roles, error: rolesError } = await admin
      .from('roles')
      .select('id, name')
      .eq('company_id', profile.company_id)
      .order('name');

    if (rolesError) {
      return NextResponse.json({ error: rolesError.message }, { status: 500 });
    }

    // Get all possible sidebar items
    const allSidebarItems = [
      'dashboard', 'pos', 'orders', 'products', 'customers', 
      'employees', 'inventory', 'returns', 'settings', 'audit-log'
    ];

    // Get current permissions for each role
    const rolePermissions: any = {};
    for (const role of roles || []) {
      const { data: permissions } = await admin
        .from('sidebar_permissions')
        .select('item_key, enabled')
        .eq('role_id', role.id)
        .is('user_id', null); // Role-based permissions (not user-specific)

      rolePermissions[role.id] = {
        name: role.name,
        permissions: allSidebarItems.map(item => ({
          item_key: item,
          enabled: permissions?.find(p => p.item_key === item)?.enabled || false
        }))
      };
    }

    return NextResponse.json({
      roles: roles || [],
      allSidebarItems,
      rolePermissions
    });

  } catch (error: any) {
    console.error('Get role permissions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update role permissions
export async function POST(req: NextRequest) {
  try {
    const { roleId, permissions } = await req.json();
    
    if (!roleId || !permissions) {
      return NextResponse.json({ error: 'Role ID and permissions are required' }, { status: 400 });
    }

    const supabase = createClient();
    const admin = createAdminClient();
    
    // Get current user
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user's company_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userData.user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated with user' }, { status: 400 });
    }

    // Verify the role belongs to this company
    const { data: roleData } = await admin
      .from('roles')
      .select('name')
      .eq('id', roleId)
      .eq('company_id', profile.company_id)
      .single();

    if (!roleData) {
      return NextResponse.json({ error: 'Role not found or access denied' }, { status: 403 });
    }

    // Delete existing role-based permissions for this role
    await admin
      .from('sidebar_permissions')
      .delete()
      .eq('role_id', roleId)
      .is('user_id', null);

    // Insert new permissions
    const permissionInserts = permissions.map((permission: any) => ({
      role_id: roleId,
      item_key: permission.item_key,
      enabled: permission.enabled,
      user_id: null // Role-based permission
    }));

    const { error: insertError } = await admin
      .from('sidebar_permissions')
      .insert(permissionInserts);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Updated permissions for role: ${roleData.name}` 
    });

  } catch (error: any) {
    console.error('Update role permissions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
