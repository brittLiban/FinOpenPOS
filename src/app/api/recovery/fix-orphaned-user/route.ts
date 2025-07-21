import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/service';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' }, 
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Find user by email in auth.users
    const { data: users, error: usersError } = await admin.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Failed to query users:', usersError);
      return NextResponse.json(
        { error: 'Failed to query users', details: usersError.message }, 
        { status: 500 }
      );
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'No user found with that email address' }, 
        { status: 404 }
      );
    }

    // Check if user already has a profile
    const { data: existingProfile, error: profileCheckError } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('Error checking existing profile:', profileCheckError);
      return NextResponse.json(
        { error: 'Failed to check existing profile', details: profileCheckError.message }, 
        { status: 500 }
      );
    }

    if (existingProfile && existingProfile.company_id) {
      return NextResponse.json({
        success: true,
        message: 'User already has a company and profile',
        user: { id: user.id, email: user.email },
        profile: existingProfile
      });
    }

    // Create company for orphaned user
    const firstName = user.user_metadata?.first_name || 'User';
    const companyName = `${firstName}'s Business`;
    
    console.log('Creating company for user:', user.id, 'with name:', companyName);

    // Create company with only the fields that exist in your database
    console.log('Creating company...');
    const { data: company, error: companyError } = await admin
      .from('companies')
      .insert({
        name: companyName
      })
      .select()
      .single();

    if (companyError) {
      console.error('Failed to create company:', companyError);
      return NextResponse.json(
        { error: 'Failed to create company', details: companyError.message }, 
        { status: 500 }
      );
    }

    // Create or update profile
    console.log('Creating/updating profile for user:', user.id, 'with company_id:', company.id);
    
    const profileData = {
      id: user.id,
      email: user.email!,
      first_name: user.user_metadata?.first_name || '',
      last_name: user.user_metadata?.last_name || '',
      company_id: company.id
    };

    console.log('Profile data:', profileData);

    let profile;
    if (existingProfile) {
      // Update existing profile with company_id
      console.log('Updating existing profile...');
      const { data: updatedProfile, error: updateError } = await admin
        .from('profiles')
        .update({ company_id: company.id })
        .eq('id', user.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Failed to update profile:', updateError);
        await admin.from('companies').delete().eq('id', company.id);
        return NextResponse.json(
          { error: 'Failed to update profile', details: updateError.message }, 
          { status: 500 }
        );
      }
      profile = updatedProfile;
    } else {
      // Create new profile with only the fields that exist
      console.log('Creating new profile...');
      const { data: newProfile, error: profileError } = await admin
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          company_id: company.id
        })
        .select()
        .single();
      
      if (profileError) {
        console.error('Failed to create profile:', profileError);
        await admin.from('companies').delete().eq('id', company.id);
        return NextResponse.json(
          { error: 'Failed to create profile', details: profileError.message }, 
          { status: 500 }
        );
      }
      profile = newProfile;
    }

    // Create admin role for this company and assign to user
    console.log('Setting up admin permissions...');
    try {
      // First, create an admin role for this company
      const { data: adminRole, error: roleError } = await admin
        .from('roles')
        .insert({
          name: 'admin',
          company_id: company.id
        })
        .select()
        .single();

      if (roleError) {
        console.warn('Could not create admin role:', roleError);
      } else {
        console.log('Admin role created:', adminRole);
        
        // Then assign this role to the user
        try {
          const { data: userRole, error: userRoleError } = await admin
            .from('user_roles')
            .insert({
              user_id: user.id,
              role_id: adminRole.id,
              company_id: company.id
            })
            .select()
            .single();

          if (userRoleError) {
            console.warn('Could not assign admin role to user:', userRoleError);
          } else {
            console.log('Admin role assigned to user:', userRole);
          }
        } catch (error) {
          console.warn('Could not create user_roles entry:', error);
        }
      }
    } catch (error) {
      console.warn('Could not create admin role:', error);
    }

    // Also ensure user has company ownership
    try {
      const { data: companyUser, error: companyUserError } = await admin
        .from('company_users')
        .insert({
          user_id: user.id,
          company_id: company.id,
          role: 'owner',
          status: 'active'
        })
        .select()
        .single();

      if (companyUserError) {
        console.warn('Could not create company_users entry:', companyUserError);
      } else {
        console.log('Company ownership assigned:', companyUser);
      }
    } catch (error) {
      console.warn('Could not create company_users entry:', error);
    }

    // Create sample data
    await createSampleData(admin, company.id, user.id);

    return NextResponse.json({
      success: true,
      message: 'Account recovered successfully! Company and profile created.',
      user: { id: user.id, email: user.email },
      company: { id: company.id, name: company.name },
      profile
    });

  } catch (error: any) {
    console.error('Recovery error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message }, 
      { status: 500 }
    );
  }
}

async function createSampleData(admin: any, companyId: string, userId: string) {
  try {
    // Create sample payment method
    try {
      await admin
        .from('payment_methods')
        .insert({
          name: 'Cash',
          company_id: companyId,
          user_uid: userId
        });
    } catch (error) {
      console.warn('Could not create sample payment method:', error);
    }

    // Create sample customer
    try {
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
    } catch (error) {
      console.warn('Could not create sample customer:', error);
    }

    // Create sample products
    const sampleProducts = [
      { name: 'Sample Product 1', price: 9.99, category: 'General', in_stock: 100 },
      { name: 'Sample Product 2', price: 19.99, category: 'Electronics', in_stock: 50 },
      { name: 'Sample Product 3', price: 5.99, category: 'Food', in_stock: 200 }
    ];

    for (const product of sampleProducts) {
      try {
        await admin
          .from('products')
          .insert({
            ...product,
            company_id: companyId,
            user_uid: userId,
            description: `Sample ${product.category.toLowerCase()} product for demonstration`,
            low_stock_threshold: 10
          });
      } catch (error) {
        console.warn(`Could not create sample product ${product.name}:`, error);
      }
    }

  } catch (error) {
    console.warn('Failed to create sample data:', error);
  }
}
