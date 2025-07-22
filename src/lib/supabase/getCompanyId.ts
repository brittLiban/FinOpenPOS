// Utility to extract company_id for the current user
// Assumes company_id is stored in user metadata (recommended for Supabase)

import { User } from '@supabase/supabase-js';

/**
 * Extracts the company_id (tenant id) from a Supabase user object.
 * Uses a default company_id if not found for demo purposes.
 *
 * @param user Supabase user object
 * @returns company_id (uuid string)
 */
export function getCompanyId(user: User): string {
  // If you store company_id in user.user_metadata
  let companyId = user.user_metadata?.company_id;
  
  if (!companyId) {
    // Use a default company_id for demo purposes
    // In production, you'd want to handle this differently
    companyId = '00000000-0000-0000-0000-000000000001';
    console.log(`Using default company_id ${companyId} for user ${user.email}`);
  }
  
  return companyId;
}
