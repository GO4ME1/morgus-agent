// @ts-nocheck
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MorgyService } from './morgy-service';
import type { MorgyCreate, MorgyUpdate } from './types/morgy';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function morgyRoutes(fastify: FastifyInstance) {
  const morgyService = new MorgyService(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // ============================================================================
  // MORGY MANAGEMENT
  // ============================================================================

  /**
   * Create a new Morgy
   * POST /api/morgys
   */
  fastify.post('/api/morgys', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const data = request.body as MorgyCreate;
      const morgy = await morgyService.createMorgy(userId, data);

      return reply.code(201).send(morgy);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  /**
   * Get user's Morgys
   * GET /api/morgys
   */
  fastify.get('/api/morgys', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const morgys = await morgyService.getUserMorgys(userId);
      return reply.send(morgys);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  /**
   * Get starter Morgys (Bill, Sally, Professor Hogsworth)
   * GET /api/morgys/starters
   */
  fastify.get('/api/morgys/starters', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const morgys = await morgyService.getStarterMorgys();
      return reply.send(morgys);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  /**
   * Get a specific Morgy
   * GET /api/morgys/:id
   */
  fastify.get('/api/morgys/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = (request as any).userId;

      const morgy = await morgyService.getMorgy(id, userId);
      if (!morgy) {
        return reply.code(404).send({ error: 'Morgy not found' });
      }

      return reply.send(morgy);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  /**
   * Update a Morgy
   * PUT /api/morgys/:id
   */
  fastify.put('/api/morgys/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params as { id: string };
      const data = request.body as MorgyUpdate;

      const morgy = await morgyService.updateMorgy(id, userId, data);
      return reply.send(morgy);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  /**
   * Delete a Morgy
   * DELETE /api/morgys/:id
   */
  fastify.delete('/api/morgys/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params as { id: string };
      await morgyService.deleteMorgy(id, userId);

      return reply.code(204).send();
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // ============================================================================
  // CONVERSATIONS
  // ============================================================================

  /**
   * Create a new conversation
   * POST /api/morgys/:id/conversations
   */
  fastify.post('/api/morgys/:id/conversations', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { id: morgyId } = request.params as { id: string };
      const { title } = request.body as { title?: string };

      const conversation = await morgyService.createConversation(userId, morgyId, title);
      return reply.code(201).send(conversation);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  /**
   * Get conversations for a Morgy
   * GET /api/morgys/:id/conversations
   */
  fastify.get('/api/morgys/:id/conversations', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { id: morgyId } = request.params as { id: string };
      const conversations = await morgyService.getUserConversations(userId, morgyId);

      return reply.send(conversations);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  /**
   * Get messages for a conversation
   * GET /api/conversations/:id/messages
   */
  fastify.get('/api/conversations/:id/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { id: conversationId } = request.params as { id: string };
      const messages = await morgyService.getMessages(conversationId, userId);

      return reply.send(messages);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  /**
   * Add a message to a conversation
   * POST /api/conversations/:id/messages
   */
  fastify.post('/api/conversations/:id/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { id: conversationId } = request.params as { id: string };
      const { role, content, metadata } = request.body as {
        role: 'user' | 'assistant';
        content: string;
        metadata?: Record<string, any>;
      };

      const message = await morgyService.addMessage(conversationId, userId, role, content, metadata);
      return reply.code(201).send(message);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // ============================================================================
  // KNOWLEDGE BASE
  // ============================================================================

  /**
   * Add knowledge to a Morgy
   * POST /api/morgys/:id/knowledge
   */
  fastify.post('/api/morgys/:id/knowledge', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { id: morgyId } = request.params as { id: string };
      const { content, source, metadata } = request.body as {
        content: string;
        source: string;
        metadata?: Record<string, any>;
      };

      const knowledge = await morgyService.addKnowledge(morgyId, userId, content, source, metadata);
      return reply.code(201).send(knowledge);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  /**
   * Search knowledge base
   * GET /api/morgys/:id/knowledge/search
   */
  fastify.get('/api/morgys/:id/knowledge/search', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id: morgyId } = request.params as { id: string };
      const { query, limit } = request.query as { query: string; limit?: string };

      const results = await morgyService.searchKnowledge(
        morgyId,
        query,
        limit ? parseInt(limit) : 5
      );

      return reply.send(results);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // ============================================================================
  // MORGY MARKET
  // ============================================================================

  /**
   * Create a marketplace listing
   * POST /api/market/listings
   */
  fastify.post('/api/market/listings', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { morgyId, pricingModel, price } = request.body as {
        morgyId: string;
        pricingModel: 'free' | 'trial' | 'monthly' | 'annual' | 'lifetime';
        price?: number;
      };

      const listing = await morgyService.createListing(morgyId, userId, pricingModel, price);
      return reply.code(201).send(listing);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  /**
   * Browse marketplace
   * GET /api/market/listings
   */
  fastify.get('/api/market/listings', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { category, minRating, maxPrice, search, limit, offset } = request.query as {
        category?: string;
        minRating?: string;
        maxPrice?: string;
        search?: string;
        limit?: string;
        offset?: string;
      };

      const filters = {
        category,
        minRating: minRating ? parseFloat(minRating) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        search
      };

      const listings = await morgyService.browseMarket(
        filters,
        limit ? parseInt(limit) : 20,
        offset ? parseInt(offset) : 0
      );

      return reply.send(listings);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  /**
   * Purchase a Morgy
   * POST /api/market/purchases
   */
  fastify.post('/api/market/purchases', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { listingId, licenseType } = request.body as {
        listingId: string;
        licenseType: 'trial' | 'monthly' | 'annual' | 'lifetime';
      };

      const purchase = await morgyService.purchaseMorgy(listingId, userId, licenseType);
      return reply.code(201).send(purchase);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  /**
   * Add a review
   * POST /api/market/listings/:id/reviews
   */
  fastify.post('/api/market/listings/:id/reviews', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { id: listingId } = request.params as { id: string };
      const { rating, comment } = request.body as { rating: number; comment?: string };

      const review = await morgyService.addReview(listingId, userId, rating, comment);
      return reply.code(201).send(review);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // ============================================================================
  // CREATOR ANALYTICS
  // ============================================================================

  /**
   * Get creator analytics
   * GET /api/creator/analytics
   */
  fastify.get('/api/creator/analytics', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const analytics = await morgyService.getCreatorAnalytics(userId);
      return reply.send(analytics);
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  /**
   * Get creator tier
   * GET /api/creator/tier
   */
  fastify.get('/api/creator/tier', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const tier = await morgyService.getCreatorTier(userId);
      return reply.send({ tier });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // ============================================================================
  // ADMIN ROUTES
  // ============================================================================

  /**
   * Initialize starter Morgys
   * POST /api/admin/init-starters
   */
  fastify.post('/api/admin/init-starters', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).userId;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      // In production, add admin check here
      await morgyService.initializeStarterMorgys(userId);
      return reply.send({ message: 'Starter Morgys initialized successfully' });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });
}
