/**
 * Morgy Marketplace Webhook Service
 * Handles Stripe webhook events for Morgy purchases and subscriptions
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export class MorgyWebhookService {
  /**
   * Handle Stripe webhook events for Morgy marketplace
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<{ success: boolean; message?: string }> {
    try {
      switch (event.type) {
        // One-time payment succeeded
        case 'payment_intent.succeeded':
          return await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        
        // One-time payment failed
        case 'payment_intent.payment_failed':
          return await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        
        // Subscription created
        case 'customer.subscription.created':
          return await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        
        // Subscription updated (renewal, plan change)
        case 'customer.subscription.updated':
          return await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        
        // Subscription deleted (cancelled)
        case 'customer.subscription.deleted':
          return await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        
        // Invoice payment succeeded (subscription renewal)
        case 'invoice.payment_succeeded':
          return await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        
        // Invoice payment failed
        case 'invoice.payment_failed':
          return await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        
        default:
          console.log(`Unhandled Morgy webhook event type: ${event.type}`);
          return { success: true, message: 'Event type not handled' };
      }
    } catch (error: any) {
      console.error('Error handling Morgy webhook:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Handle successful one-time payment
   */
  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<{ success: boolean }> {
    const { morgyId, userId, purchaseId } = paymentIntent.metadata;
    
    if (!morgyId || !userId || !purchaseId) {
      console.log('Payment intent missing Morgy metadata, skipping');
      return { success: true };
    }

    console.log(`Payment succeeded for Morgy ${morgyId} by user ${userId}`);

    // Update purchase status
    const { error: updateError } = await supabase
      .from('morgy_purchases')
      .update({
        payment_status: 'completed',
        stripe_payment_id: paymentIntent.id
      })
      .eq('id', purchaseId);

    if (updateError) {
      console.error('Error updating purchase status:', updateError);
      throw updateError;
    }

    // Update Morgy stats (increment purchases and revenue)
    const amount = paymentIntent.amount / 100; // Convert cents to dollars
    const creatorRevenue = Math.round(amount * 0.70 * 100) / 100;

    const { error: statsError } = await supabase.rpc('increment_morgy_stats', {
      p_morgy_id: morgyId,
      p_purchases: 1,
      p_revenue: creatorRevenue
    });

    if (statsError) {
      console.error('Error updating Morgy stats:', statsError);
      // Don't throw - purchase is complete even if stats fail
    }

    // Track analytics
    const today = new Date().toISOString().split('T')[0];
    await supabase
      .from('morgy_analytics')
      .upsert({
        morgy_id: morgyId,
        date: today,
        purchases: 1,
        revenue: creatorRevenue
      }, {
        onConflict: 'morgy_id,date',
        ignoreDuplicates: false
      })
      .then(() => {})
      .catch((err: any) => console.error('Error tracking analytics:', err));

    return { success: true };
  }

  /**
   * Handle failed one-time payment
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<{ success: boolean }> {
    const { purchaseId } = paymentIntent.metadata;
    
    if (!purchaseId) {
      return { success: true };
    }

    console.log(`Payment failed for purchase ${purchaseId}`);

    // Update purchase status
    const { error } = await supabase
      .from('morgy_purchases')
      .update({
        payment_status: 'failed'
      })
      .eq('id', purchaseId);

    if (error) {
      console.error('Error updating failed purchase:', error);
      throw error;
    }

    return { success: true };
  }

  /**
   * Handle subscription created
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<{ success: boolean }> {
    const { morgyId, userId, purchaseId } = subscription.metadata;
    
    if (!morgyId || !userId || !purchaseId) {
      console.log('Subscription missing Morgy metadata, skipping');
      return { success: true };
    }

    console.log(`Subscription created for Morgy ${morgyId} by user ${userId}`);

    // Update purchase record
    const { error } = await supabase
      .from('morgy_purchases')
      .update({
        subscription_status: 'active',
        subscription_start: new Date(subscription.current_period_start * 1000).toISOString(),
        subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
        stripe_subscription_id: subscription.id
      })
      .eq('id', purchaseId);

    if (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }

    return { success: true };
  }

  /**
   * Handle subscription updated (renewal, plan change)
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<{ success: boolean }> {
    const { purchaseId } = subscription.metadata;
    
    if (!purchaseId) {
      // Try to find by Stripe subscription ID
      const { data: purchase } = await supabase
        .from('morgy_purchases')
        .select('id, morgy_id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (!purchase) {
        console.log('Subscription not found in database, skipping');
        return { success: true };
      }
    }

    console.log(`Subscription updated: ${subscription.id}`);

    // Update subscription dates and status
    const updateData: any = {
      subscription_start: new Date(subscription.current_period_start * 1000).toISOString(),
      subscription_end: new Date(subscription.current_period_end * 1000).toISOString()
    };

    if (subscription.status === 'active') {
      updateData.subscription_status = 'active';
    } else if (subscription.status === 'canceled') {
      updateData.subscription_status = 'cancelled';
    }

    const query = purchaseId
      ? supabase.from('morgy_purchases').update(updateData).eq('id', purchaseId)
      : supabase.from('morgy_purchases').update(updateData).eq('stripe_subscription_id', subscription.id);

    const { error } = await query;

    if (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }

    return { success: true };
  }

  /**
   * Handle subscription deleted (cancelled)
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<{ success: boolean }> {
    console.log(`Subscription deleted: ${subscription.id}`);

    // Update subscription status
    const { error } = await supabase
      .from('morgy_purchases')
      .update({
        subscription_status: 'expired'
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating deleted subscription:', error);
      throw error;
    }

    return { success: true };
  }

  /**
   * Handle successful invoice payment (subscription renewal)
   */
  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<{ success: boolean }> {
    if (!invoice.subscription) {
      return { success: true };
    }

    console.log(`Invoice payment succeeded for subscription: ${invoice.subscription}`);

    // Get purchase record
    const { data: purchase } = await supabase
      .from('morgy_purchases')
      .select('id, morgy_id, price')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();

    if (!purchase) {
      console.log('Purchase not found for subscription, skipping');
      return { success: true };
    }

    // Calculate revenue
    const amount = invoice.amount_paid / 100; // Convert cents to dollars
    const creatorRevenue = Math.round(amount * 0.70 * 100) / 100;

    // Update Morgy revenue stats
    const { error: statsError } = await supabase.rpc('increment_morgy_stats', {
      p_morgy_id: purchase.morgy_id,
      p_purchases: 0, // Don't increment purchase count for renewals
      p_revenue: creatorRevenue
    });

    if (statsError) {
      console.error('Error updating Morgy stats:', statsError);
    }

    // Track analytics
    const today = new Date().toISOString().split('T')[0];
    await supabase
      .from('morgy_analytics')
      .upsert({
        morgy_id: purchase.morgy_id,
        date: today,
        revenue: creatorRevenue
      }, {
        onConflict: 'morgy_id,date',
        ignoreDuplicates: false
      })
      .then(() => {})
      .catch((err: any) => console.error('Error tracking analytics:', err));

    return { success: true };
  }

  /**
   * Handle failed invoice payment
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<{ success: boolean }> {
    if (!invoice.subscription) {
      return { success: true };
    }

    console.log(`Invoice payment failed for subscription: ${invoice.subscription}`);

    // Optionally update subscription status or send notification
    // For now, just log it - Stripe will handle retries

    return { success: true };
  }
}

// Export singleton instance
export const morgyWebhookService = new MorgyWebhookService();
