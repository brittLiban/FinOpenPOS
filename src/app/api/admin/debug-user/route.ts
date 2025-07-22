import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/service';

// This API route uses authentication and must be dynamic
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const admin = createAdminClient();
    
    // Get current user
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('Checking user:', userData.user.id);

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    console.log('Profile query result:', profile);
    console.log('Profile error:', profileError);

    // Check if user has company association
    const { data: companyUser, error: companyError } = await admin
      .from('company_users')
      .select('company_id')
      .eq('user_id', userData.user.id)
      .single();

    console.log('Company user result:', companyUser);
    console.log('Company error:', companyError);

    return NextResponse.json({
      user_id: userData.user.id,
      email: userData.user.email,
      profile: profile,
      profileError: profileError?.message,
      companyUser: companyUser,
      companyError: companyError?.message,
      hasProfile: !!profile,
      hasCompanyId: !!profile?.company_id,
      hasCompanyAssociation: !!companyUser
    });

  } catch (error: any) {
    console.error('Debug user error:', error);
    return NextResponse.json({ 
      error: `Debug failed: ${error.message}` 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const admin = createAdminClient();
    
    // Get current user
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('Fixing user profile for:', userData.user.id);

    // Get user's company association
    const { data: companyUser } = await admin
      .from('company_users')
      .select('company_id')
      .eq('user_id', userData.user.id)
      .single();

    if (!companyUser?.company_id) {
      return NextResponse.json({ 
        error: 'No company association found - user needs to be properly onboarded' 
      }, { status: 400 });
    }

    // Update or create profile with company_id
    const { data: updatedProfile, error: updateError } = await admin
      .from('profiles')
      .upsert({
        id: userData.user.id,
        email: userData.user.email || '',
        company_id: companyUser.company_id,
        role: 'admin', // Default to admin if they can access admin panel
        created_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({ 
        error: `Failed to update profile: ${updateError.message}` 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile fixed successfully',
      profile: updatedProfile
    });

  } catch (error: any) {
    console.error('Fix user error:', error);
    return NextResponse.json({ 
      error: `Fix failed: ${error.message}` 
    }, { status: 500 });
  }
}
