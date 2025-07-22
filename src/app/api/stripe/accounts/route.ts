import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/service';
import { stripe } from '@/lib/stripe';
import { getAuthenticatedCompanyId } from '@/lib/supabase/getAuthenticatedCompanyId';


export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const adminSupabase = createAdminClient();
    
    // Check if user is authenticated (optional - you might want admin-only access)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all companies with Stripe accounts
    const { data: companies, error } = await adminSupabase
      .from('companies')
      .select('id, name, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, created_at')
      .not('stripe_account_id', 'is', null);

    if (error) {
      console.error('Failed to fetch companies:', error);
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
    }

    // Get detailed account info from Stripe
    const accountsWithDetails = await Promise.all(
      companies.map(async (company) => {
        try {
          const account = await stripe.accounts.retrieve(company.stripe_account_id);
          
          return {
            id: account.id,
            business_name: account.business_profile?.name || company.name,
            email: account.email,
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            created: account.created,
            company_id: company.id,
            company_name: company.name,
            onboarding_complete: company.stripe_charges_enabled,
          };
        } catch (stripeError) {
          console.error(`Failed to fetch Stripe account ${company.stripe_account_id}:`, stripeError);
          return {
            id: company.stripe_account_id,
            business_name: company.name,
            email: 'Unknown',
            charges_enabled: company.stripe_charges_enabled || false,
            payouts_enabled: company.stripe_payouts_enabled || false,
            created: Math.floor(new Date(company.created_at).getTime() / 1000),
            company_id: company.id,
            company_name: company.name,
            onboarding_complete: company.stripe_charges_enabled,
            error: 'Failed to fetch from Stripe'
          };
        }
      })
    );

    return NextResponse.json({ 
      accounts: accountsWithDetails,
      total: accountsWithDetails.length 
    });

  } catch (error) {
    console.error('Stripe accounts API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch Stripe accounts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
