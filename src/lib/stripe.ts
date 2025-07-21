import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-08-16', // Use latest stable
});

// Stripe Connect utilities
export const stripeConnect = {
  // Create a new Connect account for a company
  createAccount: async (companyData: {
    email: string;
    businessName: string;
    country?: string;
    type?: 'standard' | 'express' | 'custom';
  }) => {
    const account = await stripe.accounts.create({
      type: companyData.type || 'express',
      email: companyData.email,
      business_profile: {
        name: companyData.businessName,
      },
      country: companyData.country || 'US',
    });
    return account;
  },

  // Create onboarding link for a company
  createAccountLink: async (accountId: string, returnUrl: string, refreshUrl: string) => {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      return_url: returnUrl,
      refresh_url: refreshUrl,
      type: 'account_onboarding',
    });
    return accountLink;
  },

  // Get account status
  getAccount: async (accountId: string) => {
    return await stripe.accounts.retrieve(accountId);
  },

  // Create payment intent with application fee
  createPaymentIntent: async (params: {
    amount: number;
    currency: string;
    accountId: string;
    applicationFeeAmount: number;
    metadata?: Record<string, string>;
  }) => {
    return await stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency,
      application_fee_amount: params.applicationFeeAmount,
      transfer_data: {
        destination: params.accountId,
      },
      metadata: params.metadata,
    });
  },

  // Create checkout session with Connect account
  createCheckoutSession: async (params: {
    line_items: any[];
    accountId: string;
    applicationFeeAmount: number;
    success_url: string;
    cancel_url: string;
    metadata?: Record<string, string>;
  }) => {
    return await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: params.line_items,
      success_url: params.success_url,
      cancel_url: params.cancel_url,
      payment_intent_data: {
        application_fee_amount: params.applicationFeeAmount,
        transfer_data: {
          destination: params.accountId,
        },
      },
      metadata: params.metadata,
    });
  },
};
