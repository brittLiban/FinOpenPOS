import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/service';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        company_id,
        companies!inner (
          stripe_account_id,
          stripe_onboarding_complete,
          stripe_charges_enabled,
          stripe_payouts_enabled,
          stripe_details_submitted
        )
      `)
      .eq('id', user.id)
      .single();

    if (!profile?.companies) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const company = Array.isArray(profile.companies) ? profile.companies[0] : profile.companies;
    
    if (!company.stripe_account_id) {
      return NextResponse.json({ error: 'Stripe account not found' }, { status: 404 });
    }

    // Get latest status from Stripe
    const account = await stripe.accounts.retrieve(company.stripe_account_id);

    // Update company record with latest status
    const admin = createAdminClient();
    await admin
      .from('companies')
      .update({
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        stripe_details_submitted: account.details_submitted,
        stripe_onboarding_complete: account.details_submitted && account.charges_enabled
      })
      .eq('stripe_account_id', company.stripe_account_id);

    return NextResponse.json({
      account_id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      onboarding_complete: account.details_submitted && account.charges_enabled,
      business_type: account.business_type,
      country: account.country,
      created: account.created
    });

  } catch (error) {
    console.error('Error checking account status:', error);
    return NextResponse.json(
      { error: 'Failed to check account status' }, 
      { status: 500 }
    );
  }
}
