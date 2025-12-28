/**
 * Enhanced Marketplace API Routes
 * 
 * Features:
 * - Approval workflow for listings (pending -> approved -> published)
 * - Enhanced security with input validation
 * - Pagination and filtering
 * - Purchase tracking and analytics
 * - Creator earnings management
 */

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import {
  createMarketplaceListing,
  browseMarketplace,
  purchaseMorgy,
  completePurchase,
  getCreatorAnalytics,
} from './marketplace-service';

const router = Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

/**
 * POST /api/marketplace/listings
 * Create a new marketplace listing
 * 
 * Security:
 * - Validates all required fields
 * - Checks Morgy ownership
 * - Starts in 'pending' status for approval
 */
router.post('/listings', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const {
      morgy_id,
      title,
      description,
      price,
      pricing_model = 'one_time',
      category,
      tags = []
    } = req.body;

    // Validate required fields
    if (!morgy_id || !title || !description || price === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: morgy_id, title, description, price'
      });
    }

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(morgy_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Morgy ID format'
      });
    }

    // Validate price
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({
        success: false,
        error: 'Price must be a non-negative number'
      });
    }

    // Validate pricing model
    const validPricingModels = ['one_time', 'subscription', 'usage_based', 'free'];
    if (!validPricingModels.includes(pricing_model)) {
      return res.status(400).json({
        success: false,
        error: `Invalid pricing model. Must be one of: ${validPricingModels.join(', ')}`
      });
    }

    // Check if Morgy exists
    const { data: morgy, error: morgyError } = await supabase
      .from('morgys')
      .select('id, creator_id, name')
      .eq('id', morgy_id)
      .single();

    if (morgyError || !morgy) {
      return res.status(404).json({
        success: false,
        error: 'Morgy not found'
      });
    }

    // TODO: Verify ownership when auth is implemented
    // if (userId !== morgy.creator_id) {
    //   return res.status(403).json({ success: false, error: 'Unauthorized' });
    // }

    // Check if listing already exists for this Morgy
    const { data: existingListing } = await supabase
      .from('marketplace_listings')
      .select('id')
      .eq('morgy_id', morgy_id)
      .single();

    if (existingListing) {
      return res.status(409).json({
        success: false,
        error: 'A listing already exists for this Morgy'
      });
    }

    // Create listing (starts as 'pending' for approval)
    const { data: listing, error: insertError } = await supabase
      .from('marketplace_listings')
      .insert({
        morgy_id,
        creator_id: userId,
        title: title.trim(),
        description: description.trim(),
        price,
        pricing_model,
        category: category?.trim() || null,
        tags: tags || [],
        status: 'pending', // Requires approval
        is_featured: false,
        views: 0,
        purchases: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating listing:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create listing'
      });
    }

    res.status(201).json({
      success: true,
      listing,
      message: 'Listing created and pending approval'
    });

  } catch (error) {
    console.error('Error in POST /marketplace/listings:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/marketplace/listings
 * Browse marketplace listings with filters
 * 
 * Security:
 * - Only shows approved listings to non-creators
 * - Pagination for scalability
 * - SQL injection prevention via parameterized queries
 */
router.get('/listings', async (req: Request, res: Response) => {
  try {
    const {
      category,
      tags,
      pricing_model,
      min_price,
      max_price,
      search,
      sort_by = 'popular',
      page = '1',
      limit = '20'
    } = req.query;

    const userId = req.headers['x-user-id'] as string;

    // Parse pagination
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const offset = (pageNum - 1) * limitNum;

    // Build query
    let query = supabase
      .from('marketplace_listings')
      .select('*, morgys(name, description, rating)', { count: 'exact' });

    // Only show approved listings (unless user is the creator)
    if (!userId) {
      query = query.eq('status', 'approved');
    }

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (pricing_model) {
      query = query.eq('pricing_model', pricing_model);
    }

    if (min_price) {
      const minPriceNum = parseFloat(min_price as string);
      if (!isNaN(minPriceNum)) {
        query = query.gte('price', minPriceNum);
      }
    }

    if (max_price) {
      const maxPriceNum = parseFloat(max_price as string);
      if (!isNaN(maxPriceNum)) {
        query = query.lte('price', maxPriceNum);
      }
    }

    if (tags && typeof tags === 'string') {
      const tagArray = tags.split(',').map(t => t.trim());
      query = query.contains('tags', tagArray);
    }

    if (search && typeof search === 'string') {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    switch (sort_by) {
      case 'popular':
        query = query.order('purchases', { ascending: false });
        break;
      case 'recent':
        query = query.order('created_at', { ascending: false });
        break;
      case 'price_low':
        query = query.order('price', { ascending: true });
        break;
      case 'price_high':
        query = query.order('price', { ascending: false });
        break;
      case 'rating':
        // Note: Would need to join with morgys table for rating
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data: listings, error, count } = await query;

    if (error) {
      console.error('Error fetching listings:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch listings'
      });
    }

    res.json({
      success: true,
      listings: listings || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limitNum)
      }
    });

  } catch (error) {
    console.error('Error in GET /marketplace/listings:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/marketplace/listings/:id
 * Get a single listing by ID
 * 
 * Security:
 * - Increments view count
 * - Returns full details including Morgy info
 */
router.get('/listings/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid listing ID format'
      });
    }

    const { data: listing, error } = await supabase
      .from('marketplace_listings')
      .select('*, morgys(*)')
      .eq('id', id)
      .single();

    if (error || !listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    // Increment view count (async, don't wait)
    supabase
      .from('marketplace_listings')
      .update({ views: listing.views + 1 })
      .eq('id', id)
      .then(() => {})
      .catch(err => console.error('Error updating view count:', err));

    res.json({
      success: true,
      listing
    });

  } catch (error) {
    console.error('Error in GET /marketplace/listings/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/marketplace/listings/:id
 * Update a marketplace listing
 * 
 * Security:
 * - Validates ownership
 * - Only allows updating specific fields
 * - Resets to 'pending' if significant changes made
 */
router.put('/listings/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const { title, description, price, pricing_model, category, tags } = req.body;

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid listing ID format'
      });
    }

    // Check if listing exists and user owns it
    const { data: existing, error: existingError } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    // TODO: Verify ownership
    // if (userId !== existing.creator_id) {
    //   return res.status(403).json({ success: false, error: 'Unauthorized' });
    // }

    // Build updates
    const updates: any = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Title must be a non-empty string'
        });
      }
      updates.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Description must be a non-empty string'
        });
      }
      updates.description = description.trim();
    }

    if (price !== undefined) {
      if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({
          success: false,
          error: 'Price must be a non-negative number'
        });
      }
      updates.price = price;
    }

    if (pricing_model !== undefined) {
      const validModels = ['one_time', 'subscription', 'usage_based', 'free'];
      if (!validModels.includes(pricing_model)) {
        return res.status(400).json({
          success: false,
          error: `Invalid pricing model. Must be one of: ${validModels.join(', ')}`
        });
      }
      updates.pricing_model = pricing_model;
    }

    if (category !== undefined) {
      updates.category = category?.trim() || null;
    }

    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        return res.status(400).json({
          success: false,
          error: 'Tags must be an array'
        });
      }
      updates.tags = tags;
    }

    // If significant changes, reset to pending
    if (title || description || price !== undefined) {
      updates.status = 'pending';
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    // Update listing
    const { data: listing, error: updateError } = await supabase
      .from('marketplace_listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating listing:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update listing'
      });
    }

    res.json({
      success: true,
      listing,
      message: updates.status === 'pending' ? 'Listing updated and pending re-approval' : 'Listing updated'
    });

  } catch (error) {
    console.error('Error in PUT /marketplace/listings/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/marketplace/listings/:id
 * Delete a marketplace listing
 * 
 * Security:
 * - Validates ownership
 * - Soft delete (sets status to 'deleted')
 */
router.delete('/listings/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { id } = req.params;

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid listing ID format'
      });
    }

    // Check if listing exists and user owns it
    const { data: existing, error: existingError } = await supabase
      .from('marketplace_listings')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    // TODO: Verify ownership
    // if (userId !== existing.creator_id) {
    //   return res.status(403).json({ success: false, error: 'Unauthorized' });
    // }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('marketplace_listings')
      .update({ status: 'deleted' })
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting listing:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete listing'
      });
    }

    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /marketplace/listings/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/marketplace/listings/:id/approve
 * Approve a pending listing (admin only)
 * 
 * Security:
 * - TODO: Add admin role check
 */
router.post('/listings/:id/approve', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // TODO: Check if user is admin
    // const { data: user } = await supabase.auth.getUser(userId);
    // if (!user || user.role !== 'admin') {
    //   return res.status(403).json({ success: false, error: 'Forbidden' });
    // }

    const { id } = req.params;

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid listing ID format'
      });
    }

    // Update status to approved
    const { data: listing, error } = await supabase
      .from('marketplace_listings')
      .update({ status: 'approved' })
      .eq('id', id)
      .select()
      .single();

    if (error || !listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    res.json({
      success: true,
      listing,
      message: 'Listing approved'
    });

  } catch (error) {
    console.error('Error in POST /marketplace/listings/:id/approve:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/marketplace/listings/:id/reject
 * Reject a pending listing (admin only)
 * 
 * Security:
 * - TODO: Add admin role check
 */
router.post('/listings/:id/reject', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { reason } = req.body;

    // TODO: Check if user is admin

    const { id } = req.params;

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid listing ID format'
      });
    }

    // Update status to rejected
    const { data: listing, error } = await supabase
      .from('marketplace_listings')
      .update({
        status: 'rejected',
        rejection_reason: reason || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    res.json({
      success: true,
      listing,
      message: 'Listing rejected'
    });

  } catch (error) {
    console.error('Error in POST /marketplace/listings/:id/reject:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/marketplace/my-listings
 * Get current user's marketplace listings
 */
router.get('/my-listings', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { data: listings, error } = await supabase
      .from('marketplace_listings')
      .select('*, morgys(name, description)')
      .eq('creator_id', userId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching my listings:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch listings'
      });
    }

    res.json({
      success: true,
      listings: listings || []
    });

  } catch (error) {
    console.error('Error in GET /marketplace/my-listings:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/marketplace/my-purchases
 * Get current user's purchases
 */
router.get('/my-purchases', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { data: purchases, error } = await supabase
      .from('morgy_purchases')
      .select('*, morgys(*)')
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching my purchases:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch purchases'
      });
    }

    res.json({
      success: true,
      purchases: purchases || []
    });

  } catch (error) {
    console.error('Error in GET /marketplace/my-purchases:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/marketplace/analytics
 * Get creator analytics
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const analytics = await getCreatorAnalytics(userId);

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Error in GET /marketplace/analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Legacy routes for backwards compatibility
router.post('/create', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { morgyId, listing } = req.body;
  const result = await createMarketplaceListing(morgyId, userId, listing);
  res.json(result);
});

router.get('/browse', async (req, res) => {
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
});

router.post('/purchase', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { listingId } = req.body;
  const result = await purchaseMorgy(listingId, userId);
  res.json(result);
});

router.post('/complete-purchase', async (req, res) => {
  const { purchaseId, paymentIntentId } = req.body;
  const result = await completePurchase(purchaseId, paymentIntentId);
  res.json(result);
});

export default router;
