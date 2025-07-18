import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from 'uuid';
// ...existing code...
import { createAdminClient } from "@/lib/supabase/service";

// Add a new user to profiles and optionally assign a role
export async function addUser(email: string, password: string, role_id?: number) {
  const supabase = createClient();
  const admin = createAdminClient();
  // Create user in Supabase Auth (service role)
  const { data: userData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (authError) throw authError;
  const user_id = userData?.user?.id;
  if (!user_id) throw new Error('Failed to create user.');
  // Insert into profiles
  const { error: profileError } = await supabase.from('profiles').insert({ id: user_id, email });
  if (profileError) throw profileError;
  // Optionally assign a role
  if (role_id) {
    const { error: roleError } = await supabase.from('user_roles').insert({ user_id, role_id });
    if (roleError) throw roleError;
  }
  return user_id;
}

// Delete a user from profiles (and cascade if needed)
export async function deleteUser(user_id: string) {
  const supabase = createClient();
  // Remove from user_roles first (if not ON DELETE CASCADE)
  await supabase.from('user_roles').delete().eq('user_id', user_id);
  // Remove from profiles
  const { error } = await supabase.from('profiles').delete().eq('id', user_id);
  if (error) throw error;
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
