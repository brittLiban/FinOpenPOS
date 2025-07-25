import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from 'uuid';
// ...existing code...
import { createAdminClient } from "@/lib/supabase/service";
import { getCompanyId } from "@/lib/supabase/getCompanyId";
import { logAudit } from "@/lib/log-audit";

// Add a new user to profiles and optionally assign a role
export async function addUser(email: string, password: string, role_id?: number, companyId?: string, adminUserId?: string) {
  console.log('=== ADD USER FUNCTION START ===');
  console.log('Parameters:', { email, role_id, companyId, adminUserId });
  
  const admin = createAdminClient();
  
  if (!companyId) {
    throw new Error('Company ID is required.');
  }
  
  console.log('Creating user with company_id:', companyId);
  
  try {
    // Create user in Supabase Auth (service role) with company_id in metadata
    console.log('Creating auth user...');
    const { data: userData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { company_id: companyId }
    });
    
    if (authError) {
      console.error('Auth creation error:', authError);
      throw authError;
    }
    
    const user_id = userData?.user?.id;
    if (!user_id) {
      console.error('No user ID returned from auth creation');
      throw new Error('Failed to create user.');
    }
    
    console.log('Auth user created with ID:', user_id);
    
    // Insert into profiles with company_id
    console.log('Inserting into profiles...');
    const { error: profileError } = await admin.from('profiles').insert({ 
      id: user_id, 
      email, 
      company_id: companyId 
    });
    
    if (profileError) {
      console.error('Profile creation error:', profileError);
      throw profileError;
    }
    
    console.log('Profile created successfully');
    
    // Add user to company_users table
    console.log('Adding to company_users...');
    const { error: companyUserError } = await admin
      .from('company_users')
      .insert({
        user_id,
        company_id: companyId,
        role: role_id ? (await admin.from('roles').select('name').eq('id', role_id).single()).data?.name || 'employee' : 'employee'
      });
    
    if (companyUserError) {
      console.error('Company user creation error:', companyUserError);
      throw companyUserError;
    }
    
    console.log('Company user association created');
    
    // Optionally assign a role via user_roles
    if (role_id) {
      console.log('Adding to user_roles...');
      const { error: roleError } = await admin
        .from('user_roles')
        .insert({
          user_id,
          role_id,
          tenant_id: companyId,
          company_id: companyId
        });
      
      if (roleError) {
        console.error('User role creation error:', roleError);
        throw roleError;
      }
      
      console.log('User role assignment created');
    }
    
    // Audit log for user creation
    console.log('Creating audit log...');
    await logAudit({
      userId: adminUserId || null,
      actionType: 'create',
      entityType: 'user',
      entityId: user_id,
      companyId: companyId,
      details: {
        email,
        role_id,
        company_id: companyId,
        created_via: 'admin_panel'
      }
    });
    
    console.log('=== ADD USER FUNCTION SUCCESS ===');
    return user_id;
    
  } catch (error: any) {
    console.error('=== ADD USER FUNCTION ERROR ===', error);
    console.error('Error details:', error.details || error.message);
    throw error;
  }
}

// Delete a user from profiles (and cascade if needed)
export async function deleteUser(user_id: string, adminUserId?: string) {
  const supabase = createClient();
  
  try {
    // Check if trying to delete self
    if (adminUserId && user_id === adminUserId) {
      throw new Error('Cannot delete your own admin account');
    }
    
    // Get user details before deletion for audit log
    const { data: userProfile } = await supabase.from('profiles').select('email, company_id').eq('id', user_id).single();
    const { data: userPermissions } = await supabase.from('sidebar_permissions').select('role_id').eq('user_id', user_id);
    
    console.log('Starting user deletion for:', userProfile?.email);
    
    // Try to create admin client
    let admin;
    try {
      admin = createAdminClient();
      // Test the admin client
      const { data: testAuth } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
      console.log('Admin client working, can access auth');
    } catch (adminError: any) {
      console.error('Admin client error:', adminError);
      throw new Error(`Service role key issue: ${adminError.message}`);
    }
    
    // Step 1: Clean up related data that might prevent deletion
    console.log('Cleaning up user-related data...');
    
    // Remove from sidebar_permissions (use regular client for RLS-protected tables)
    const { error: sidebarError } = await supabase.from('sidebar_permissions').delete().eq('user_id', user_id);
    if (sidebarError) console.warn('Error removing sidebar permissions:', sidebarError);
    
    // Remove from user_roles if exists (use admin for tables without RLS)
    const { error: userRoleError } = await admin.from('user_roles').delete().eq('user_id', user_id);
    if (userRoleError) console.warn('Error removing user roles:', userRoleError);
    
    // Remove from company_users if exists
    const { error: companyUserError } = await admin.from('company_users').delete().eq('user_id', user_id);
    if (companyUserError) console.warn('Error removing company users:', companyUserError);
    
    // Update any records that reference this user to NULL instead of deleting them
    // This preserves business data while removing the user association
    
    // Update audit_log entries (set user_id to NULL to preserve audit trail)
    const { error: auditError } = await admin.from('audit_log').update({ user_id: null }).eq('user_id', user_id);
    if (auditError) console.warn('Error updating audit log:', auditError);
    
    // Update employees table (set user_uid to NULL if it references this user)
    const { error: employeeError } = await admin.from('employees').update({ user_uid: null }).eq('user_uid', user_id);
    if (employeeError) console.warn('Error updating employees:', employeeError);
    
    // Update transactions (preserve transaction data but remove user association)
    const { error: transactionError } = await admin.from('transactions').update({ user_id: null }).eq('user_id', user_id);
    if (transactionError) console.warn('Error updating transactions:', transactionError);
    
    // Update orders (preserve order data but remove user association) 
    const { error: orderError } = await admin.from('orders').update({ user_id: null }).eq('user_id', user_id);
    if (orderError) console.warn('Error updating orders:', orderError);
    
    // Step 2: Delete the user profile
    console.log('Deleting user profile...');
    const { error: profileError } = await admin.from('profiles').delete().eq('id', user_id);
    if (profileError) {
      console.error('Error deleting profile:', profileError);
      throw new Error(`Failed to delete user profile: ${profileError.message}`);
    }
    
    // Step 3: Delete from Supabase Auth
    console.log('Deleting from Supabase Auth...');
    try {
      const { error: authDeleteError } = await admin.auth.admin.deleteUser(user_id);
      if (authDeleteError) {
        console.warn('Auth deletion error:', authDeleteError);
      } else {
        console.log('Successfully deleted from auth');
      }
    } catch (authError: any) {
      console.warn('Could not delete from auth:', authError?.message);
      // This is often expected - the profile deletion is the main thing
    }
    
    // Audit log for user deletion
    await logAudit({
      userId: adminUserId || null,
      actionType: 'delete',
      entityType: 'user',
      entityId: user_id,
      companyId: userProfile?.company_id || '',
      details: { 
        deletedUser: userProfile,
        permissions: userPermissions,
        message: 'User and associated data removed'
      }
    });
    
    console.log('User deletion completed successfully');
    
  } catch (error: any) {
    console.error('Error in deleteUser:', error);
    throw new Error(`Database error deleting user: ${error.message}`);
  }
}


export async function getAllRoles() {
  const supabase = createClient();
  
  // Get current user's company_id
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userData.user.id)
    .single();
    
  if (!profile?.company_id) throw new Error('No company associated with user');
  
  // Get roles for the user's company only
  const { data, error } = await supabase
    .from("roles")
    .select("id, name")
    .eq('company_id', profile.company_id);
    
  if (error) throw error;
  return data || [];
}

export async function updateUserRole(user_id: string, role_id: number) {
  const supabase = createClient();
  
  // Get user's company_id from their profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user_id)
    .single();
    
  if (!profile?.company_id) throw new Error('User profile not found');
  
  // Remove existing user_roles entries for this user
  await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", user_id);
  
  // Add new user_role entry
  const { error: roleError } = await supabase
    .from("user_roles")
    .insert({
      user_id: user_id,
      role_id: role_id,
      tenant_id: profile.company_id,
      company_id: profile.company_id
    });
    
  if (roleError) throw roleError;
  
  // Remove old user-specific permissions (users should inherit from role)
  await supabase.from("sidebar_permissions").delete().eq("user_id", user_id);
}
