// Utility to set company_id in user_metadata for a user (programmatically)
import { createAdminClient } from './service';

/**
 * Sets the company_id in user_metadata for a given user.
 * @param userId - The Supabase user ID (UUID)
 * @param companyId - The company UUID to assign
 * @returns The updated user object
 */
export async function setCompanyIdForUser(userId: string, companyId: string) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { company_id: companyId },
  });
  if (error) throw error;
  return data;
}
