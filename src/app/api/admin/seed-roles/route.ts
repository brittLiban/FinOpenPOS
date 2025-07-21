import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/service';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const admin = createAdminClient();
    
    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
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

    // Check if roles already exist
    const { data: existingRoles } = await admin
      .from('roles')
      .select('name')
      .eq('company_id', profile.company_id);

    // Default roles to create
    const defaultRoles = [
      { name: 'admin', description: 'Full access to all features' },
      { name: 'manager', description: 'Manage inventory, view reports' },
      { name: 'cashier', description: 'Process sales and returns' },
      { name: 'employee', description: 'Basic access to POS' }
    ];

    const existingRoleNames = existingRoles?.map(r => r.name) || [];
    const rolesToCreate = defaultRoles.filter(role => !existingRoleNames.includes(role.name));

    if (rolesToCreate.length === 0) {
      return NextResponse.json({ 
        message: 'All default roles already exist',
        existingRoles: existingRoleNames 
      });
    }

    // Create missing roles
    const newRoles = rolesToCreate.map(role => ({
      name: role.name,
      company_id: profile.company_id
    }));

    const { data: createdRoles, error } = await admin
      .from('roles')
      .insert(newRoles)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdRoles.length} new roles`,
      createdRoles: createdRoles.map(r => ({ id: r.id, name: r.name })),
      existingRoles: existingRoleNames
    });

  } catch (error: any) {
    console.error('Seed roles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
