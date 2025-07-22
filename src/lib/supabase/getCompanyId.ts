// Utility to extract company_id for the current user
// Assumes company_id is stored in user metadata (recommended for Supabase)

import { User } from '@supabase/supabase-js';

/**
 * Extracts the company_id (tenant id) from a Supabase user object.
 * PRODUCTION-READY: Throws error if company_id is missing to prevent data leaks.
 *
 * @param user Supabase user object
 * @returns company_id (uuid string)
 * @throws Error if company_id is not found
 */
export function getCompanyId(user: User): string {
  // Get company_id from user.user_metadata
  const companyId = user.user_metadata?.company_id;
  
  if (!companyId) {
    // SECURITY: Never use default company_id in production
    // This prevents accidental data leaks between tenants
    throw new Error(`No company_id found for user ${user.email}. User needs to be assigned to a company.`);
  }
  
  // Validate it's a proper UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(companyId)) {
    throw new Error(`Invalid company_id format for user ${user.email}: ${companyId}`);
  }
  
  return companyId;
}
