import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripeConnect } from '@/lib/stripe';



export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated with user' }, { status: 400 });
    }

    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // If company already has a Stripe account, return existing onboarding link
    if (company.stripe_account_id && !company.stripe_onboarding_complete) {
      const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/settings/stripe/complete`;
      const refreshUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/settings/stripe/refresh`;
      
      const accountLink = await stripeConnect.createAccountLink(
        company.stripe_account_id,
        returnUrl,
        refreshUrl
      );

      return NextResponse.json({ url: accountLink.url });
    }

    // If onboarding is already complete, return status
    if (company.stripe_onboarding_complete) {
      return NextResponse.json({ 
        message: 'Stripe onboarding already complete',
        account_id: company.stripe_account_id
      });
    }

    // Create new Stripe Connect account
    const account = await stripeConnect.createAccount({
      email: user.email!,
      businessName: company.name,
      type: 'express', // Express accounts are easier to onboard
    });

    // Update company with Stripe account info
    await supabase
      .from('companies')
      .update({
        stripe_account_id: account.id,
        stripe_account_type: account.type,
      })
      .eq('id', company.id);

    // Create onboarding link
    const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/settings/stripe/complete`;
    const refreshUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/settings/stripe/refresh`;
    
    const accountLink = await stripeConnect.createAccountLink(
      account.id,
      returnUrl,
      refreshUrl
    );

    return NextResponse.json({ 
      url: accountLink.url,
      account_id: account.id
    });

  } catch (error: any) {
    console.error('Stripe Connect onboarding error:', error);
    return NextResponse.json({ 
      error: 'Failed to create Stripe account',
      details: error.message 
    }, { status: 500 });
  }
}

// Get current Stripe account status
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated with user' }, { status: 400 });
    }

    const { data: company } = await supabase
      .from('companies')
      .select('stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled, platform_fee_percent')
      .eq('id', profile.company_id)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // If no Stripe account, return need onboarding
    if (!company.stripe_account_id) {
      return NextResponse.json({ 
        status: 'needs_onboarding',
        onboarding_complete: false,
        charges_enabled: false,
        payouts_enabled: false
      });
    }

    // Get latest account status from Stripe
    try {
      const account = await stripeConnect.getAccount(company.stripe_account_id);
      
      // Update local database with latest status
      await supabase
        .from('companies')
        .update({
          stripe_onboarding_complete: account.details_submitted && account.charges_enabled,
          stripe_details_submitted: account.details_submitted,
          stripe_charges_enabled: account.charges_enabled,
          stripe_payouts_enabled: account.payouts_enabled,
        })
        .eq('id', profile.company_id);

      return NextResponse.json({
        status: account.details_submitted && account.charges_enabled ? 'complete' : 'incomplete',
        account_id: account.id,
        onboarding_complete: account.details_submitted && account.charges_enabled,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        platform_fee_percent: company.platform_fee_percent,
        requirements: account.requirements,
      });

    } catch (stripeError: any) {
      console.error('Failed to fetch Stripe account:', stripeError);
      return NextResponse.json({
        status: 'error',
        error: 'Failed to fetch account status',
        details: stripeError.message
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Stripe status check error:', error);
    return NextResponse.json({ 
      error: 'Failed to check Stripe status',
      details: error.message 
    }, { status: 500 });
  }
}
