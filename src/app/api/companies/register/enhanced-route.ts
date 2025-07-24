import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/service';
import Stripe from 'stripe';

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
    const baseSubdomain = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') // Remove leading/trailing dashes
      .substring(0, 20);

    // Check for existing subdomains and make unique
    let subdomain = baseSubdomain;
    let counter = 1;
    
    while (true) {
      const { data: existing } = await admin
        .from('companies')
        .select('id')
        .eq('subdomain', subdomain)
        .single();
        
      if (!existing) break; // Subdomain is available
      
      subdomain = `${baseSubdomain}${counter}`;
      counter++;
    }

    // Create Stripe Connect Express account
    const stripeAccount = await stripe.accounts.create({
      type: 'express',
      country: contactInfo?.country || 'US',
      email: ownerEmail,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual', // or 'company' based on businessType
      metadata: {
        company_name: companyName,
        owner_email: ownerEmail,
        subdomain: subdomain
      }
    });

    // Create company with Stripe account and subdomain
    const { data: company, error: companyError } = await admin
      .from('companies')
      .insert({
        name: companyName,
        business_type: businessType,
        subdomain: subdomain,
        stripe_account_id: stripeAccount.id,
        stripe_onboarding_complete: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (companyError) {
      // Cleanup Stripe account if company creation fails
      await stripe.accounts.del(stripeAccount.id);
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
        first_name: contactInfo?.firstName,
        last_name: contactInfo?.lastName,
        phone: contactInfo?.phone
      });

    if (profileError) {
      // Cleanup company and Stripe account if profile creation fails
      await admin.from('companies').delete().eq('id', company.id);
      await stripe.accounts.del(stripeAccount.id);
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
    const adminRole = createdRoles.find(role => role.name === 'admin') || createdRoles[0];

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
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccount.id,
      refresh_url: `https://${subdomain}.${process.env.NEXT_PUBLIC_TENANT_DOMAIN || 'localhost:3000'}/settings/payments/refresh`,
      return_url: `https://${subdomain}.${process.env.NEXT_PUBLIC_TENANT_DOMAIN || 'localhost:3000'}/settings/payments/success`,
      type: 'account_onboarding',
    });

    // Create sample data (optional)
    await createSampleData(admin, company.id, ownerUserId);

    console.log(`✅ Successfully registered company with multi-tenant setup:`, {
      userId: ownerUserId,
      companyId: company.id,
      companyName: company.name,
      subdomain: subdomain,
      stripeAccountId: stripeAccount.id,
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
        stripe_account_id: stripeAccount.id
      },
      user: {
        id: ownerUserId,
        email: ownerEmail,
        role: 'admin'
      },
      onboarding: {
        stripe_onboarding_url: accountLink.url,
        tenant_url: `https://${subdomain}.${process.env.NEXT_PUBLIC_TENANT_DOMAIN || 'localhost:3000'}`,
        needs_stripe_setup: true
      },
      permissions: sidebarItems,
      availableRoles: createdRoles.map(r => ({ id: r.id, name: r.name }))
    });

  } catch (error) {
    console.error('Company registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Sample data creation function (keeping your existing logic)
async function createSampleData(supabase: any, companyId: string, ownerId: string) {
  // Create sample categories
  const categories = [
    { name: 'Electronics', company_id: companyId },
    { name: 'Clothing', company_id: companyId },
    { name: 'Food & Beverage', company_id: companyId }
  ];

  const { data: createdCategories } = await supabase
    .from('categories')
    .insert(categories)
    .select();

  if (createdCategories?.length > 0) {
    // Create sample products
    const products = [
      {
        name: 'Sample Phone',
        sku: 'PHONE-001',
        price: 299.99,
        cost: 200.00,
        stock_quantity: 10,
        category_id: createdCategories[0].id,
        company_id: companyId
      },
      {
        name: 'Sample T-Shirt',
        sku: 'SHIRT-001', 
        price: 29.99,
        cost: 15.00,
        stock_quantity: 25,
        category_id: createdCategories[1].id,
        company_id: companyId
      }
    ];

    await supabase.from('products').insert(products);
  }
}
