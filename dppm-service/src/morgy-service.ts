import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Morgy,
  MorgyCreate,
  MorgyUpdate,
  MorgyConversation,
  MorgyMessage,
  MorgyKnowledge,
  MorgyMarketListing,
  MorgyPurchase,
  MorgyReview,
  CreatorTier
} from './types/morgy';

export class MorgyService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // ============================================================================
  // MORGY MANAGEMENT
  // ============================================================================

  /**
   * Create a new Morgy
   */
  async createMorgy(userId: string, data: MorgyCreate): Promise<Morgy> {
    const { data: morgy, error } = await this.supabase
      .from('morgys')
      .insert({
        user_id: userId,
        name: data.name,
        description: data.description,
        avatar_config: data.avatarConfig,
        system_prompt: data.systemPrompt,
        personality_traits: data.personalityTraits,
        expertise_areas: data.expertiseAreas,
        skills_config: data.skillsConfig,
        is_public: data.isPublic || false,
        is_starter: false,
        category: data.category,
        tags: data.tags || []
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create Morgy: ${error.message}`);
    return morgy as Morgy;
  }

  /**
   * Get a Morgy by ID
   */
  async getMorgy(morgyId: string, userId?: string): Promise<Morgy | null> {
    let query = this.supabase
      .from('morgys')
      .select('*')
      .eq('id', morgyId);

    // If userId provided, check ownership or public access
    if (userId) {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`);
    } else {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get Morgy: ${error.message}`);
    }

    return data as Morgy;
  }

  /**
   * Get user's Morgys
   */
  async getUserMorgys(userId: string): Promise<Morgy[]> {
    const { data, error } = await this.supabase
      .from('morgys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get user Morgys: ${error.message}`);
    return data as Morgy[];
  }

  /**
   * Get starter Morgys (Bill, Sally, Professor Hogsworth)
   */
  async getStarterMorgys(): Promise<Morgy[]> {
    const { data, error } = await this.supabase
      .from('morgys')
      .select('*')
      .eq('is_starter', true)
      .order('name');

    if (error) throw new Error(`Failed to get starter Morgys: ${error.message}`);
    return data as Morgy[];
  }

  /**
   * Update a Morgy
   */
  async updateMorgy(morgyId: string, userId: string, data: MorgyUpdate): Promise<Morgy> {
    const { data: morgy, error } = await this.supabase
      .from('morgys')
      .update({
        name: data.name,
        description: data.description,
        avatar_config: data.avatarConfig,
        system_prompt: data.systemPrompt,
        personality_traits: data.personalityTraits,
        expertise_areas: data.expertiseAreas,
        skills_config: data.skillsConfig,
        is_public: data.isPublic,
        category: data.category,
        tags: data.tags,
        updated_at: new Date().toISOString()
      })
      .eq('id', morgyId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update Morgy: ${error.message}`);
    return morgy as Morgy;
  }

  /**
   * Delete a Morgy
   */
  async deleteMorgy(morgyId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('morgys')
      .delete()
      .eq('id', morgyId)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to delete Morgy: ${error.message}`);
  }

  // ============================================================================
  // CONVERSATION MANAGEMENT
  // ============================================================================

  /**
   * Create a new conversation with a Morgy
   */
  async createConversation(userId: string, morgyId: string, title?: string): Promise<MorgyConversation> {
    const { data: conversation, error } = await this.supabase
      .from('morgy_conversations')
      .insert({
        user_id: userId,
        morgy_id: morgyId,
        title: title || 'New Conversation'
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create conversation: ${error.message}`);
    return conversation as MorgyConversation;
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string, userId: string): Promise<MorgyConversation | null> {
    const { data, error } = await this.supabase
      .from('morgy_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get conversation: ${error.message}`);
    }

    return data as MorgyConversation;
  }

  /**
   * Get user's conversations with a Morgy
   */
  async getUserConversations(userId: string, morgyId?: string): Promise<MorgyConversation[]> {
    let query = this.supabase
      .from('morgy_conversations')
      .select('*')
      .eq('user_id', userId);

    if (morgyId) {
      query = query.eq('morgy_id', morgyId);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) throw new Error(`Failed to get conversations: ${error.message}`);
    return data as MorgyConversation[];
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(
    conversationId: string,
    userId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, any>
  ): Promise<MorgyMessage> {
    const { data: message, error } = await this.supabase
      .from('morgy_messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to add message: ${error.message}`);

    // Update conversation's updated_at timestamp
    await this.supabase
      .from('morgy_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .eq('user_id', userId);

    return message as MorgyMessage;
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, userId: string): Promise<MorgyMessage[]> {
    // Verify user owns the conversation
    const conversation = await this.getConversation(conversationId, userId);
    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    const { data, error } = await this.supabase
      .from('morgy_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to get messages: ${error.message}`);
    return data as MorgyMessage[];
  }

  // ============================================================================
  // KNOWLEDGE BASE
  // ============================================================================

  /**
   * Add knowledge to a Morgy
   */
  async addKnowledge(
    morgyId: string,
    userId: string,
    content: string,
    source: string,
    metadata?: Record<string, any>
  ): Promise<MorgyKnowledge> {
    // Verify user owns the Morgy
    const morgy = await this.getMorgy(morgyId, userId);
    if (!morgy || morgy.user_id !== userId) {
      throw new Error('Morgy not found or access denied');
    }

    const { data: knowledge, error } = await this.supabase
      .from('morgy_knowledge')
      .insert({
        morgy_id: morgyId,
        content,
        source,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to add knowledge: ${error.message}`);
    return knowledge as MorgyKnowledge;
  }

  /**
   * Search knowledge base using semantic search
   */
  async searchKnowledge(morgyId: string, query: string, limit: number = 5): Promise<MorgyKnowledge[]> {
    // This would use pgvector for semantic search
    // For now, simple text search
    const { data, error } = await this.supabase
      .from('morgy_knowledge')
      .select('*')
      .eq('morgy_id', morgyId)
      .textSearch('content', query)
      .limit(limit);

    if (error) throw new Error(`Failed to search knowledge: ${error.message}`);
    return data as MorgyKnowledge[];
  }

  // ============================================================================
  // MORGY MARKET
  // ============================================================================

  /**
   * Create a marketplace listing
   */
  async createListing(
    morgyId: string,
    userId: string,
    pricing: MorgyMarketListing['pricing_model'],
    price?: number
  ): Promise<MorgyMarketListing> {
    // Verify user owns the Morgy
    const morgy = await this.getMorgy(morgyId, userId);
    if (!morgy || morgy.user_id !== userId) {
      throw new Error('Morgy not found or access denied');
    }

    const { data: listing, error } = await this.supabase
      .from('morgy_market_listings')
      .insert({
        morgy_id: morgyId,
        seller_id: userId,
        pricing_model: pricing,
        price: price || 0,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create listing: ${error.message}`);
    return listing as MorgyMarketListing;
  }

  /**
   * Browse marketplace listings
   */
  async browseMarket(
    filters?: {
      category?: string;
      minRating?: number;
      maxPrice?: number;
      search?: string;
    },
    limit: number = 20,
    offset: number = 0
  ): Promise<MorgyMarketListing[]> {
    let query = this.supabase
      .from('morgy_market_listings')
      .select(`
        *,
        morgy:morgys(*)
      `)
      .eq('status', 'active');

    if (filters?.category) {
      query = query.eq('morgy.category', filters.category);
    }

    if (filters?.minRating) {
      query = query.gte('average_rating', filters.minRating);
    }

    if (filters?.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }

    const { data, error } = await query
      .order('total_sales', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Failed to browse market: ${error.message}`);
    return data as MorgyMarketListing[];
  }

  /**
   * Purchase a Morgy
   */
  async purchaseMorgy(
    listingId: string,
    buyerId: string,
    licenseType: 'trial' | 'monthly' | 'annual' | 'lifetime'
  ): Promise<MorgyPurchase> {
    // Get listing details
    const { data: listing, error: listingError } = await this.supabase
      .from('morgy_market_listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (listingError) throw new Error(`Failed to get listing: ${listingError.message}`);

    // Create purchase record
    const { data: purchase, error: purchaseError } = await this.supabase
      .from('morgy_purchases')
      .insert({
        listing_id: listingId,
        buyer_id: buyerId,
        seller_id: listing.seller_id,
        morgy_id: listing.morgy_id,
        license_type: licenseType,
        price_paid: listing.price,
        status: 'active'
      })
      .select()
      .single();

    if (purchaseError) throw new Error(`Failed to create purchase: ${purchaseError.message}`);

    // Update listing sales count
    await this.supabase.rpc('increment_listing_sales', { listing_id: listingId });

    return purchase as MorgyPurchase;
  }

  /**
   * Add a review
   */
  async addReview(
    listingId: string,
    userId: string,
    rating: number,
    comment?: string
  ): Promise<MorgyReview> {
    // Verify user has purchased this Morgy
    const { data: purchase } = await this.supabase
      .from('morgy_purchases')
      .select('*')
      .eq('listing_id', listingId)
      .eq('buyer_id', userId)
      .single();

    if (!purchase) {
      throw new Error('You must purchase this Morgy before reviewing');
    }

    const { data: review, error } = await this.supabase
      .from('morgy_reviews')
      .insert({
        listing_id: listingId,
        reviewer_id: userId,
        rating,
        comment: comment || ''
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to add review: ${error.message}`);

    // Update listing average rating
    await this.updateListingRating(listingId);

    return review as MorgyReview;
  }

  /**
   * Update listing average rating
   */
  private async updateListingRating(listingId: string): Promise<void> {
    const { data: reviews } = await this.supabase
      .from('morgy_reviews')
      .select('rating')
      .eq('listing_id', listingId);

    if (reviews && reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      const reviewCount = reviews.length;

      await this.supabase
        .from('morgy_market_listings')
        .update({
          average_rating: avgRating,
          review_count: reviewCount
        })
        .eq('id', listingId);
    }
  }

  // ============================================================================
  // CREATOR ANALYTICS
  // ============================================================================

  /**
   * Get creator tier based on sales and ratings
   */
  async getCreatorTier(userId: string): Promise<CreatorTier> {
    const { data: stats } = await this.supabase
      .from('morgy_market_listings')
      .select('total_sales, average_rating, review_count')
      .eq('seller_id', userId);

    if (!stats || stats.length === 0) {
      return 'bronze';
    }

    const totalSales = stats.reduce((sum, s) => sum + (s.total_sales || 0), 0);
    const avgRating = stats.reduce((sum, s) => sum + (s.average_rating || 0) * (s.review_count || 0), 0) /
      stats.reduce((sum, s) => sum + (s.review_count || 0), 0);
    const totalReviews = stats.reduce((sum, s) => sum + (s.review_count || 0), 0);

    // Calculate total revenue
    const { data: purchases } = await this.supabase
      .from('morgy_purchases')
      .select('price_paid')
      .eq('seller_id', userId);

    const totalRevenue = purchases?.reduce((sum, p) => sum + p.price_paid, 0) || 0;

    // Determine tier
    if (totalSales >= 500 || totalRevenue >= 10000) {
      return 'platinum'; // 85/15 split
    }
    if (totalSales >= 100 || (avgRating >= 4.8 && totalReviews >= 50)) {
      return 'gold'; // 80/20 split
    }
    if (totalSales >= 26 || (avgRating >= 4.5 && totalReviews >= 10)) {
      return 'silver'; // 75/25 split
    }
    return 'bronze'; // 70/30 split
  }

  /**
   * Get creator analytics
   */
  async getCreatorAnalytics(userId: string): Promise<{
    tier: CreatorTier;
    totalSales: number;
    totalRevenue: number;
    totalEarnings: number;
    averageRating: number;
    totalReviews: number;
    activeListing: number;
  }> {
    const tier = await this.getCreatorTier(userId);

    const { data: listings } = await this.supabase
      .from('morgy_market_listings')
      .select('*')
      .eq('seller_id', userId);

    const { data: purchases } = await this.supabase
      .from('morgy_purchases')
      .select('price_paid')
      .eq('seller_id', userId);

    const totalSales = listings?.reduce((sum, l) => sum + (l.total_sales || 0), 0) || 0;
    const totalRevenue = purchases?.reduce((sum, p) => sum + p.price_paid, 0) || 0;
    
    // Calculate earnings based on tier
    const revenueSplits = {
      bronze: 0.70,
      silver: 0.75,
      gold: 0.80,
      platinum: 0.85
    };
    const totalEarnings = totalRevenue * revenueSplits[tier];

    const avgRating = listings?.reduce((sum, l) => sum + (l.average_rating || 0) * (l.review_count || 0), 0) /
      (listings?.reduce((sum, l) => sum + (l.review_count || 0), 0) || 1);

    const totalReviews = listings?.reduce((sum, l) => sum + (l.review_count || 0), 0) || 0;
    const activeListings = listings?.filter(l => l.status === 'active').length || 0;

    return {
      tier,
      totalSales,
      totalRevenue,
      totalEarnings,
      averageRating: avgRating,
      totalReviews,
      activeListing: activeListings
    };
  }

  // ============================================================================
  // STARTER MORGYS INITIALIZATION
  // ============================================================================

  /**
   * Initialize starter Morgys (Bill, Sally, Professor Hogsworth)
   * This should be run once during setup
   */
  async initializeStarterMorgys(adminUserId: string): Promise<void> {
    const starters = [
      {
        name: 'Bill',
        description: 'Enthusiastic business strategist who loves big ideas and needs occasional reality checks from Sally',
        avatar_config: {
          body: 'chubby',
          color: 'navy_blue',
          outfit: 'business_suit_rumpled',
          accessories: ['crooked_glasses', 'overstuffed_briefcase'],
          expression: 'excited_grin'
        },
        system_prompt: `You are Bill, an enthusiastic business strategist who LOVES helping people grow their businesses. You have 15 years of experience and genuinely good business instincts, but your excitement sometimes gets ahead of you. You're the life of the party—optimistic, energetic, and always ready with a "let's do this!" attitude.

PERSONALITY:
- Boundlessly enthusiastic and optimistic
- Big-picture thinker who sometimes misses details
- Well-meaning and eager to help
- Gets excited about every opportunity
- Occasionally suggests doing too much at once
- Lovable despite (or because of) your imperfections
- Always bounces back from mistakes with a grin

YOUR QUIRKS:
- You tend to suggest aggressive timelines ("Let's launch next week!")
- You get excited about every trend and want to try them all
- You sometimes forget practical constraints (budget, time, resources)
- You occasionally need Sally (your social media colleague) to help you refine ideas
- You're self-aware about your enthusiasm and take feedback well
- You genuinely want the best for your clients

COMMUNICATION STYLE:
- Use exclamation points liberally!
- Get excited mid-sentence and add new ideas
- Suggest bold, ambitious plans
- Be encouraging and confidence-building
- When you realize you've gone overboard, acknowledge it with humor
- Reference Sally when you know she'd have a better approach

RELATIONSHIP WITH SALLY:
- You respect her expertise, especially in social media and execution
- You often suggest she "polish" your ideas
- You're not offended when she gently corrects you—you appreciate it!
- You two work great together: you bring vision, she brings execution

Remember: You're smart and experienced, just enthusiastic and sometimes impulsive. Your heart is always in the right place!`,
        personality_traits: ['enthusiastic', 'optimistic', 'energetic', 'lovable', 'impulsive', 'visionary'],
        expertise_areas: ['business_strategy', 'growth_tactics', 'motivation', 'brainstorming'],
        skills_config: {
          research: true,
          writing: true,
          data_analysis: true,
          brainstorming: true,
          motivation: true
        },
        category: 'business',
        tags: ['business', 'strategy', 'motivation', 'brainstorming']
      },
      {
        name: 'Sally',
        description: 'Experienced social media expert who gently refines ideas and provides practical execution strategies',
        avatar_config: {
          body: 'curvy',
          color: 'soft_pink',
          outfit: 'professional_casual',
          accessories: ['elegant_earrings', 'designer_phone', 'planner'],
          expression: 'warm_smile'
        },
        system_prompt: `You are Sally, an experienced social media manager and digital strategist who genuinely loves helping people succeed online. You're 28 years old, have worked with dozens of brands, and have an intuitive understanding of what actually works in the real world. You're the gentle mentor who guides without judgment.

PERSONALITY:
- Supportive and encouraging, never condescending
- Experienced and strategic
- Warm and empathetic
- Patient with beginners
- Realistic but optimistic
- Professional but approachable

YOUR ROLE:
- You often help refine Bill's enthusiastic but overly ambitious ideas
- You provide the practical, execution-focused perspective
- You never make people feel bad for not knowing something
- You validate excitement before offering refinements
- You're the "polish" to Bill's "vision"

COMMUNICATION STYLE:
- Start by validating the person's idea or enthusiasm
- Gently offer refinements using "what if" or "how about"
- Never say "no" or "that won't work"—offer alternatives
- Use emojis sparingly and professionally (1-2 max)
- Share practical, actionable advice
- Celebrate progress and wins

RELATIONSHIP WITH BILL:
- You respect his enthusiasm and vision
- You gently refine his ideas without dismissing them
- You're never mean or condescending—always supportive
- You two complement each other perfectly
- You often say "Bill's got the right idea, let's just..." when helping users

Remember: You're the mentor everyone wishes they had. You make people feel capable and supported, never judged or inadequate.`,
        personality_traits: ['supportive', 'experienced', 'strategic', 'empathetic', 'professional', 'warm'],
        expertise_areas: ['social_media', 'content_strategy', 'execution', 'community_management'],
        skills_config: {
          research: true,
          writing: true,
          social_media: true,
          content_creation: true,
          analytics: true
        },
        category: 'marketing',
        tags: ['social_media', 'marketing', 'content', 'strategy']
      },
      {
        name: 'Professor Hogsworth',
        description: 'Distinguished research scholar with deep academic expertise and thorough analytical approach',
        avatar_config: {
          body: 'scholarly',
          color: 'brown_tweed',
          outfit: 'academic_robes',
          accessories: ['round_glasses', 'pipe', 'stack_of_books'],
          expression: 'thoughtful'
        },
        system_prompt: `You are Professor Hogsworth, a distinguished scholar and researcher with decades of academic experience. You approach every question with thoroughness, citing sources and providing well-researched answers.

PERSONALITY:
- Scholarly and thorough
- Patient educator
- Loves research and accuracy
- Speaks formally but kindly
- Takes time to explain complex topics

COMMUNICATION STYLE:
- Reference academic studies and research
- Provide comprehensive, well-structured answers
- Use formal but accessible language
- Break down complex topics systematically
- Always cite sources when possible

Remember: You're the voice of reason and research. You provide the data and evidence to support decisions.`,
        personality_traits: ['scholarly', 'thorough', 'patient', 'analytical', 'formal'],
        expertise_areas: ['research', 'analysis', 'education', 'academic_writing'],
        skills_config: {
          research: true,
          writing: true,
          data_analysis: true,
          teaching: true
        },
        category: 'research',
        tags: ['research', 'academic', 'analysis', 'education']
      }
    ];

    for (const starter of starters) {
      const { error } = await this.supabase
        .from('morgys')
        .insert({
          user_id: adminUserId,
          ...starter,
          is_starter: true,
          is_public: true
        });

      if (error) {
        console.error(`Failed to create starter Morgy ${starter.name}:`, error);
      }
    }
  }
}
