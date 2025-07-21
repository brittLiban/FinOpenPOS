import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';
import { getCompanyId } from '@/lib/supabase/getCompanyId';
import { setCompanyIdForUser } from '@/lib/supabase/setCompanyId';

export async function POST(req: NextRequest) {
  console.log('POST /admin/user-roles/add-user-api handler reached');
  try {
    const { email, password, role_id } = await req.json();
    console.log('Add user request:', { email, password: !!password, role_id });
    // Get the current admin user (the one making the request)
    const supabase = createClient();
    const {
      data: { user: adminUser },
      error: adminError,
    } = await supabase.auth.getUser();
    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }
    // Always get the company_id from the admin user's metadata or profile
    let companyId: string | null = null;
    try {
      companyId = getCompanyId(adminUser);
    } catch {
      // fallback: try to fetch from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', adminUser.id)
        .single();
      companyId = profile?.company_id || null;
    }
    if (!companyId) {
      return NextResponse.json({ error: 'Could not resolve company_id for admin.' }, { status: 400 });
    }
    console.log('Resolved companyId (admin):', companyId, 'typeof:', typeof companyId);
    // Create the new user in Supabase Auth (service role)
    const supabaseAdmin = createAdminClient();
    // Check if user already exists in auth.users (workaround: list all users and filter by email)
    const { data: allUsers, error: existingUserError } = await supabaseAdmin.auth.admin.listUsers();
    let user_id = null;
    if (existingUserError) throw existingUserError;
    const foundUser = allUsers?.users?.find((u: any) => u.email === email);
    console.log('Found user in auth:', foundUser);
    if (foundUser) {
      user_id = foundUser.id;
      // Check if user exists in profiles
      const { data: profileExists, error: profileError } = await supabaseAdmin.from('profiles').select('id').eq('id', user_id).maybeSingle();
      console.log('Profile exists:', profileExists, 'Profile error:', profileError);
      if (!profileExists) {
        // Insert into profiles if not present, always use admin's company_id
        try {
          console.log('Calling create_profile_with_company RPC with:', { user_id, email, companyId, typeof_companyId: typeof companyId });
          const insertResult = await supabaseAdmin.rpc('create_profile_with_company', { p_id: user_id, p_email: email, p_company_id: companyId });
          console.log('RPC payload:', { p_id: user_id, p_email: email, p_company_id: companyId });
          console.log('Inserted into profiles (RPC result):', insertResult);
          if (insertResult.error) {
            console.error('Error inserting into profiles (RPC):', insertResult.error, 'companyId:', companyId, 'payload:', { p_id: user_id, p_email: email, p_company_id: companyId });
            return NextResponse.json({ error: insertResult.error.message, debug_company_id: companyId, debug_payload: { p_id: user_id, p_email: email, p_company_id: companyId }, debug_rpc: insertResult }, { status: 500 });
          }
        } catch (insertErr) {
          console.error('Exception inserting into profiles:', insertErr);
          return NextResponse.json({ error: (insertErr as Error).message || 'Failed to insert into profiles.' }, { status: 500 });
        }
        // Set company_id in user_metadata for the user
        await setCompanyIdForUser(user_id, companyId);
        // Optionally assign a role (if provided)
        if (role_id) {
          await supabaseAdmin.from('user_roles').insert({ user_id, role_id, tenant_id: companyId });
        }
        return NextResponse.json({ user_id });
      } else {
        return NextResponse.json({ error: 'A user with this email address has already been registered.' }, { status: 400 });
      }
    } else {
      // User does not exist, create new
      const createUserPayload = {
        email,
        password,
        email_confirm: true,
        user_metadata: { company_id: companyId },
      };
      console.log('Payload sent to createUser:', createUserPayload);
      const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser(createUserPayload);
      console.log('Result from createUser:', { userData, authError });
      if (authError) throw authError;
      user_id = userData?.user?.id;
      if (!user_id) throw new Error('Failed to create user.');
      // Set company_id in user_metadata for the new user
      await setCompanyIdForUser(user_id, companyId);
      // Optionally assign a role (if provided)
      if (role_id) {
        await supabaseAdmin.from('user_roles').insert({ user_id, role_id, tenant_id: companyId });
      }
      // Insert into profiles, always use admin's company_id
      console.log('Calling create_profile_with_company RPC with:', { user_id, email, companyId, typeof_companyId: typeof companyId });
      const rpcResult = await supabaseAdmin.rpc('create_profile_with_company', { p_id: user_id, p_email: email, p_company_id: companyId });
      console.log('RPC payload:', { p_id: user_id, p_email: email, p_company_id: companyId });
      console.log('Inserted into profiles (RPC result):', rpcResult);
      if (rpcResult.error) {
        console.error('Error inserting into profiles (RPC):', rpcResult.error, 'companyId:', companyId, 'payload:', { p_id: user_id, p_email: email, p_company_id: companyId });
        return NextResponse.json({ error: rpcResult.error.message, debug_company_id: companyId, debug_payload: { p_id: user_id, p_email: email, p_company_id: companyId }, debug_rpc: rpcResult }, { status: 500 });
      }
      return NextResponse.json({ user_id });
    }
  } catch (error: any) {
    console.error('Add user error (outer catch):', error);
    try {
      return NextResponse.json({ error: error.message || 'Failed to add user.' }, { status: 500 });
    } catch (jsonErr) {
      console.error('Error sending JSON response:', jsonErr);
      throw error;
    }
  }
}
