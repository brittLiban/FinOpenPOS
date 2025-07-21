import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from 'uuid';
// ...existing code...
import { createAdminClient } from "@/lib/supabase/service";
import { getCompanyId } from "@/lib/supabase/getCompanyId";
import { logAudit } from "@/lib/log-audit";

// Add a new user to profiles and optionally assign a role
export async function addUser(email: string, password: string, role_id?: number, companyId?: string, adminUserId?: string) {
  const admin = createAdminClient();
  
  if (!companyId) {
    throw new Error('Company ID is required.');
  }
  
  console.log('Creating user with company_id:', companyId);
  
  // Create user in Supabase Auth (service role) with company_id in metadata
  const { data: userData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { company_id: companyId }
  });
  if (authError) throw authError;
  const user_id = userData?.user?.id;
  if (!user_id) throw new Error('Failed to create user.');
  
  // Insert into profiles with company_id
  const { error: profileError } = await admin.from('profiles').insert({ 
    id: user_id, 
    email, 
    company_id: companyId 
  });
  if (profileError) throw profileError;
  
  // Optionally assign a role via sidebar_permissions
  if (role_id) {
    // Create basic sidebar permissions for the role
    const sidebarItems = ['dashboard', 'pos'];
    const permissionInserts = sidebarItems.map(item => ({
      user_id,
      role_id,
      company_id: companyId,
      item_key: item,
      enabled: true
    }));
    
    const { error: permissionError } = await admin
      .from('sidebar_permissions')
      .insert(permissionInserts);
    if (permissionError) throw permissionError;
  }
  
  // Audit log for user creation
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
  
  return user_id;
}

// Delete a user from profiles (and cascade if needed)
export async function deleteUser(user_id: string, adminUserId?: string) {
  const supabase = createClient();
  
  // Get user details before deletion for audit log
  const { data: userProfile } = await supabase.from('profiles').select('email, company_id').eq('id', user_id).single();
  const { data: userPermissions } = await supabase.from('sidebar_permissions').select('role_id').eq('user_id', user_id);
  
  // Remove from sidebar_permissions first
  await supabase.from('sidebar_permissions').delete().eq('user_id', user_id);
  // Remove from profiles
  const { error } = await supabase.from('profiles').delete().eq('id', user_id);
  if (error) throw error;
  
  // Try to delete from Supabase Auth (optional - might fail if no service key)
  try {
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(user_id);
  } catch (authError) {
    console.warn('Could not delete from auth (service key might be missing):', authError);
    // Continue - the user profile is deleted which is the main thing
  }
  
  // Audit log for user deletion
  await logAudit({
    userId: adminUserId || null,
    actionType: 'delete',
    entityType: 'user',
    entityId: user_id,
    companyId: userProfile?.company_id || '',
    details: {
      email: userProfile?.email,
      company_id: userProfile?.company_id,
      roles: userPermissions?.map(r => r.role_id) || [],
      deleted_via: 'admin_panel'
    }
  });
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
  
  // Remove old permissions
  await supabase.from("sidebar_permissions").delete().eq("user_id", user_id);
  
  // Assign new role with basic permissions
  const sidebarItems = ['dashboard', 'pos', 'orders', 'products', 'customers'];
  const permissionInserts = sidebarItems.map(item => ({
    user_id,
    role_id,
    company_id: profile.company_id,
    item_key: item,
    enabled: true
  }));
  
  const { error } = await supabase.from("sidebar_permissions").insert(permissionInserts);
  if (error) throw error;
}
