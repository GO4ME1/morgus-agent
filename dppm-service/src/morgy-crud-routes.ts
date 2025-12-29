import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// Middleware to verify authentication
const requireAuth = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  // TODO: Verify JWT token and extract user ID
  // For now, we'll use a placeholder
  (req as any).userId = req.headers['x-user-id'] || 'placeholder-user-id';
  next();
};

// Validation middleware
const validateMorgyData = (req: Request, res: Response, next: Function) => {
  const { name, category, aiConfig, personality, appearance, capabilities, knowledgeBase, marketplace } = req.body;
  
  // Validate required fields
  if (!name || name.length < 3 || name.length > 255) {
    return res.status(400).json({ 
      success: false, 
      error: 'Name must be between 3 and 255 characters' 
    });
  }
  
  if (!category || !['business', 'social', 'research', 'technical', 'creative', 'custom'].includes(category)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid category' 
    });
  }
  
  // Validate marketplace settings
  if (marketplace) {
    if (marketplace.licenseType && !['free', 'paid', 'subscription'].includes(marketplace.licenseType)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid license type' 
      });
    }
    
    if (marketplace.price !== undefined) {
      const price = parseFloat(marketplace.price);
      if (isNaN(price) || price < 0 || price > 999.99) {
        return res.status(400).json({ 
          success: false, 
          error: 'Price must be between 0 and 999.99' 
        });
      }
    }
  }
  
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
 * POST /api/morgys
 * Create a new Morgy
 */
router.post('/', requireAuth, validateMorgyData, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const {
      name,
      description,
      category,
      tags,
      aiConfig,
      personality,
      appearance,
      capabilities,
      knowledgeBase,
      marketplace
    } = req.body;
    
    // Prepare data for insertion
    const morgyData = {
      creator_id: userId,
      name,
      description: description || '',
      category,
      tags: tags || [],
      ai_config: aiConfig || {
        primaryModel: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: '',
        fallbackModels: []
      },
      personality: personality || {
        tone: 'professional',
        verbosity: 'balanced',
        emojiUsage: 'minimal',
        responseStyle: ''
      },
      appearance: appearance || {
        avatar: '🐷',
        color: '#8B5CF6',
        icon: 'pig'
      },
      capabilities: capabilities || {
        webSearch: true,
        codeExecution: false,
        fileProcessing: true,
        imageGeneration: false,
        voiceInteraction: false,
        mcpTools: []
      },
      knowledge_base: knowledgeBase || {
        documents: [],
        urls: [],
        customData: ''
      },
      is_public: marketplace?.isPublic || false,
      license_type: marketplace?.licenseType || 'free',
      price: marketplace?.price || 0,
      is_premium: marketplace?.isPremium || false,
      published_at: marketplace?.isPublic ? new Date().toISOString() : null
    };
    
    // Insert into database
    const { data, error } = await supabase
      .from('morgys')
      .insert([morgyData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating Morgy:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create Morgy' 
      });
    }
    
    res.status(201).json({
      success: true,
      morgy: {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        tags: data.tags,
        creatorId: data.creator_id,
        aiConfig: data.ai_config,
        personality: data.personality,
        appearance: data.appearance,
        capabilities: data.capabilities,
        knowledgeBase: data.knowledge_base,
        isPublic: data.is_public,
        licenseType: data.license_type,
        price: parseFloat(data.price),
        isPremium: data.is_premium,
        stats: {
          totalPurchases: data.total_purchases,
          totalRevenue: parseFloat(data.total_revenue),
          rating: parseFloat(data.rating),
          reviewCount: data.review_count,
          viewCount: data.view_count
        },
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    });
  } catch (error) {
    console.error('Error in POST /api/morgys:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/morgys/user/:userId
 * Get all Morgys created by a user
 */
router.get('/user/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string || 'all';
    
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('morgys')
      .select('*', { count: 'exact' })
      .eq('creator_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply status filter
    if (status === 'public') {
      query = query.eq('is_public', true);
    } else if (status === 'private') {
      query = query.eq('is_public', false);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching user Morgys:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch Morgys' 
      });
    }
    
    const morgys = data.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      category: m.category,
      tags: m.tags,
      appearance: m.appearance,
      isPublic: m.is_public,
      licenseType: m.license_type,
      price: parseFloat(m.price),
      totalPurchases: m.total_purchases,
      totalRevenue: parseFloat(m.total_revenue),
      rating: parseFloat(m.rating),
      reviewCount: m.review_count,
      createdAt: m.created_at,
      updatedAt: m.updated_at
    }));
    
    res.json({
      success: true,
      morgys,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in GET /api/morgys/user/:userId:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/morgys/:morgyId
 * Get details of a specific Morgy
 */
router.get('/:morgyId', async (req: Request, res: Response) => {
  try {
    const { morgyId } = req.params;
    const userId = (req as any).userId; // May be undefined if not authenticated
    
    // Fetch Morgy
    const { data: morgy, error } = await supabase
      .from('morgys')
      .select('*')
      .eq('id', morgyId)
      .eq('is_active', true)
      .single();
    
    if (error || !morgy) {
      return res.status(404).json({ 
        success: false, 
        error: 'Morgy not found' 
      });
    }
    
    // Check if user owns or has purchased this Morgy
    const isOwner = userId && morgy.creator_id === userId;
    let hasPurchased = false;
    
    if (userId && !isOwner) {
      const { data: purchase } = await supabase
        .from('morgy_purchases')
        .select('id')
        .eq('morgy_id', morgyId)
        .eq('buyer_id', userId)
        .eq('payment_status', 'completed')
        .single();
      
      hasPurchased = !!purchase;
    }
    
    // Increment view count (async, don't wait)
    Promise.resolve(
      supabase
        .from('morgys')
        .update({ view_count: morgy.view_count + 1 })
        .eq('id', morgyId)
    ).catch((err: any) => console.error('Error incrementing view count:', err));
    
    // Track analytics (async)
    const today = new Date().toISOString().split('T')[0];
    Promise.resolve(
      supabase
        .from('morgy_analytics')
        .upsert({
          morgy_id: morgyId,
          date: today,
          views: 1
        }, {
          onConflict: 'morgy_id,date',
          ignoreDuplicates: false
        })
    ).catch((err: any) => console.error('Error tracking analytics:', err));
    
    res.json({
      success: true,
      morgy: {
        id: morgy.id,
        name: morgy.name,
        description: morgy.description,
        category: morgy.category,
        tags: morgy.tags,
        creator: {
          id: morgy.creator_id,
          // TODO: Fetch creator name and avatar
        },
        aiConfig: morgy.ai_config,
        personality: morgy.personality,
        appearance: morgy.appearance,
        capabilities: morgy.capabilities,
        knowledgeBase: isOwner || hasPurchased ? morgy.knowledge_base : undefined,
        isPublic: morgy.is_public,
        licenseType: morgy.license_type,
        price: parseFloat(morgy.price),
        isPremium: morgy.is_premium,
        stats: {
          totalPurchases: morgy.total_purchases,
          totalRevenue: parseFloat(morgy.total_revenue),
          rating: parseFloat(morgy.rating),
          reviewCount: morgy.review_count,
          viewCount: morgy.view_count + 1
        },
        isOwner,
        hasPurchased,
        createdAt: morgy.created_at,
        updatedAt: morgy.updated_at,
        publishedAt: morgy.published_at
      }
    });
  } catch (error) {
    console.error('Error in GET /api/morgys/:morgyId:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * PUT /api/morgys/:morgyId
 * Update a Morgy
 */
router.put('/:morgyId', requireAuth, validateMorgyData, async (req: Request, res: Response) => {
  try {
    const { morgyId } = req.params;
    const userId = (req as any).userId;
    
    // Check ownership
    const { data: existing, error: fetchError } = await supabase
      .from('morgys')
      .select('creator_id, is_public')
      .eq('id', morgyId)
      .eq('is_active', true)
      .single();
    
    if (fetchError || !existing) {
      return res.status(404).json({ 
        success: false, 
        error: 'Morgy not found' 
      });
    }
    
    if (existing.creator_id !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'You do not have permission to edit this Morgy' 
      });
    }
    
    const {
      name,
      description,
      category,
      tags,
      aiConfig,
      personality,
      appearance,
      capabilities,
      knowledgeBase,
      marketplace
    } = req.body;
    
    // Prepare update data
    const updateData: any = {
      name,
      description,
      category,
      tags,
      ai_config: aiConfig,
      personality,
      appearance,
      capabilities,
      knowledge_base: knowledgeBase
    };
    
    // Update marketplace settings
    if (marketplace) {
      updateData.is_public = marketplace.isPublic;
      updateData.license_type = marketplace.licenseType;
      updateData.price = marketplace.price;
      updateData.is_premium = marketplace.isPremium;
      
      // Set published_at if changing from private to public
      if (marketplace.isPublic && !existing.is_public) {
        updateData.published_at = new Date().toISOString();
      }
    }
    
    // Update in database
    const { data, error } = await supabase
      .from('morgys')
      .update(updateData)
      .eq('id', morgyId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating Morgy:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update Morgy' 
      });
    }
    
    res.json({
      success: true,
      morgy: {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        tags: data.tags,
        aiConfig: data.ai_config,
        personality: data.personality,
        appearance: data.appearance,
        capabilities: data.capabilities,
        knowledgeBase: data.knowledge_base,
        isPublic: data.is_public,
        licenseType: data.license_type,
        price: parseFloat(data.price),
        isPremium: data.is_premium,
        updatedAt: data.updated_at
      }
    });
  } catch (error) {
    console.error('Error in PUT /api/morgys/:morgyId:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * DELETE /api/morgys/:morgyId
 * Delete (soft delete) a Morgy
 */
router.delete('/:morgyId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { morgyId } = req.params;
    const userId = (req as any).userId;
    
    // Check ownership
    const { data: existing, error: fetchError } = await supabase
      .from('morgys')
      .select('creator_id')
      .eq('id', morgyId)
      .eq('is_active', true)
      .single();
    
    if (fetchError || !existing) {
      return res.status(404).json({ 
        success: false, 
        error: 'Morgy not found' 
      });
    }
    
    if (existing.creator_id !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'You do not have permission to delete this Morgy' 
      });
    }
    
    // Check for active subscriptions
    const { data: activeSubscriptions } = await supabase
      .from('morgy_purchases')
      .select('id')
      .eq('morgy_id', morgyId)
      .eq('purchase_type', 'subscription')
      .eq('subscription_status', 'active');
    
    if (activeSubscriptions && activeSubscriptions.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete Morgy with active subscriptions. Please cancel all subscriptions first.' 
      });
    }
    
    // Soft delete
    const { error } = await supabase
      .from('morgys')
      .update({ is_active: false })
      .eq('id', morgyId);
    
    if (error) {
      console.error('Error deleting Morgy:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to delete Morgy' 
      });
    }
    
    res.json({
      success: true,
      message: 'Morgy deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/morgys/:morgyId:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;
