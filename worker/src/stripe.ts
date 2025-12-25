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

  // =====================================================
  // IDEMPOTENCY: Check if event was already processed
  // =====================================================
  private async isEventProcessed(eventId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/stripe_webhook_events?stripe_event_id=eq.${eventId}&select=id`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
          },
        }
      );
      const events = await response.json() as any[];
      return events.length > 0;
    } catch (error) {
      console.error('Error checking event idempotency:', error);
      return false; // Process the event if we can't check
    }
  }

  // Record processed event for idempotency
  private async recordProcessedEvent(
    eventId: string, 
    eventType: string, 
    status: 'processed' | 'failed' | 'skipped' = 'processed',
    errorMessage?: string
  ): Promise<void> {
    try {
      await fetch(
        `${this.supabaseUrl}/rest/v1/stripe_webhook_events`,
        {
          method: 'POST',
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            stripe_event_id: eventId,
            event_type: eventType,
            status,
            error_message: errorMessage,
          }),
        }
      );
    } catch (error) {
      console.error('Error recording processed event:', error);
    }
  }

  // =====================================================
  // SUBSCRIPTION HISTORY: Track all subscription changes
  // =====================================================
  private async recordSubscriptionHistory(
    userId: string,
    subscriptionId: string | null,
    previousStatus: string | null,
    newStatus: string,
    previousTier: string | null,
    newTier: string,
    changeReason: string,
    stripeEventId: string
  ): Promise<void> {
    try {
      await fetch(
        `${this.supabaseUrl}/rest/v1/subscription_history`,
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
            subscription_id: subscriptionId,
            previous_status: previousStatus,
            new_status: newStatus,
            previous_tier: previousTier,
            new_tier: newTier,
            change_reason: changeReason,
            stripe_event_id: stripeEventId,
          }),
        }
      );
      console.log('Subscription history recorded:', changeReason);
    } catch (error) {
      console.error('Error recording subscription history:', error);
    }
  }

  // Get current user subscription status for history tracking
  private async getCurrentUserStatus(userId: string): Promise<{ status: string; tier: string } | null> {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=subscription_status,subscription_tier`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
          },
        }
      );
      const profiles = await response.json() as any[];
      if (profiles.length > 0) {
        return {
          status: profiles[0].subscription_status || 'free',
          tier: profiles[0].subscription_tier || 'free',
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting current user status:', error);
      return null;
    }
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

  // Handle webhook events with idempotency
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    console.log(`Processing Stripe event: ${event.type} (${event.id})`);

    // Check if event was already processed (idempotency)
    if (await this.isEventProcessed(event.id)) {
      console.log(`Event ${event.id} already processed, skipping`);
      await this.recordProcessedEvent(event.id, event.type, 'skipped');
      return;
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, event.id);
          break;
        
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription, event.id);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription, event.id);
          break;
        
        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice, event.id);
          break;
        
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice, event.id);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Record successful processing
      await this.recordProcessedEvent(event.id, event.type, 'processed');
    } catch (error: any) {
      console.error(`Error processing event ${event.id}:`, error.message);
      await this.recordProcessedEvent(event.id, event.type, 'failed', error.message);
      throw error; // Re-throw to return error response
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session, eventId: string): Promise<void> {
    const userId = session.metadata?.morgus_user_id;
    const planId = session.metadata?.plan_id;

    if (!userId || !planId) {
      console.error('Missing metadata in checkout session');
      return;
    }

    // Get current status for history
    const currentStatus = await this.getCurrentUserStatus(userId);

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
            current_period_end: expiresAt.toISOString(),
          }),
        }
      );

      // Record subscription history
      await this.recordSubscriptionHistory(
        userId,
        null,
        currentStatus?.status || 'free',
        'daily',
        currentStatus?.tier || 'free',
        'daily',
        'Day pass purchased via checkout',
        eventId
      );

      // Record payment
      await this.recordPayment(userId, session.amount_total || 300, 'day_pass', session.payment_intent as string);
    }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription, eventId: string): Promise<void> {
    const customerId = subscription.customer as string;
    
    // Get user ID from customer metadata or lookup
    const customer = await this.stripe.customers.retrieve(customerId);
    const userId = (customer as Stripe.Customer).metadata?.morgus_user_id;

    if (!userId) {
      console.error('No user ID found for customer:', customerId);
      return;
    }

    console.log('Processing subscription update for user:', userId, 'status:', subscription.status);

    // Get current status for history tracking
    const currentStatus = await this.getCurrentUserStatus(userId);

    // Determine plan from price
    const priceAmount = subscription.items.data[0]?.price.unit_amount || 0;
    let tier = 'weekly';
    if (priceAmount >= 7000) tier = 'monthly';
    else if (priceAmount <= 500) tier = 'daily';

    // Map Stripe status to our status values
    // profiles.subscription_status uses: free, daily, weekly, monthly, cancelled
    // subscriptions.status uses: active, cancelled, expired, past_due
    const subscriptionTableStatus = subscription.status === 'active' ? 'active' : 
      subscription.status === 'canceled' ? 'cancelled' :
      subscription.status === 'past_due' ? 'past_due' : 'expired';
    
    // For profiles table, use the tier when active, or 'cancelled' when not
    const profileStatus = subscription.status === 'active' ? tier : 'cancelled';

    // Safely convert timestamps (some may be null or undefined)
    const startDate = subscription.start_date ? new Date(subscription.start_date * 1000).toISOString() : new Date().toISOString();
    const periodStart = subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : new Date().toISOString();
    const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;

    // Update profiles table
    console.log('Updating profiles table for user:', userId, 'with profileStatus:', profileStatus, 'tier:', tier);
    const profileResponse = await fetch(
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
          subscription_status: profileStatus,
          subscription_tier: tier,
          stripe_subscription_id: subscription.id,
          subscription_started_at: startDate,
          subscription_ends_at: periodEnd,
        }),
      }
    );
    console.log('Profile update response:', profileResponse.status);

    // Upsert subscription record
    console.log('Inserting subscription record for user:', userId);
    const subscriptionResponse = await fetch(
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
          status: subscriptionTableStatus,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          started_at: startDate,
          current_period_start: periodStart,
          current_period_end: periodEnd,
        }),
      }
    );
    console.log('Subscription insert response:', subscriptionResponse.status);

    // Record subscription history
    await this.recordSubscriptionHistory(
      userId,
      null, // We don't have the subscription UUID here
      currentStatus?.status || 'free',
      profileStatus,
      currentStatus?.tier || 'free',
      tier,
      `Subscription ${subscription.status === 'active' ? 'activated' : subscription.status}`,
      eventId
    );
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription, eventId: string): Promise<void> {
    const customerId = subscription.customer as string;
    const customer = await this.stripe.customers.retrieve(customerId);
    const userId = (customer as Stripe.Customer).metadata?.morgus_user_id;

    if (!userId) {
      console.error('No user ID found for customer during subscription deletion:', customerId);
      return;
    }

    console.log('Processing subscription deletion for user:', userId);

    // Get current status for history tracking
    const currentStatus = await this.getCurrentUserStatus(userId);

    // Update profiles table - downgrade to free
    const profileResponse = await fetch(
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
          subscription_status: 'free',
          subscription_tier: 'free',
          stripe_subscription_id: null,
          subscription_ends_at: new Date().toISOString(),
        }),
      }
    );
    console.log('Profile update (cancellation) response:', profileResponse.status);

    // Update subscription record
    const subscriptionResponse = await fetch(
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
    console.log('Subscription update (cancellation) response:', subscriptionResponse.status);

    // Record subscription history
    await this.recordSubscriptionHistory(
      userId,
      null,
      currentStatus?.status || 'unknown',
      'free',
      currentStatus?.tier || 'unknown',
      'free',
      'Subscription cancelled/deleted',
      eventId
    );
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice, eventId: string): Promise<void> {
    const customerId = invoice.customer as string;
    const customer = await this.stripe.customers.retrieve(customerId);
    const userId = (customer as Stripe.Customer).metadata?.morgus_user_id;

    if (!userId) {
      console.error('No user ID found for customer during invoice payment:', customerId);
      return;
    }

    console.log('Recording invoice payment for user:', userId, 'amount:', invoice.amount_paid);

    await this.recordPayment(
      userId,
      invoice.amount_paid,
      'subscription',
      invoice.payment_intent as string,
      invoice.id
    );
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice, eventId: string): Promise<void> {
    const customerId = invoice.customer as string;
    const customer = await this.stripe.customers.retrieve(customerId);
    const userId = (customer as Stripe.Customer).metadata?.morgus_user_id;

    if (!userId) {
      console.error('No user ID found for customer during payment failure:', customerId);
      return;
    }

    console.log('Recording payment failure for user:', userId);

    // Get current status for history tracking
    const currentStatus = await this.getCurrentUserStatus(userId);

    // Update profile to reflect payment issue (optional: could downgrade immediately or after grace period)
    // For now, we'll just record the failure and let Stripe handle retries

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

    // Record in subscription history
    await this.recordSubscriptionHistory(
      userId,
      null,
      currentStatus?.status || 'unknown',
      currentStatus?.status || 'unknown', // Status doesn't change yet
      currentStatus?.tier || 'unknown',
      currentStatus?.tier || 'unknown',
      `Payment failed for invoice ${invoice.id}`,
      eventId
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
    console.error('Webhook received without signature');
    return new Response('Missing signature', { status: 400 });
  }

  const payload = await request.text();
  const stripeService = new StripeService(env);

  try {
    const event = await stripeService.verifyWebhook(payload, signature);
    await stripeService.handleWebhookEvent(event);
    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
