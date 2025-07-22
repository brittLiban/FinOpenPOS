import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/service';

// This API route uses authentication and must be dynamic
export const dynamic = 'force-dynamic';



export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user has a profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ 
        error: 'No profile found',
        user_id: user.id,
        email: user.email 
      }, { status: 404 });
    }

    // Check if user has admin role
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select(`
        *,
        roles(*)
      `)
      .eq('user_id', user.id)
      .eq('tenant_id', profile.company_id);

    // Check if user has company access
    const { data: companyUser } = await supabase
      .from('company_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', profile.company_id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      },
      profile,
      roles: userRoles,
      company_access: companyUser,
      has_admin_access: userRoles?.some(role => role.roles?.name === 'admin') || companyUser?.role === 'owner'
    });

  } catch (error: any) {
    console.error('User status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = createAdminClient();
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Auto-fix: If user doesn't have proper profile/access, try to fix it
    
    // 1. Check/create profile
    let { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      // This user exists in auth but has no profile - likely a failed registration
      // Let's check if we can create a company for them based on their email
      
      console.log('User has no profile, attempting to create company and profile...');
      
      // Extract potential company name from email or use default
      const emailDomain = user.email?.split('@')[0] || 'company';
      const companyName = `${user.user_metadata?.first_name || 'User'}'s Business`;
      
      // Generate a unique company slug
      const baseSlug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      let finalSlug = baseSlug;
      let counter = 1;
      
      while (true) {
        const { data: existingCompany } = await admin
          .from('companies')
          .select('id')
          .eq('slug', finalSlug)
          .single();

        if (!existingCompany) break;
        
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create company
      const { data: company, error: companyError } = await admin
        .from('companies')
        .insert({
          name: companyName,
          slug: finalSlug,
          email: user.email!,
          business_type: 'retail',
          subscription_plan: 'basic',
          subscription_status: 'trial',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          max_users: 5,
          max_products: 1000,
          max_orders_per_month: 500
        })
        .select()
        .single();

      if (companyError) {
        return NextResponse.json({ 
          error: 'Could not create company', 
          details: companyError.message 
        }, { status: 500 });
      }

      // Create profile
      const { data: newProfile, error: profileError } = await admin
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          company_id: company.id
        })
        .select()
        .single();

      if (profileError) {
        // Cleanup company if profile creation fails
        await admin.from('companies').delete().eq('id', company.id);
        return NextResponse.json({ 
          error: 'Could not create profile', 
          details: profileError.message 
        }, { status: 500 });
      }
      
      profile = newProfile;

      // Create sample data for the new company
      await createSampleData(admin, company.id, user.id);
      
      console.log(`Created company and profile for user ${user.id}`);
    }

    if (!profile.company_id) {
      return NextResponse.json({ 
        error: 'User profile exists but has no company_id. Manual intervention required.',
        profile 
      }, { status: 422 });
    }

    // 2. Ensure user has admin role
    const { data: adminRole } = await admin
      .from('roles')
      .select('id')
      .eq('name', 'admin')
      .eq('company_id', profile.company_id)
      .single();

    if (adminRole) {
      // Check if user already has admin role
      const { data: existingRole } = await admin
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role_id', adminRole.id)
        .eq('tenant_id', profile.company_id)
        .single();

      if (!existingRole) {
        // Give user admin role
        await admin
          .from('user_roles')
          .insert({
            user_id: user.id,
            role_id: adminRole.id,
            tenant_id: profile.company_id
          });
      }
    }

    // 3. Ensure user has company access
    const { data: companyUser } = await admin
      .from('company_users')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', profile.company_id)
      .single();

    if (!companyUser) {
      await admin
        .from('company_users')
        .insert({
          user_id: user.id,
          company_id: profile.company_id,
          role: 'owner',
          status: 'active'
        });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User access verified and fixed if needed',
      profile,
      created_company: !profile ? true : false
    });

  } catch (error: any) {
    console.error('User fix error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message }, 
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
