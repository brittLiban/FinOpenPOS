import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

export async function POST(req: NextRequest) {
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
          id,
          name,
          subdomain,
          stripe_account_id
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

    // Generate URLs based on environment
    const tenantDomain = process.env.NEXT_PUBLIC_TENANT_DOMAIN || 'localhost:3000';
    const protocol = tenantDomain.includes('localhost') ? 'http' : 'https';
    const baseUrl = tenantDomain.includes('localhost') 
      ? `${protocol}://${tenantDomain}` 
      : `${protocol}://${company.subdomain}.${tenantDomain}`;

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: company.stripe_account_id,
      refresh_url: `${baseUrl}/settings/payments/refresh`,
      return_url: `${baseUrl}/settings/payments/success`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      url: accountLink.url,
      expires_at: accountLink.expires_at
    });

  } catch (error) {
    console.error('Error creating onboarding link:', error);
    return NextResponse.json(
      { error: 'Failed to create onboarding link' }, 
      { status: 500 }
    );
  }
}
