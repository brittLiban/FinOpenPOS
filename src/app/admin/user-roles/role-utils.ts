import { createClient } from "@/lib/supabase/client";

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
