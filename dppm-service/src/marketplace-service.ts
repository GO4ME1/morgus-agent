/**
 * Marketplace Service
 * 
 * Handles listing, purchasing, and licensing of Morgys on the marketplace.
 * Implements creator economy with 70-85% revenue share.
 */

import { supabase } from './supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export interface MarketplaceListing {
  id: string;
  morgyId: string;
  creatorId: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  pricingModel: 'free' | 'one-time' | 'monthly' | 'annual';
  price?: number;
  visibility: 'public' | 'unlisted' | 'private';
  license: {
    personalUse: boolean;
    commercialUse: boolean;
    resale: boolean;
    modification: boolean;
  };
  stats: {
    views: number;
    purchases: number;
    rating: number;
    reviews: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Purchase {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  revenueShare: number;
  paymentIntentId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
}

/**
 * Create a marketplace listing
 */
export async function createMarketplaceListing(
  morgyId: string,
  userId: string,
  listing: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    pricingModel: 'free' | 'one-time' | 'monthly' | 'annual';
    price?: number;
    visibility: 'public' | 'unlisted' | 'private';
    license: {
      personalUse: boolean;
      commercialUse: boolean;
      resale: boolean;
      modification: boolean;
    };
  }
): Promise<MarketplaceListing> {
  // Verify user owns the Morgy
  const { data: morgy, error: morgyError } = await supabase
    .from('morgys')
    .select('*')
    .eq('id', morgyId)
    .eq('user_id', userId)
    .single();

  if (morgyError || !morgy) {
    throw new Error('Morgy not found or you do not have permission');
  }

  // Create listing
  const { data: listingData, error: listingError } = await supabase
    .from('marketplace_listings')
    .insert({
      morgy_id: morgyId,
      creator_id: userId,
      title: listing.title,
      description: listing.description,
      category: listing.category,
      tags: listing.tags,
      pricing_model: listing.pricingModel,
      price: listing.price,
      visibility: listing.visibility,
      license: listing.license,
      stats: {
        views: 0,
        purchases: 0,
        rating: 0,
        reviews: 0,
      },
    })
    .select()
    .single();

  if (listingError || !listingData) {
    throw new Error('Failed to create listing');
  }

  return {
    id: listingData.id,
    morgyId: listingData.morgy_id,
    creatorId: listingData.creator_id,
    title: listingData.title,
    description: listingData.description,
    category: listingData.category,
    tags: listingData.tags,
    pricingModel: listingData.pricing_model,
    price: listingData.price,
    visibility: listingData.visibility,
    license: listingData.license,
    stats: listingData.stats,
    createdAt: new Date(listingData.created_at),
    updatedAt: new Date(listingData.updated_at),
  };
}

/**
 * Browse marketplace listings
 */
export async function browseMarketplace(filters: {
  category?: string;
  tags?: string[];
  pricingModel?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'popular' | 'recent' | 'rating' | 'price';
  limit?: number;
  offset?: number;
}): Promise<MarketplaceListing[]> {
  let query = supabase
    .from('marketplace_listings')
    .select('*')
    .eq('visibility', 'public');

  // Apply filters
  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }

  if (filters.pricingModel) {
    query = query.eq('pricing_model', filters.pricingModel);
  }

  if (filters.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  // Apply sorting
  switch (filters.sortBy) {
    case 'popular':
      query = query.order('stats->purchases', { ascending: false });
      break;
    case 'rating':
      query = query.order('stats->rating', { ascending: false });
      break;
    case 'price':
      query = query.order('price', { ascending: true });
      break;
    case 'recent':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  // Apply pagination
  query = query.range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20) - 1);

  const { data, error } = await query;

  if (error) {
    throw new Error('Failed to fetch listings');
  }

  return (data || []).map(listing => ({
    id: listing.id,
    morgyId: listing.morgy_id,
    creatorId: listing.creator_id,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    tags: listing.tags,
    pricingModel: listing.pricing_model,
    price: listing.price,
    visibility: listing.visibility,
    license: listing.license,
    stats: listing.stats,
    createdAt: new Date(listing.created_at),
    updatedAt: new Date(listing.updated_at),
  }));
}

/**
 * Purchase a Morgy from the marketplace
 */
export async function purchaseMorgy(
  listingId: string,
  buyerId: string
): Promise<{
  purchase: Purchase;
  morgyId: string;
  paymentIntent?: Stripe.PaymentIntent;
}> {
  // Fetch listing
  const { data: listing, error: listingError } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('id', listingId)
    .single();

  if (listingError || !listing) {
    throw new Error('Listing not found');
  }

  // Check if already purchased
  const { data: existingPurchase } = await supabase
    .from('marketplace_purchases')
    .select('*')
    .eq('listing_id', listingId)
    .eq('buyer_id', buyerId)
    .single();

  if (existingPurchase) {
    throw new Error('You have already purchased this Morgy');
  }

  // Calculate revenue share (70% for creator)
  const revenueShare = 0.70;
  const creatorAmount = listing.price ? listing.price * revenueShare : 0;

  // Handle free listings
  if (listing.pricing_model === 'free' || !listing.price) {
    // Clone the Morgy for the buyer
    const clonedMorgyId = await cloneMorgyForBuyer(listing.morgy_id, buyerId);

    // Record the "purchase"
    const { data: purchaseData } = await supabase
      .from('marketplace_purchases')
      .insert({
        listing_id: listingId,
        buyer_id: buyerId,
        seller_id: listing.creator_id,
        amount: 0,
        revenue_share: 0,
        status: 'completed',
      })
      .select()
      .single();

    // Update listing stats
    await supabase
      .from('marketplace_listings')
      .update({
        stats: {
          ...listing.stats,
          purchases: (listing.stats.purchases || 0) + 1,
        },
      })
      .eq('id', listingId);

    return {
      purchase: {
        id: purchaseData.id,
        listingId: purchaseData.listing_id,
        buyerId: purchaseData.buyer_id,
        sellerId: purchaseData.seller_id,
        amount: 0,
        revenueShare: 0,
        paymentIntentId: '',
        status: 'completed',
        createdAt: new Date(purchaseData.created_at),
      },
      morgyId: clonedMorgyId,
    };
  }

  // Create Stripe payment intent for paid listings
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(listing.price * 100), // Convert to cents
    currency: 'usd',
    metadata: {
      listingId,
      buyerId,
      sellerId: listing.creator_id,
      morgyId: listing.morgy_id,
    },
    transfer_data: {
      amount: Math.round(creatorAmount * 100),
      destination: listing.creator_stripe_account_id, // Creator's Stripe Connect account
    },
  });

  // Create purchase record
  const { data: purchaseData } = await supabase
    .from('marketplace_purchases')
    .insert({
      listing_id: listingId,
      buyer_id: buyerId,
      seller_id: listing.creator_id,
      amount: listing.price,
      revenue_share: creatorAmount,
      payment_intent_id: paymentIntent.id,
      status: 'pending',
    })
    .select()
    .single();

  return {
    purchase: {
      id: purchaseData.id,
      listingId: purchaseData.listing_id,
      buyerId: purchaseData.buyer_id,
      sellerId: purchaseData.seller_id,
      amount: purchaseData.amount,
      revenueShare: purchaseData.revenue_share,
      paymentIntentId: purchaseData.payment_intent_id,
      status: purchaseData.status,
      createdAt: new Date(purchaseData.created_at),
    },
    morgyId: listing.morgy_id,
    paymentIntent,
  };
}

/**
 * Complete a purchase after payment confirmation
 */
export async function completePurchase(
  purchaseId: string,
  paymentIntentId: string
): Promise<{ morgyId: string }> {
  // Verify payment intent
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    throw new Error('Payment not completed');
  }

  // Fetch purchase
  const { data: purchase, error: purchaseError } = await supabase
    .from('marketplace_purchases')
    .select('*')
    .eq('id', purchaseId)
    .eq('payment_intent_id', paymentIntentId)
    .single();

  if (purchaseError || !purchase) {
    throw new Error('Purchase not found');
  }

  // Fetch listing
  const { data: listing } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('id', purchase.listing_id)
    .single();

  if (!listing) {
    throw new Error('Listing not found');
  }

  // Clone the Morgy for the buyer
  const clonedMorgyId = await cloneMorgyForBuyer(listing.morgy_id, purchase.buyer_id);

  // Update purchase status
  await supabase
    .from('marketplace_purchases')
    .update({ status: 'completed' })
    .eq('id', purchaseId);

  // Update listing stats
  await supabase
    .from('marketplace_listings')
    .update({
      stats: {
        ...listing.stats,
        purchases: (listing.stats.purchases || 0) + 1,
      },
    })
    .eq('id', listing.id);

  return { morgyId: clonedMorgyId };
}

/**
 * Clone a Morgy for a buyer
 */
async function cloneMorgyForBuyer(sourceMorgyId: string, buyerId: string): Promise<string> {
  // Fetch source Morgy
  const { data: sourceMorgy } = await supabase
    .from('morgys')
    .select('*')
    .eq('id', sourceMorgyId)
    .single();

  if (!sourceMorgy) {
    throw new Error('Source Morgy not found');
  }

  // Create cloned Morgy
  const { data: clonedMorgy } = await supabase
    .from('morgys')
    .insert({
      user_id: buyerId,
      name: sourceMorgy.name,
      description: sourceMorgy.description,
      category: sourceMorgy.category,
      system_prompt: sourceMorgy.system_prompt,
      personality: sourceMorgy.personality,
      avatar_url: sourceMorgy.avatar_url,
      is_marketplace_clone: true,
      source_morgy_id: sourceMorgyId,
    })
    .select()
    .single();

  if (!clonedMorgy) {
    throw new Error('Failed to clone Morgy');
  }

  // Clone knowledge
  const { data: knowledge } = await supabase
    .from('morgy_knowledge')
    .select('*')
    .eq('morgy_id', sourceMorgyId);

  if (knowledge && knowledge.length > 0) {
    await supabase.from('morgy_knowledge').insert(
      knowledge.map(k => ({
        morgy_id: clonedMorgy.id,
        title: k.title,
        content: k.content,
        embeddings: k.embeddings,
        source_type: k.source_type,
        source_url: k.source_url,
      }))
    );
  }

  // Clone enabled templates
  const { data: templates } = await supabase
    .from('morgy_templates')
    .select('*')
    .eq('morgy_id', sourceMorgyId)
    .eq('enabled', true);

  if (templates && templates.length > 0) {
    await supabase.from('morgy_templates').insert(
      templates.map(t => ({
        morgy_id: clonedMorgy.id,
        template_id: t.template_id,
        enabled: true,
        config: t.config,
      }))
    );
  }

  // Clone enabled workflows
  const { data: workflows } = await supabase
    .from('morgy_workflows')
    .select('*')
    .eq('morgy_id', sourceMorgyId)
    .eq('enabled', true);

  if (workflows && workflows.length > 0) {
    await supabase.from('morgy_workflows').insert(
      workflows.map(w => ({
        morgy_id: clonedMorgy.id,
        workflow_id: w.workflow_id,
        enabled: true,
        config: w.config,
      }))
    );
  }

  return clonedMorgy.id;
}

/**
 * Get creator analytics
 */
export async function getCreatorAnalytics(creatorId: string): Promise<{
  totalListings: number;
  totalSales: number;
  totalRevenue: number;
  averageRating: number;
  topMorgys: Array<{
    id: string;
    title: string;
    sales: number;
    revenue: number;
    rating: number;
  }>;
}> {
  // Fetch listings
  const { data: listings } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('creator_id', creatorId);

  // Fetch purchases
  const { data: purchases } = await supabase
    .from('marketplace_purchases')
    .select('*')
    .eq('seller_id', creatorId)
    .eq('status', 'completed');

  const totalListings = listings?.length || 0;
  const totalSales = purchases?.length || 0;
  const totalRevenue = purchases?.reduce((sum, p) => sum + p.revenue_share, 0) || 0;
  const averageRating =
    listings?.reduce((sum, l) => sum + (l.stats.rating || 0), 0) / totalListings || 0;

  // Calculate top Morgys
  const morgyStats = new Map<string, { sales: number; revenue: number }>();
  purchases?.forEach(p => {
    const stats = morgyStats.get(p.listing_id) || { sales: 0, revenue: 0 };
    stats.sales += 1;
    stats.revenue += p.revenue_share;
    morgyStats.set(p.listing_id, stats);
  });

  const topMorgys = listings
    ?.map(l => ({
      id: l.id,
      title: l.title,
      sales: morgyStats.get(l.id)?.sales || 0,
      revenue: morgyStats.get(l.id)?.revenue || 0,
      rating: l.stats.rating || 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5) || [];

  return {
    totalListings,
    totalSales,
    totalRevenue,
    averageRating,
    topMorgys,
  };
}
