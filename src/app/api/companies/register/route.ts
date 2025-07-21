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

    // Generate a unique company slug from the company name
    const companySlug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if company slug is available (add random number if needed)
    let finalSlug = companySlug;
    let counter = 1;
    
    while (true) {
      const { data: existingCompany } = await admin
        .from('companies')
        .select('id')
        .eq('slug', finalSlug)
        .single();

      if (!existingCompany) break;
      
      finalSlug = `${companySlug}-${counter}`;
      counter++;
    }

    // Create company
    const { data: company, error: companyError } = await admin
      .from('companies')
      .insert({
        name: companyName,
        slug: finalSlug,
        email: ownerEmail,
        phone: contactInfo?.phone,
        business_type: businessType || 'retail',
        subscription_plan: 'basic',
        subscription_status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        max_users: 5,
        max_products: 1000,
        max_orders_per_month: 500
      })
      .select()
      .single();

    if (companyError) {
      return NextResponse.json(
        { error: 'Failed to create company', details: companyError.message }, 
        { status: 500 }
      );
    }

    // Create profile for the existing user
    const { error: profileError } = await admin
      .from('profiles')
      .insert({
        id: ownerUserId,
        email: ownerEmail,
        company_id: company.id,
        first_name: contactInfo?.firstName || '',
        last_name: contactInfo?.lastName || ''
      });

    if (profileError) {
      // Cleanup company if profile creation fails
      await admin.from('companies').delete().eq('id', company.id);
      return NextResponse.json(
        { error: 'Failed to create user profile', details: profileError?.message || 'Unknown error' }, 
        { status: 500 }
      );
    }

    // Add user to company_users as owner
    const { error: companyUserError } = await admin
      .from('company_users')
      .insert({
        company_id: company.id,
        user_id: ownerUserId,
        role: 'owner'
      });

    if (companyUserError) {
      console.warn('Failed to create company_users record:', companyUserError);
    }

    // Create default admin role for this company
    const { data: adminRole, error: roleError } = await admin
      .from('roles')
      .insert({
        name: 'admin',
        company_id: company.id,
        description: 'Full system access'
      })
      .select()
      .single();

    if (!roleError && adminRole) {
      // Assign admin role to owner
      await admin
        .from('user_roles')
        .insert({
          user_id: ownerUserId,
          role_id: adminRole.id,
          tenant_id: company.id
        });
    }

    // Create sample data (optional)
    await createSampleData(admin, company.id, ownerUserId);

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        subscription_plan: company.subscription_plan
      },
      user: {
        id: ownerUserId,
        email: ownerEmail
      }
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
