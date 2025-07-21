import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/service';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const adminSupabase = createAdminClient();
    
    // Get authenticated user and their company
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      .select('stripe_account_id, stripe_charges_enabled, name')
      .eq('id', profile.company_id)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Check if company has Stripe Connect enabled
    if (!company.stripe_account_id || !company.stripe_charges_enabled) {
      return NextResponse.json({ 
        error: 'Stripe account not set up. Please complete onboarding first.',
        needsOnboarding: true
      }, { status: 400 });
    }

    // Get products for this company only
    const { data: products, error } = await adminSupabase
      .from('products')
      .select('*')
      .eq('company_id', profile.company_id);

    if (error) {
      console.error('❌ Failed to fetch products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    let syncedCount = 0;

    for (const product of products || []) {
      // Skip if already synced
      if (product.stripe_product_id && product.stripe_price_id) {
        console.log(`⚠️ Product already synced: ${product.name}`);
        continue;
      }

      try {
        // Create product in Stripe using the company's Connect account
        const stripeProduct = await stripe.products.create({
          name: product.name,
          description: product.description || '',
          metadata: {
            product_id: String(product.id),
            company_id: String(profile.company_id),
          },
        }, {
          stripeAccount: company.stripe_account_id, // Use Connect account
        });

        // Create price in Stripe
        const stripePrice = await stripe.prices.create({
          unit_amount: Math.round(Number(product.price) * 100),
          currency: 'usd',
          product: stripeProduct.id,
        }, {
          stripeAccount: company.stripe_account_id, // Use Connect account
        });

        // Update product with Stripe IDs
        const { error: updateError } = await adminSupabase
          .from('products')
          .update({
            stripe_product_id: stripeProduct.id,
            stripe_price_id: stripePrice.id,
          })
          .eq('id', product.id)
          .eq('company_id', profile.company_id); // Ensure company isolation

        if (updateError) {
          console.error(`❌ Failed to update product ${product.id}:`, updateError);
          continue;
        }

        syncedCount++;
        console.log(`✅ Synced product: ${product.name} (ID: ${product.id})`);
      } catch (productError) {
        console.error(`❌ Failed to sync product ${product.id}:`, productError);
        // Continue with other products
      }
    }

    return NextResponse.json({ 
      message: `✅ Successfully synced ${syncedCount} products to Stripe Connect account`,
      company: company.name,
      syncedCount 
    });

  } catch (error) {
    console.error('❌ Sync products error:', error);
    return NextResponse.json({ 
      error: 'Failed to sync products',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
