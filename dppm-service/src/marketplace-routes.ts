/**
 * Marketplace API Routes
 * 
 * Handles marketplace listing, browsing, and purchasing
 */

import { Router } from 'express';
import {
  createMarketplaceListing,
  browseMarketplace,
  purchaseMorgy,
  completePurchase,
  getCreatorAnalytics,
} from './marketplace-service';
import { supabase } from './supabase';

const router = Router();

/**
 * POST /api/marketplace/create
 * Create a new marketplace listing
 */
router.post('/create', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { morgyId, listing } = req.body;

    const result = await createMarketplaceListing(morgyId, userId, listing);

    res.json(result);
  } catch (error) {
    console.error('Failed to create listing:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/marketplace/browse
 * Browse marketplace listings with filters
 */
router.get('/browse', async (req, res) => {
  try {
    const filters = {
      category: req.query.category as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      pricingModel: req.query.pricingModel as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as any) || 'popular',
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const listings = await browseMarketplace(filters);

    res.json(listings);
  } catch (error) {
    console.error('Failed to browse marketplace:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/marketplace/listing/:id
 * Get a single listing by ID
 */
router.get('/listing/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: listing, error } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(listing);
  } catch (error) {
    console.error('Failed to get listing:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/marketplace/purchase
 * Purchase a Morgy from the marketplace
 */
router.post('/purchase', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { listingId } = req.body;

    const result = await purchaseMorgy(listingId, userId);

    res.json(result);
  } catch (error) {
    console.error('Failed to purchase Morgy:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/marketplace/complete-purchase
 * Complete a purchase after payment confirmation
 */
router.post('/complete-purchase', async (req, res) => {
  try {
    const { purchaseId, paymentIntentId } = req.body;

    const result = await completePurchase(purchaseId, paymentIntentId);

    res.json(result);
  } catch (error) {
    console.error('Failed to complete purchase:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/marketplace/my-listings
 * Get current user's marketplace listings
 */
router.get('/my-listings', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: listings, error } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(listings || []);
  } catch (error) {
    console.error('Failed to get my listings:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/marketplace/my-purchases
 * Get current user's purchases
 */
router.get('/my-purchases', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: purchases, error } = await supabase
      .from('marketplace_purchases')
      .select('*, marketplace_listings(*)')
      .eq('buyer_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(purchases || []);
  } catch (error) {
    console.error('Failed to get my purchases:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/marketplace/analytics
 * Get creator analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const analytics = await getCreatorAnalytics(userId);

    res.json(analytics);
  } catch (error) {
    console.error('Failed to get analytics:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * PUT /api/marketplace/listing/:id
 * Update a marketplace listing
 */
router.put('/listing/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const updates = req.body;

    const { data: listing, error } = await supabase
      .from('marketplace_listings')
      .update(updates)
      .eq('id', id)
      .eq('creator_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json(listing);
  } catch (error) {
    console.error('Failed to update listing:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * DELETE /api/marketplace/listing/:id
 * Delete a marketplace listing
 */
router.delete('/listing/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const { error } = await supabase
      .from('marketplace_listings')
      .delete()
      .eq('id', id)
      .eq('creator_id', userId);

    if (error) {
      throw error;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete listing:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
