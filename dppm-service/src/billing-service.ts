// @ts-nocheck
/**
 * Billing Service
 * Manages Stripe subscriptions, payments, and billing
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { PRICING_TIERS } from './usage-tracking-service';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'mock-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Stripe Price IDs (create these in Stripe Dashboard)
const STRIPE_PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
  business_monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || 'price_business_monthly',
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
  business_yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY || 'price_business_yearly'
};

export class BillingService {
  /**
   * Create Stripe checkout session for subscription
   */
  async createCheckoutSession(userId: string, tier: string, interval: 'monthly' | 'yearly' = 'monthly') {
    if (!stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, stripe_customer_id')
        .eq('id', userId)
        .single();

      if (!profile) {
        throw new Error('User not found');
      }

      // Get or create Stripe customer
      let customerId = profile.stripe_customer_id;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: profile.email,
          metadata: { user_id: userId }
        });
        customerId = customer.id;

        // Save customer ID
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId);
      }

      // Get price ID
      const priceKey = `${tier}_${interval}`;
      const priceId = STRIPE_PRICE_IDS[priceKey];

      if (!priceId) {
        throw new Error(`Invalid tier: ${tier}`);
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/billing/cancel`,
        metadata: {
          user_id: userId,
          tier
        }
      });

      return {
        sessionId: session.id,
        url: session.url
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Create Stripe portal session for managing subscription
   */
  async createPortalSession(userId: string) {
    if (!stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      // Get user's Stripe customer ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (!profile?.stripe_customer_id) {
        throw new Error('No active subscription');
      }

      // Create portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${process.env.FRONTEND_URL}/billing`
      });

      return {
        url: session.url
      };
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event) {
    if (!stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  /**
   * Handle checkout completed
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.user_id;
    const tier = session.metadata?.tier;

    if (!userId || !tier) {
      console.error('Missing metadata in checkout session');
      return;
    }

    // Update user's subscription tier
    await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        stripe_subscription_id: session.subscription as string,
        subscription_status: 'active'
      })
      .eq('id', userId);

    console.log(`Subscription activated for user ${userId}: ${tier}`);
  }

  /**
   * Handle subscription updated
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    // Get user by customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!profile) {
      console.error(`User not found for customer ${customerId}`);
      return;
    }

    // Determine tier from price ID
    const priceId = subscription.items.data[0]?.price.id;
    let tier = 'free';
    for (const [key, value] of Object.entries(STRIPE_PRICE_IDS)) {
      if (value === priceId) {
        tier = key.split('_')[0]; // Extract 'pro' or 'business'
        break;
      }
    }

    // Update subscription
    await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status
      })
      .eq('id', profile.id);

    console.log(`Subscription updated for user ${profile.id}: ${tier} (${subscription.status})`);
  }

  /**
   * Handle subscription deleted
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    // Get user by customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!profile) {
      console.error(`User not found for customer ${customerId}`);
      return;
    }

    // Downgrade to free tier
    await supabase
      .from('profiles')
      .update({
        subscription_tier: 'free',
        subscription_status: 'canceled'
      })
      .eq('id', profile.id);

    console.log(`Subscription canceled for user ${profile.id}`);
  }

  /**
   * Handle payment succeeded
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    console.log(`Payment succeeded: ${invoice.id}`);
    // Could send receipt email, update analytics, etc.
  }

  /**
   * Handle payment failed
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    // Get user by customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('stripe_customer_id', customerId)
      .single();

    if (profile) {
      console.log(`Payment failed for user ${profile.id} (${profile.email})`);
      // Could send payment failed email, suspend account, etc.
    }
  }

  /**
   * Get user's billing info
   */
  async getBillingInfo(userId: string) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_status, stripe_customer_id, stripe_subscription_id')
        .eq('id', userId)
        .single();

      if (!profile) {
        return null;
      }

      const tier = profile.subscription_tier || 'free';
      const limits = PRICING_TIERS[tier];

      let subscription = null;
      if (stripe && profile.stripe_subscription_id) {
        try {
          subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
        } catch (error) {
          console.error('Error retrieving subscription:', error);
        }
      }

      return {
        tier,
        status: profile.subscription_status || 'active',
        limits,
        subscription: subscription ? {
          id: subscription.id,
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end
        } : null
      };
    } catch (error) {
      console.error('Error getting billing info:', error);
      return null;
    }
  }
}

export const billingService = new BillingService();
