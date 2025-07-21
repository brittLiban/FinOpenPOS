// Utility to get company_id for the current authenticated user
import { createClient } from '@/lib/supabase/server';
import { getCompanyId } from '@/lib/supabase/getCompanyId';

export async function getAuthenticatedCompanyId() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Get company_id from user metadata
  let companyId: string | null = null;
  try {
    companyId = getCompanyId(user);
  } catch {
    // Fallback: try to fetch from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();
    companyId = profile?.company_id || null;
  }

  if (!companyId) {
    throw new Error('Could not resolve company_id for user');
  }

  return { user, companyId, supabase };
}
