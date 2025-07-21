// Utility to extract company_id for the current user
// Assumes company_id is stored in user metadata (recommended for Supabase)

import { User } from '@supabase/supabase-js';

/**
 * Extracts the company_id (tenant id) from a Supabase user object.
 * Throws an error if not found.
 *
 * @param user Supabase user object
 * @returns company_id (uuid string)
 */
export function getCompanyId(user: User): string {
  // If you store company_id in user.user_metadata
  const companyId = user.user_metadata?.company_id;
  if (!companyId) {
    throw new Error('No company_id found in user metadata.');
  }
  return companyId;
}
