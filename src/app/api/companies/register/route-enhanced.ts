import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/service';
import Stripe from 'stripe';
import { generateUniqueSubdomain } from '@/lib/tenant';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

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

    // Generate unique subdomain
    const subdomain = await generateUniqueSubdomain(companyName);

    // Create Stripe Connect Express account
    const stripeAccount = await stripe.accounts.create({
      type: 'express',
      country: contactInfo?.country || 'US',
      email: ownerEmail,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: businessType === 'individual' ? 'individual' : 'company',
      metadata: {
        company_name: companyName,
        owner_email: ownerEmail,
        subdomain: subdomain
      }
    });

    // Create company with enhanced multi-tenant fields
    const { data: company, error: companyError } = await admin
      .from('companies')
      .insert({
        name: companyName,
        business_type: businessType || 'retail',
        subdomain: subdomain,
        stripe_account_id: stripeAccount.id,
        stripe_onboarding_complete: false,
        stripe_charges_enabled: false,
        stripe_payouts_enabled: false,
        stripe_details_submitted: false,
        platform_fee_percentage: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '2.5'),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (companyError) {
      // Cleanup Stripe account if company creation fails
      try {
        await stripe.accounts.del(stripeAccount.id);
      } catch (stripeError) {
        console.error('Failed to cleanup Stripe account:', stripeError);
      }
      return NextResponse.json(
        { error: 'Failed to create company', details: companyError.message }, 
        { status: 500 }
      );
    }

    // Create enhanced profile for the user
    const { error: profileError } = await admin
      .from('profiles')
      .insert({
        id: ownerUserId,
        email: ownerEmail,
        company_id: company.id,
        first_name: contactInfo?.firstName,
        last_name: contactInfo?.lastName,
        phone: contactInfo?.phone,
        created_at: new Date().toISOString()
      });

    if (profileError) {
      // Cleanup company and Stripe account if profile creation fails
      await admin.from('companies').delete().eq('id', company.id);
      try {
        await stripe.accounts.del(stripeAccount.id);
      } catch (stripeError) {
        console.error('Failed to cleanup Stripe account:', stripeError);
      }
      return NextResponse.json(
        { error: 'Failed to create user profile', details: profileError?.message || 'Unknown error' }, 
        { status: 500 }
      );
    }

    // Create default roles for this company
    const defaultRoles = [
      { name: 'admin', description: 'Full access to all features' },
      { name: 'manager', description: 'Manage inventory, view reports' },
      { name: 'cashier', description: 'Process sales and returns' },
      { name: 'employee', description: 'Basic access to POS' }
    ];

    const rolesToCreate = defaultRoles.map(role => ({
      name: role.name,
      company_id: company.id
    }));

    const { data: createdRoles, error: roleError } = await admin
      .from('roles')
      .insert(rolesToCreate)
      .select();

    if (roleError) {
      console.error('Failed to create roles:', roleError);
      return NextResponse.json(
        { error: 'Failed to create roles', details: roleError.message }, 
        { status: 500 }
      );
    }

    // Find the admin role (company owner must always be admin)
    const adminRole = createdRoles.find((role: any) => role.name === 'admin') || createdRoles[0];

    // Assign admin permissions to company owner
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

    // Create Stripe Connect onboarding link
    const tenantDomain = process.env.NEXT_PUBLIC_TENANT_DOMAIN || 'localhost:3000';
    const protocol = tenantDomain.includes('localhost') ? 'http' : 'https';
    const baseUrl = tenantDomain.includes('localhost') 
      ? `${protocol}://${tenantDomain}` 
      : `${protocol}://${subdomain}.${tenantDomain}`;

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccount.id,
      refresh_url: `${baseUrl}/settings/payments/refresh`,
      return_url: `${baseUrl}/settings/payments/success`,
      type: 'account_onboarding',
    });

    // Create sample data
    await createSampleData(admin, company.id, ownerUserId);

    console.log(`✅ Successfully registered company with full multi-tenant setup:`, {
      userId: ownerUserId,
      companyId: company.id,
      companyName: company.name,
      subdomain: subdomain,
      stripeAccountId: stripeAccount.id,
      tenantUrl: baseUrl,
      roleName: 'admin',
      roleId: adminRole.id,
      permissionsCount: sidebarItems.length
    });

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        subdomain: subdomain,
        stripe_account_id: stripeAccount.id,
        business_type: company.business_type
      },
      user: {
        id: ownerUserId,
        email: ownerEmail,
        role: 'admin'
      },
      onboarding: {
        stripe_onboarding_url: accountLink.url,
        tenant_url: baseUrl,
        needs_stripe_setup: true
      },
      permissions: sidebarItems,
      availableRoles: createdRoles.map((r: any) => ({ id: r.id, name: r.name }))
    });

  } catch (error) {
    console.error('Company registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}

// Enhanced sample data creation function
async function createSampleData(supabase: any, companyId: string, ownerId: string) {
  try {
    // Create sample categories
    const categories = [
      { name: 'Electronics', company_id: companyId, created_at: new Date().toISOString() },
      { name: 'Clothing', company_id: companyId, created_at: new Date().toISOString() },
      { name: 'Food & Beverage', company_id: companyId, created_at: new Date().toISOString() },
      { name: 'Books', company_id: companyId, created_at: new Date().toISOString() }
    ];

    const { data: createdCategories } = await supabase
      .from('categories')
      .insert(categories)
      .select();

    if (createdCategories?.length > 0) {
      // Create sample products with more variety
      const products = [
        {
          name: 'iPhone 15 Pro',
          sku: 'IPHONE-15-PRO',
          price: 999.99,
          cost: 750.00,
          stock_quantity: 5,
          category_id: createdCategories[0].id,
          company_id: companyId,
          description: 'Latest iPhone with pro features'
        },
        {
          name: 'Samsung Galaxy S24',
          sku: 'GALAXY-S24',
          price: 899.99,
          cost: 650.00,
          stock_quantity: 8,
          category_id: createdCategories[0].id,
          company_id: companyId,
          description: 'Flagship Samsung smartphone'
        },
        {
          name: 'Premium T-Shirt',
          sku: 'TSHIRT-PREM',
          price: 39.99,
          cost: 15.00,
          stock_quantity: 25,
          category_id: createdCategories[1].id,
          company_id: companyId,
          description: 'High-quality cotton t-shirt'
        },
        {
          name: 'Coffee Blend Premium',
          sku: 'COFFEE-PREM',
          price: 24.99,
          cost: 12.00,
          stock_quantity: 50,
          category_id: createdCategories[2].id,
          company_id: companyId,
          description: 'Premium coffee blend'
        },
        {
          name: 'Business Strategy Book',
          sku: 'BOOK-STRAT',
          price: 29.99,
          cost: 18.00,
          stock_quantity: 15,
          category_id: createdCategories[3].id,
          company_id: companyId,
          description: 'Essential business strategy guide'
        }
      ];

      await supabase.from('products').insert(products);
      
      console.log(`✅ Created sample data for company ${companyId}: ${categories.length} categories, ${products.length} products`);
    }
  } catch (error) {
    console.error('Failed to create sample data:', error);
    // Don't fail the registration if sample data creation fails
  }
}
