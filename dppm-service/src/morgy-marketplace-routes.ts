import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const router = Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// Initialize Stripe (only if key is provided)
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover'
    })
  : null;

// Middleware to verify authentication (optional for browse, required for purchase)
const optionalAuth = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // TODO: Verify JWT token and extract user ID
    (req as any).userId = req.headers['x-user-id'] || null;
  }
  next();
};

const requireAuth = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  (req as any).userId = req.headers['x-user-id'] || 'placeholder-user-id';
  next();
};

// Calculate revenue split
const calculateRevenue = (price: number) => {
  const platformFeePercentage = 0.30;
  const creatorRevenuePercentage = 0.70;
  
  const platformFee = Math.round(price * platformFeePercentage * 100) / 100;
  const creatorRevenue = Math.round(price * creatorRevenuePercentage * 100) / 100;
  
  return { platformFee, creatorRevenue };
};

/**
 * GET /api/marketplace/morgys
 * Browse marketplace with filters, search, and sorting
 */
router.get('/morgys', optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const category = req.query.category as string;
    const licenseType = req.query.licenseType as string;
    const minPrice = parseFloat(req.query.minPrice as string) || 0;
    const maxPrice = parseFloat(req.query.maxPrice as string) || 999.99;
    const sortBy = req.query.sortBy as string || 'popular';
    const search = req.query.search as string;
    const tags = req.query.tags ? (req.query.tags as string).split(',') : [];
    
    const offset = (page - 1) * limit;
    
    // Build base query - only public, active Morgys
    let query = supabase
      .from('morgys')
      .select('id, name, description, category, tags, creator_id, appearance, license_type, price, is_premium, total_purchases, rating, review_count, created_at', { count: 'exact' })
      .eq('is_public', true)
      .eq('is_active', true);
    
    // Apply filters
    if (category && ['business', 'social', 'research', 'technical', 'creative', 'custom'].includes(category)) {
      query = query.eq('category', category);
    }
    
    if (licenseType && ['free', 'paid', 'subscription'].includes(licenseType)) {
      query = query.eq('license_type', licenseType);
    }
    
    // Price range filter
    query = query.gte('price', minPrice).lte('price', maxPrice);
    
    // Search in name, description, and tags
    if (search) {
      // Use text search (requires full-text search index)
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    // Filter by tags
    if (tags.length > 0) {
      query = query.contains('tags', tags);
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'popular':
        query = query.order('total_purchases', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      case 'price_low':
        query = query.order('price', { ascending: true });
        break;
      case 'price_high':
        query = query.order('price', { ascending: false });
        break;
      default:
        // Premium first, then by purchases
        query = query.order('is_premium', { ascending: false }).order('total_purchases', { ascending: false });
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching marketplace Morgys:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch Morgys' 
      });
    }
    
    // Format response
    const morgys = data.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      category: m.category,
      tags: m.tags,
      creator: {
        id: m.creator_id,
        // TODO: Fetch creator name from users table
      },
      appearance: m.appearance,
      licenseType: m.license_type,
      price: parseFloat(m.price),
      isPremium: m.is_premium,
      stats: {
        totalPurchases: m.total_purchases,
        rating: parseFloat(m.rating),
        reviewCount: m.review_count
      },
      createdAt: m.created_at
    }));
    
    // Get filter options
    const { data: categories } = await supabase
      .from('morgys')
      .select('category')
      .eq('is_public', true)
      .eq('is_active', true);
    
    const uniqueCategories = [...new Set(categories?.map(c => c.category) || [])];
    
    const { data: priceRange } = await supabase
      .from('morgys')
      .select('price')
      .eq('is_public', true)
      .eq('is_active', true)
      .order('price', { ascending: true });
    
    const minAvailablePrice = priceRange && priceRange.length > 0 ? parseFloat(priceRange[0].price) : 0;
    const maxAvailablePrice = priceRange && priceRange.length > 0 ? parseFloat(priceRange[priceRange.length - 1].price) : 999.99;
    
    res.json({
      success: true,
      morgys,
      filters: {
        categories: uniqueCategories,
        priceRange: {
          min: minAvailablePrice,
          max: maxAvailablePrice
        }
      },
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in GET /api/marketplace/morgys:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/marketplace/morgys/:morgyId/purchase
 * Purchase a Morgy (one-time payment)
 */
router.post('/morgys/:morgyId/purchase', requireAuth, async (req: Request, res: Response) => {
  try {
    const { morgyId } = req.params;
    const { paymentMethodId } = req.body;
    const buyerId = (req as any).userId;
    
    if (!paymentMethodId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment method ID is required' 
      });
    }
    
    // Fetch Morgy
    const { data: morgy, error: morgyError } = await supabase
      .from('morgys')
      .select('*')
      .eq('id', morgyId)
      .eq('is_public', true)
      .eq('is_active', true)
      .single();
    
    if (morgyError || !morgy) {
      return res.status(404).json({ 
        success: false, 
        error: 'Morgy not found or not available for purchase' 
      });
    }
    
    if (morgy.license_type !== 'paid') {
      return res.status(400).json({ 
        success: false, 
        error: 'This Morgy is not available for one-time purchase' 
      });
    }
    
    // Check if user already owns this Morgy
    const { data: existingPurchase } = await supabase
      .from('morgy_purchases')
      .select('id')
      .eq('morgy_id', morgyId)
      .eq('buyer_id', buyerId)
      .eq('payment_status', 'completed')
      .single();
    
    if (existingPurchase) {
      return res.status(400).json({ 
        success: false, 
        error: 'You already own this Morgy' 
      });
    }
    
    // Calculate revenue split
    const price = parseFloat(morgy.price);
    const { platformFee, creatorRevenue } = calculateRevenue(price);  try {
    if (!stripe) {
      return res.status(500).json({ 
        success: false, 
        error: 'Payment processing not configured' 
      });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({     amount: Math.round(price * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      metadata: {
        morgyId,
        morgyName: morgy.name,
        buyerId,
        creatorId: morgy.creator_id,
        platformFee: platformFee.toString(),
        creatorRevenue: creatorRevenue.toString()
      },
      description: `Purchase of Morgy: ${morgy.name}`
    });
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment failed',
        details: paymentIntent.status
      });
    }
    
    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('morgy_purchases')
      .insert([{
        morgy_id: morgyId,
        buyer_id: buyerId,
        creator_id: morgy.creator_id,
        purchase_type: 'one_time',
        price,
        platform_fee: platformFee,
        creator_revenue: creatorRevenue,
        stripe_payment_id: paymentIntent.id,
        payment_status: 'completed'
      }])
      .select()
      .single();
    
    if (purchaseError) {
      console.error('Error creating purchase record:', purchaseError);
      // Payment succeeded but record failed - log for manual reconciliation
      return res.status(500).json({ 
        success: false, 
        error: 'Purchase completed but failed to record. Please contact support.' 
      });
    }
    
    // Update Morgy stats
    await supabase
      .from('morgys')
      .update({
        total_purchases: morgy.total_purchases + 1,
        total_revenue: parseFloat(morgy.total_revenue) + creatorRevenue
      })
      .eq('id', morgyId);
    
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
      });
    
    // TODO: Send confirmation email to buyer
    // TODO: Send notification to creator
    
    res.json({
      success: true,
      purchase: {
        id: purchase.id,
        morgyId: purchase.morgy_id,
        purchaseType: purchase.purchase_type,
        price: parseFloat(purchase.price),
        platformFee: parseFloat(purchase.platform_fee),
        creatorRevenue: parseFloat(purchase.creator_revenue),
        paymentStatus: purchase.payment_status,
        createdAt: purchase.created_at
      },
      morgy: {
        id: morgy.id,
        name: morgy.name,
        description: morgy.description,
        appearance: morgy.appearance
      }
    });
  } catch (error: any) {
    console.error('Error in POST /api/marketplace/morgys/:morgyId/purchase:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

/**
 * POST /api/marketplace/morgys/:morgyId/subscribe
 * Subscribe to a Morgy (monthly subscription)
 */
router.post('/morgys/:morgyId/subscribe', requireAuth, async (req: Request, res: Response) => {
  try {
    const { morgyId } = req.params;
    const { paymentMethodId } = req.body;
    const buyerId = (req as any).userId;
    
    if (!paymentMethodId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment method ID is required' 
      });
    }
    
    // Fetch Morgy
    const { data: morgy, error: morgyError } = await supabase
      .from('morgys')
      .select('*')
      .eq('id', morgyId)
      .eq('is_public', true)
      .eq('is_active', true)
      .single();
    
    if (morgyError || !morgy) {
      return res.status(404).json({ 
        success: false, 
        error: 'Morgy not found or not available for subscription' 
      });
    }
    
    if (morgy.license_type !== 'subscription') {
      return res.status(400).json({ 
        success: false, 
        error: 'This Morgy is not available for subscription' 
      });
    }
    
    // Check if user already has active subscription
    const { data: existingSubscription } = await supabase
      .from('morgy_purchases')
      .select('id, subscription_status')
      .eq('morgy_id', morgyId)
      .eq('buyer_id', buyerId)
      .eq('purchase_type', 'subscription')
      .eq('subscription_status', 'active')
      .single();
    
    if (existingSubscription) {
      return res.status(400).json({ 
        success: false, 
        error: 'You already have an active subscription to this Morgy' 
      });
    }
    
    // Calculate revenue split
    const price = parseFloat(morgy.price);
    const { platformFee, creatorRevenue } = calculateRevenue(price);
    
    // TODO: Get or create Stripe customer
    const stripeCustomerId = 'cus_placeholder'; // Replace with actual customer I  try {
    if (!stripe) {
      return res.status(500).json({ 
        success: false, 
        error: 'Payment processing not configured' 
      });
    }

    // Create Stripe subscription
    const subscription = await stripe.subscriptions.create({      customer: stripeCustomerId,
      items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Morgy Subscription: ${morgy.name}`,
            description: morgy.description
          },
          recurring: {
            interval: 'month'
          },
          unit_amount: Math.round(price * 100)
        }
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        morgyId,
        morgyName: morgy.name,
        buyerId,
        creatorId: morgy.creator_id,
        platformFeePercentage: '0.30',
        creatorRevenuePercentage: '0.70'
      }
    });
    
    // Calculate subscription dates
    const subscriptionStart = new Date();
    const subscriptionEnd = new Date();
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
    
    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('morgy_purchases')
      .insert([{
        morgy_id: morgyId,
        buyer_id: buyerId,
        creator_id: morgy.creator_id,
        purchase_type: 'subscription',
        price,
        platform_fee: platformFee,
        creator_revenue: creatorRevenue,
        stripe_subscription_id: subscription.id,
        payment_status: 'completed',
        subscription_status: 'active',
        subscription_start: subscriptionStart.toISOString(),
        subscription_end: subscriptionEnd.toISOString()
      }])
      .select()
      .single();
    
    if (purchaseError) {
      console.error('Error creating subscription record:', purchaseError);
      // Cancel Stripe subscription if record creation failed
      if (stripe) {
        await stripe.subscriptions.cancel(subscription.id);
      }
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create subscription' 
      });
    }
    
    // Update Morgy stats
    await supabase
      .from('morgys')
      .update({
        total_purchases: morgy.total_purchases + 1,
        total_revenue: parseFloat(morgy.total_revenue) + creatorRevenue
      })
      .eq('id', morgyId);
    
    // TODO: Send confirmation email
    
    res.json({
      success: true,
      subscription: {
        id: purchase.id,
        morgyId: purchase.morgy_id,
        purchaseType: purchase.purchase_type,
        price: parseFloat(purchase.price),
        subscriptionStatus: purchase.subscription_status,
        subscriptionStart: purchase.subscription_start,
        subscriptionEnd: purchase.subscription_end,
        stripeSubscriptionId: purchase.stripe_subscription_id
      }
    });
  } catch (error: any) {
    console.error('Error in POST /api/marketplace/morgys/:morgyId/subscribe:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

/**
 * POST /api/marketplace/morgys/:morgyId/cancel-subscription
 * Cancel subscription to a Morgy
 */
router.post('/morgys/:morgyId/cancel-subscription', requireAuth, async (req: Request, res: Response) => {
  try {
    const { morgyId } = req.params;
    const buyerId = (req as any).userId;
    
    // Find active subscription
    const { data: purchase, error: fetchError } = await supabase
      .from('morgy_purchases')
      .select('*')
      .eq('morgy_id', morgyId)
      .eq('buyer_id', buyerId)
      .eq('purchase_type', 'subscription')
      .eq('subscription_status', 'active')
      .single();
    
    if (fetchError || !purchase) {
      return res.status(404).json({ 
        success: false, 
        error: 'No active subscription found' 
      });
    }
    
    // Cancel Stripe subscription
    if (stripe && purchase.stripe_subscription_id) {
      await stripe.subscriptions.cancel(purchase.stripe_subscription_id);
    }
    
    // Update purchase record
    await supabase
      .from('morgy_purchases')
      .update({
        subscription_status: 'cancelled'
      })
      .eq('id', purchase.id);
    
    // TODO: Send cancellation confirmation email
    
    res.json({
      success: true,
      message: `Subscription cancelled. You will have access until ${purchase.subscription_end}`
    });
  } catch (error: any) {
    console.error('Error in POST /api/marketplace/morgys/:morgyId/cancel-subscription:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

export default router;
