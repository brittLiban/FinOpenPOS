import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { 
      companyName, 
      businessType,
      ownerEmail,
      ownerUserId,
      contactInfo
    } = await req.json();

    // Validate required fields
    if (!companyName || !ownerEmail || !ownerUserId) {
      return NextResponse.json(
        { error: 'Missing required fields: companyName, ownerEmail, ownerUserId' }, 
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Create company (using only fields that exist in your database)
    const { data: company, error: companyError } = await admin
      .from('companies')
      .insert({
        name: companyName
      })
      .select()
      .single();

    if (companyError) {
      return NextResponse.json(
        { error: 'Failed to create company', details: companyError.message }, 
        { status: 500 }
      );
    }

    // Create profile for the existing user (using only existing columns)
    const { error: profileError } = await admin
      .from('profiles')
      .insert({
        id: ownerUserId,
        email: ownerEmail,
        company_id: company.id
      });

    if (profileError) {
      // Cleanup company if profile creation fails
      await admin.from('companies').delete().eq('id', company.id);
      return NextResponse.json(
        { error: 'Failed to create user profile', details: profileError?.message || 'Unknown error' }, 
        { status: 500 }
      );
    }

    // Company user relationship is now handled through profiles table

    // Create default admin role for this company (now with proper unique constraint)
    const { data: adminRole, error: roleError } = await admin
      .from('roles')
      .insert({
        name: 'admin',
        company_id: company.id
      })
      .select()
      .single();

    if (roleError) {
      console.error('Failed to create admin role:', roleError);
      return NextResponse.json(
        { error: 'Failed to create admin role', details: roleError.message }, 
        { status: 500 }
      );
    }

    // Assign admin role to owner via sidebar_permissions (with company_id)
    const sidebarItems = [
      'dashboard', 'pos', 'orders', 'products', 'customers', 
      'employees', 'inventory', 'returns', 'settings', 'audit-log'
    ];
    
    const permissionInserts = sidebarItems.map(item => ({
      user_id: ownerUserId,
      role_id: adminRole.id,
      company_id: company.id,
      item_key: item,
      enabled: true
    }));

    const { error: permissionsError } = await admin
      .from('sidebar_permissions')
      .insert(permissionInserts);

    if (permissionsError) {
      console.error('Failed to create admin permissions:', permissionsError);
      return NextResponse.json(
        { error: 'Failed to assign admin permissions', details: permissionsError.message }, 
        { status: 500 }
      );
    }

    // Create sample data (optional)
    await createSampleData(admin, company.id, ownerUserId);

    console.log(`✅ Successfully registered company owner:`, {
      userId: ownerUserId,
      companyId: company.id,
      companyName: company.name,
      adminRoleName: 'admin',
      adminRoleId: adminRole.id,
      permissionsCount: sidebarItems.length
    });

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name
      },
      user: {
        id: ownerUserId,
        email: ownerEmail,
        role: 'admin'
      },
      permissions: sidebarItems
    });

  } catch (error) {
    console.error('Company registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

async function createSampleData(admin: any, companyId: string, userId: string) {
  try {
    // Create sample payment method
    await admin
      .from('payment_methods')
      .insert({
        name: 'Cash',
        company_id: companyId,
        user_uid: userId
      });

    // Create sample customer
    await admin
      .from('customers')
      .insert({
        name: 'Walk-in Customer',
        email: 'walkin@example.com',
        phone: '555-0123',
        company_id: companyId,
        user_uid: userId,
        status: 'active'
      });

    // Create sample product categories and products
    const sampleProducts = [
      { name: 'Sample Product 1', price: 9.99, category: 'General', in_stock: 100 },
      { name: 'Sample Product 2', price: 19.99, category: 'Electronics', in_stock: 50 },
      { name: 'Sample Product 3', price: 5.99, category: 'Food', in_stock: 200 }
    ];

    for (const product of sampleProducts) {
      await admin
        .from('products')
        .insert({
          ...product,
          company_id: companyId,
          user_uid: userId,
          description: `Sample ${product.category.toLowerCase()} product for demonstration`,
          low_stock_threshold: 10
        });
    }

  } catch (error) {
    console.warn('Failed to create sample data:', error);
  }
}
