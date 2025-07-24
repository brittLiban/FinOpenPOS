import { createAdminClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export interface TenantInfo {
  id: string;
  name: string;
  subdomain: string;
  stripe_account_id?: string;
  stripe_onboarding_complete: boolean;
  business_type?: string;
  platform_fee_percentage: number;
}

/**
 * Get tenant information from subdomain in headers
 * Used in server components and API routes
 */
export async function getTenantFromHeaders(): Promise<TenantInfo | null> {
  const headersList = headers();
  const tenant = headersList.get('x-tenant');
  
  if (!tenant) {
    return null;
  }

  return await getTenantBySubdomain(tenant);
}

/**
 * Get tenant information by subdomain
 */
export async function getTenantBySubdomain(subdomain: string): Promise<TenantInfo | null> {
  const supabase = createAdminClient();
  
  const { data: company, error } = await supabase
    .from('companies')
    .select(`
      id,
      name,
      subdomain,
      stripe_account_id,
      stripe_onboarding_complete,
      business_type,
      platform_fee_percentage
    `)
    .eq('subdomain', subdomain)
    .single();

  if (error || !company) {
    console.error('Failed to get tenant by subdomain:', error);
    return null;
  }

  return company;
}

/**
 * Get tenant information from URL parameters
 * Used in client components
 */
export function getTenantFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('tenant');
}

/**
 * Get current user's company information
 * Used when user is authenticated
 */
export async function getCurrentUserTenant(): Promise<TenantInfo | null> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      company_id,
      companies!inner (
        id,
        name,
        subdomain,
        stripe_account_id,
        stripe_onboarding_complete,
        business_type,
        platform_fee_percentage
      )
    `)
    .eq('id', user.id)
    .single();

  if (!profile?.companies) {
    return null;
  }

  const company = Array.isArray(profile.companies) ? profile.companies[0] : profile.companies;
  return company as TenantInfo;
}

/**
 * Generate a unique subdomain from company name
 */
export function generateSubdomain(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 20);
}

/**
 * Check if subdomain is available
 */
export async function isSubdomainAvailable(subdomain: string): Promise<boolean> {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('companies')
    .select('id')
    .eq('subdomain', subdomain)
    .single();

  return !data && !error;
}

/**
 * Generate unique subdomain (adds numbers if needed)
 */
export async function generateUniqueSubdomain(companyName: string): Promise<string> {
  const baseSubdomain = generateSubdomain(companyName);
  let subdomain = baseSubdomain;
  let counter = 1;

  while (!(await isSubdomainAvailable(subdomain))) {
    subdomain = `${baseSubdomain}${counter}`;
    counter++;
  }

  return subdomain;
}

/**
 * Get tenant URL for a given subdomain
 */
export function getTenantUrl(subdomain: string): string {
  const isLocalhost = process.env.NODE_ENV === 'development';
  const domain = process.env.NEXT_PUBLIC_TENANT_DOMAIN || 'localhost:3000';
  
  if (isLocalhost) {
    return `http://${domain}?tenant=${subdomain}`;
  }
  
  return `https://${subdomain}.${domain}`;
}

/**
 * Redirect to tenant URL
 */
export function redirectToTenant(subdomain: string): string {
  return getTenantUrl(subdomain);
}
