import { NextResponse } from 'next/server';
import { getAuthenticatedCompanyId } from '@/lib/supabase/getAuthenticatedCompanyId';

export async function GET() {
  try {
    const { companyId, supabase } = await getAuthenticatedCompanyId();

    const { data: company, error } = await supabase
      .from('companies')
      .select(`
        stripe_account_id,
        stripe_charges_enabled,
        stripe_payouts_enabled,
        stripe_onboarding_complete,
        stripe_details_submitted
      `)
      .eq('id', companyId)
      .single();

    if (error) {
      console.error('Error fetching company Stripe status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      stripe_account_id: company.stripe_account_id,
      stripe_charges_enabled: company.stripe_charges_enabled || false,
      stripe_payouts_enabled: company.stripe_payouts_enabled || false,
      stripe_onboarding_complete: company.stripe_onboarding_complete || false,
      stripe_details_submitted: company.stripe_details_submitted || false
    });
  } catch (error) {
    console.error('Error in Stripe status GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
