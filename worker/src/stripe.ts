// Stripe Integration for Morgus
// Handles subscriptions, payments, and webhook events

import Stripe from 'stripe';

export interface StripeEnv {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PUBLISHABLE_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

// Subscription plan configuration
export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: null,
    stripePriceId: null,
  },
  daily: {
    id: 'daily',
    name: 'Day Pass',
    price: 300, // $3.00
    interval: 'day' as const,
    stripePriceId: null, // Will be created dynamically or set manually
  },
  weekly: {
    id: 'weekly',
    name: 'Weekly',
    price: 2100, // $21.00
    interval: 'week' as const,
    stripePriceId: null,
  },
  monthly: {
    id: 'monthly',
    name: 'Monthly',
    price: 7500, // $75.00
    interval: 'month' as const,
    stripePriceId: null,
  },
};

export class StripeService {
  private stripe: Stripe;
  private webhookSecret: string;
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(env: StripeEnv) {
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
    this.webhookSecret = env.STRIPE_WEBHOOK_SECRET;
    this.supabaseUrl = env.SUPABASE_URL;
    this.supabaseKey = env.SUPABASE_SERVICE_KEY;
  }

  // Create or get Stripe customer for a user
  async getOrCreateCustomer(userId: string, email: string): Promise<string> {
    // Check if customer already exists in Supabase
    const profileResponse = await fetch(
      `${this.supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=stripe_customer_id`,
      {
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
      }
    );
    
    const profiles = await profileResponse.json() as any[];
    
    if (profiles.length > 0 && profiles[0].stripe_customer_id) {
      return profiles[0].stripe_customer_id;
    }

    // Create new Stripe customer
    const customer = await this.stripe.customers.create({
      email,
      metadata: {
        morgus_user_id: userId,
      },
    });

    // Save customer ID to Supabase
    await fetch(
      `${this.supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          stripe_customer_id: customer.id,
        }),
      }
    );

    return customer.id;
  }

  // Create a checkout session for subscription
  async createCheckoutSession(
    userId: string,
    email: string,
    planId: 'daily' | 'weekly' | 'monthly',
    successUrl: string,
    cancelUrl: string
  ): Promise<{ url: string; sessionId: string }> {
    const customerId = await this.getOrCreateCustomer(userId, email);
    const plan = PLANS[planId];

    // Create a price for the plan (or use existing price ID)
    let priceId = plan.stripePriceId;
    
    if (!priceId) {
      // Create a one-time price for day pass, or recurring for weekly/monthly
      if (planId === 'daily') {
        // Day pass is a one-time payment
        const session = await this.stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: 'Morgus Day Pass',
                  description: 'Full access to Morgus for 24 hours',
                },
                unit_amount: plan.price,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            morgus_user_id: userId,
            plan_id: planId,
          },
        });

        return { url: session.url!, sessionId: session.id };
      } else {
        // Weekly/Monthly are subscriptions
        const session = await this.stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `Morgus ${plan.name}`,
                  description: `Full access to Morgus - ${plan.name} subscription`,
                },
                unit_amount: plan.price,
                recurring: {
                  interval: plan.interval!,
                },
              },
              quantity: 1,
            },
          ],
          mode: 'subscription',
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            morgus_user_id: userId,
            plan_id: planId,
          },
        });

        return { url: session.url!, sessionId: session.id };
      }
    }

    throw new Error('Price ID not configured');
  }

  // Create a portal session for managing subscription
  async createPortalSession(userId: string, returnUrl: string): Promise<string> {
    // Get customer ID from Supabase
    const profileResponse = await fetch(
      `${this.supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=stripe_customer_id`,
      {
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
      }
    );
    
    const profiles = await profileResponse.json() as any[];
    
    if (!profiles.length || !profiles[0].stripe_customer_id) {
      throw new Error('No Stripe customer found for user');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: profiles[0].stripe_customer_id,
      return_url: returnUrl,
    });

    return session.url;
  }

  // Verify and parse webhook event
  async verifyWebhook(payload: string, signature: string): Promise<Stripe.Event> {
    // Use constructEventAsync for Cloudflare Workers (SubtleCrypto compatibility)
    return await this.stripe.webhooks.constructEventAsync(
      payload,
      signature,
      this.webhookSecret
    );
  }

  // Handle webhook events
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    console.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.morgus_user_id;
    const planId = session.metadata?.plan_id;

    if (!userId || !planId) {
      console.error('Missing metadata in checkout session');
      return;
    }

    // For day pass (one-time payment)
    if (planId === 'daily') {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Update profiles table
      await fetch(
        `${this.supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            subscription_status: 'daily',
            subscription_tier: 'daily',
            subscription_started_at: new Date().toISOString(),
            subscription_ends_at: expiresAt.toISOString(),
            day_pass_balance: 1,
            day_pass_expires_at: expiresAt.toISOString(),
          }),
        }
      );

      // Create subscription record
      await fetch(
        `${this.supabaseUrl}/rest/v1/subscriptions`,
        {
          method: 'POST',
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
          }),
        }
      );

      // Record payment
      await this.recordPayment(userId, session.amount_total || 300, 'day_pass', session.payment_intent as string);
    }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const customerId = subscription.customer as string;
    
    // Get user ID from customer metadata or lookup
    const customer = await this.stripe.customers.retrieve(customerId);
    const userId = (customer as Stripe.Customer).metadata?.morgus_user_id;

    if (!userId) {
      console.error('No user ID found for customer:', customerId);
      return;
    }

    // Determine plan from price
    const priceAmount = subscription.items.data[0]?.price.unit_amount || 0;
    let tier = 'weekly';
    if (priceAmount >= 7000) tier = 'monthly';
    else if (priceAmount <= 500) tier = 'daily';

    const status = subscription.status === 'active' ? 'active' : subscription.status;

    // Safely convert timestamps (some may be null or undefined)
    const startDate = subscription.start_date ? new Date(subscription.start_date * 1000).toISOString() : new Date().toISOString();
    const periodStart = subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : new Date().toISOString();
    const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;

    // Update profiles table
    await fetch(
      `${this.supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          subscription_status: status,
          subscription_tier: tier,
          stripe_subscription_id: subscription.id,
          subscription_started_at: startDate,
          subscription_ends_at: periodEnd,
        }),
      }
    );

    // Upsert subscription record
    await fetch(
      `${this.supabaseUrl}/rest/v1/subscriptions`,
      {
        method: 'POST',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          user_id: userId,
          plan_id: tier,
          status: status,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          started_at: startDate,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          expires_at: periodEnd,
        }),
      }
    );
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const customerId = subscription.customer as string;
    const customer = await this.stripe.customers.retrieve(customerId);
    const userId = (customer as Stripe.Customer).metadata?.morgus_user_id;

    if (!userId) return;

    // Update profiles table
    await fetch(
      `${this.supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          subscription_status: 'cancelled',
          stripe_subscription_id: null,
        }),
      }
    );

    // Update subscription record
    await fetch(
      `${this.supabaseUrl}/rest/v1/subscriptions?stripe_subscription_id=eq.${subscription.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        }),
      }
    );
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    const customer = await this.stripe.customers.retrieve(customerId);
    const userId = (customer as Stripe.Customer).metadata?.morgus_user_id;

    if (!userId) return;

    await this.recordPayment(
      userId,
      invoice.amount_paid,
      'subscription',
      invoice.payment_intent as string,
      invoice.id
    );
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    const customer = await this.stripe.customers.retrieve(customerId);
    const userId = (customer as Stripe.Customer).metadata?.morgus_user_id;

    if (!userId) return;

    // Record failed payment
    await fetch(
      `${this.supabaseUrl}/rest/v1/payment_history`,
      {
        method: 'POST',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          user_id: userId,
          stripe_invoice_id: invoice.id,
          amount_cents: invoice.amount_due,
          status: 'failed',
          purchase_type: 'subscription',
        }),
      }
    );
  }

  private async recordPayment(
    userId: string,
    amountCents: number,
    purchaseType: string,
    paymentIntentId?: string,
    invoiceId?: string
  ): Promise<void> {
    await fetch(
      `${this.supabaseUrl}/rest/v1/payment_history`,
      {
        method: 'POST',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          user_id: userId,
          stripe_payment_intent_id: paymentIntentId,
          stripe_invoice_id: invoiceId,
          amount_cents: amountCents,
          status: 'succeeded',
          purchase_type: purchaseType,
        }),
      }
    );
  }
}

// Webhook handler for Cloudflare Worker
export async function handleStripeWebhook(
  request: Request,
  env: StripeEnv
): Promise<Response> {
  const signature = request.headers.get('stripe-signature');
  
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  const payload = await request.text();
  const stripeService = new StripeService(env);

  try {
    const event = await stripeService.verifyWebhook(payload, signature);
    await stripeService.handleWebhookEvent(event);
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
}
