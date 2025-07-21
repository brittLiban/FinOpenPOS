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
  
  // Optionally assign a role
  if (role_id) {
    const { error: roleError } = await admin.from('user_roles').insert({ 
      user_id, 
      role_id, 
      tenant_id: companyId 
    });
    if (roleError) throw roleError;
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
  const admin = createAdminClient();
  
  // Get user details before deletion for audit log
  const { data: userProfile } = await supabase.from('profiles').select('email, company_id').eq('id', user_id).single();
  const { data: userRoles } = await supabase.from('user_roles').select('role_id').eq('user_id', user_id);
  
  // Remove from user_roles first (if not ON DELETE CASCADE)
  await supabase.from('user_roles').delete().eq('user_id', user_id);
  // Remove from profiles
  const { error } = await supabase.from('profiles').delete().eq('id', user_id);
  if (error) throw error;
  
  // Delete from Supabase Auth
  await admin.auth.admin.deleteUser(user_id);
  
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
      roles: userRoles?.map(r => r.role_id) || [],
      deleted_via: 'admin_panel'
    }
  });
}


export async function getAllRoles() {
  const supabase = createClient();
  const { data, error } = await supabase.from("roles").select("id, name");
  if (error) throw error;
  return data || [];
}

export async function updateUserRole(user_id: string, role_id: number) {
  const supabase = createClient();
  // Remove old role
  await supabase.from("user_roles").delete().eq("user_id", user_id);
  // Assign new role
  const { error } = await supabase.from("user_roles").insert({ user_id, role_id });
  if (error) throw error;
}
