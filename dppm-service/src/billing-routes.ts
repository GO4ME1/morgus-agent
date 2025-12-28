// @ts-nocheck
/**
 * Billing API Routes
 * Handles subscription management, checkout, and webhooks
 */

import { Router } from 'express';
import { billingService } from './billing-service';
import { morgyWebhookService } from './morgy-webhook-service';
import { usageTracker } from './usage-tracking-service';
import { authMiddleware } from './auth-middleware';
import Stripe from 'stripe';

const router = Router();

/**
 * GET /api/billing/info
 * Get user's billing information
 */
router.get('/info', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const billingInfo = await billingService.getBillingInfo(userId);
    const usageStats = await usageTracker.getUsageStats(userId);

    res.json({
      billing: billingInfo,
      usage: usageStats
    });
  } catch (error) {
    console.error('Error getting billing info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/billing/checkout
 * Create Stripe checkout session
 */
router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tier, interval } = req.body;
    if (!tier || !['pro', 'business'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    if (interval && !['monthly', 'yearly'].includes(interval)) {
      return res.status(400).json({ error: 'Invalid interval' });
    }

    const session = await billingService.createCheckoutSession(
      userId,
      tier,
      interval || 'monthly'
    );

    res.json(session);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/billing/portal
 * Create Stripe customer portal session
 */
router.post('/portal', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = await billingService.createPortalSession(userId);
    res.json(session);
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/billing/webhook
 * Handle Stripe webhooks
 */
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    });

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );

    // Handle event for both billing and Morgy marketplace
    await billingService.handleWebhook(event);
    await morgyWebhookService.handleWebhookEvent(event);

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/billing/usage
 * Get detailed usage statistics
 */
router.get('/usage', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { month } = req.query;
    const stats = await usageTracker.getUsageStats(userId, month as string);

    res.json(stats);
  } catch (error) {
    console.error('Error getting usage stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/billing/pricing
 * Get pricing tiers and features
 */
router.get('/pricing', async (req, res) => {
  try {
    const { PRICING_TIERS } = await import('./usage-tracking-service');
    res.json(PRICING_TIERS);
  } catch (error) {
    console.error('Error getting pricing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
