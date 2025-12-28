import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ============================================
// PLATFORM LEARNINGS
// ============================================

export interface PlatformLearning {
  id?: string;
  title: string;
  learning: string;
  category: 'task_execution' | 'user_interaction' | 'model_selection' | 'task_decomposition' | 
            'error_handling' | 'optimization' | 'user_preference' | 'best_practice' | 'general';
  keywords?: string[];
  applies_to_categories?: string[];
  confidence_score?: number;
  proposed_by?: string;
  approved?: boolean;
}

export interface MorgyLearning {
  id?: string;
  morgy_id: string;
  title: string;
  learning: string;
  domain?: string;
  learning_type?: 'insight' | 'best_practice' | 'warning' | 'preference' | 'optimization';
  keywords?: string[];
  confidence_score?: number;
  applies_to_all_users?: boolean;
  specific_user_id?: string;
  example_query?: string;
  example_response?: string;
  approved?: boolean;
}

/**
 * Generate embedding for text using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Propose a new platform learning
 */
export async function proposePlatformLearning(
  learning: PlatformLearning,
  userId: string
): Promise<{ id: string; success: boolean }> {
  try {
    // Generate embedding
    const embeddingText = `${learning.title} ${learning.learning}`;
    const embedding = await generateEmbedding(embeddingText);

    // Insert learning
    const { data, error } = await supabase
      .from('platform_learnings')
      .insert({
        title: learning.title,
        learning: learning.learning,
        category: learning.category,
        keywords: learning.keywords || [],
        applies_to_categories: learning.applies_to_categories || [],
        confidence_score: learning.confidence_score || 0.7,
        proposed_by: userId,
        embedding: JSON.stringify(embedding),
        approved: false // Needs approval
      })
      .select('id')
      .single();

    if (error) throw error;

    return { id: data.id, success: true };
  } catch (error) {
    console.error('Error proposing platform learning:', error);
    throw error;
  }
}

/**
 * Search for relevant platform learnings
 */
export async function searchPlatformLearnings(
  query: string,
  category?: string,
  limit: number = 5
): Promise<any[]> {
  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Call the database function
    const { data, error } = await supabase.rpc('search_platform_learnings', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: 0.7,
      match_count: limit,
      filter_category: category || null
    });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error searching platform learnings:', error);
    return [];
  }
}

/**
 * Get top performing platform learnings
 */
export async function getTopPlatformLearnings(
  category?: string,
  limit: number = 10
): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc('get_top_platform_learnings', {
      p_category: category || null,
      p_limit: limit
    });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting top platform learnings:', error);
    return [];
  }
}

/**
 * Record that a platform learning was applied
 */
export async function recordPlatformLearningApplication(
  learningId: string,
  reflectionId?: string,
  conversationId?: string,
  wasSuccessful?: boolean
): Promise<void> {
  try {
    await supabase.rpc('record_learning_application', {
      p_learning_id: learningId,
      p_reflection_id: reflectionId || null,
      p_conversation_id: conversationId || null,
      p_was_successful: wasSuccessful || null
    });
  } catch (error) {
    console.error('Error recording platform learning application:', error);
  }
}

/**
 * Approve a platform learning
 */
export async function approvePlatformLearning(
  learningId: string,
  approverId: string
): Promise<void> {
  try {
    await supabase.rpc('approve_platform_learning', {
      p_learning_id: learningId,
      p_approver_id: approverId
    });
  } catch (error) {
    console.error('Error approving platform learning:', error);
    throw error;
  }
}

/**
 * Reject a platform learning
 */
export async function rejectPlatformLearning(
  learningId: string,
  reason?: string
): Promise<void> {
  try {
    await supabase.rpc('reject_platform_learning', {
      p_learning_id: learningId,
      p_reason: reason || null
    });
  } catch (error) {
    console.error('Error rejecting platform learning:', error);
    throw error;
  }
}

// ============================================
// MORGY LEARNINGS
// ============================================

/**
 * Propose a new Morgy learning
 */
export async function proposeMorgyLearning(
  learning: MorgyLearning,
  sessionId?: string
): Promise<{ id: string; success: boolean }> {
  try {
    // Generate embedding
    const embeddingText = `${learning.title} ${learning.learning}`;
    const embedding = await generateEmbedding(embeddingText);

    // Insert learning
    const { data, error } = await supabase
      .from('morgy_learnings')
      .insert({
        morgy_id: learning.morgy_id,
        title: learning.title,
        learning: learning.learning,
        domain: learning.domain || null,
        learning_type: learning.learning_type || 'insight',
        keywords: learning.keywords || [],
        confidence_score: learning.confidence_score || 0.7,
        applies_to_all_users: learning.applies_to_all_users !== false,
        specific_user_id: learning.specific_user_id || null,
        example_query: learning.example_query || null,
        example_response: learning.example_response || null,
        proposed_during_session: sessionId || null,
        embedding: JSON.stringify(embedding),
        approved: false // Needs approval
      })
      .select('id')
      .single();

    if (error) throw error;

    return { id: data.id, success: true };
  } catch (error) {
    console.error('Error proposing Morgy learning:', error);
    throw error;
  }
}

/**
 * Search for relevant Morgy learnings
 */
export async function searchMorgyLearnings(
  morgyId: string,
  query: string,
  userId?: string,
  limit: number = 5
): Promise<any[]> {
  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Call the database function
    const { data, error } = await supabase.rpc('search_morgy_learnings', {
      p_morgy_id: morgyId,
      query_embedding: JSON.stringify(queryEmbedding),
      p_user_id: userId || null,
      match_threshold: 0.7,
      match_count: limit
    });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error searching Morgy learnings:', error);
    return [];
  }
}

/**
 * Get Morgy learning statistics
 */
export async function getMorgyLearningStats(morgyId: string): Promise<any> {
  try {
    const { data, error } = await supabase.rpc('get_morgy_learning_stats', {
      p_morgy_id: morgyId
    });

    if (error) throw error;

    return data || {};
  } catch (error) {
    console.error('Error getting Morgy learning stats:', error);
    return {};
  }
}

/**
 * Record that a Morgy learning was applied
 */
export async function recordMorgyLearningApplication(
  learningId: string,
  morgyId: string,
  userId: string,
  conversationId?: string,
  feedback?: 'positive' | 'negative' | 'neutral'
): Promise<void> {
  try {
    await supabase.rpc('record_morgy_learning_application', {
      p_learning_id: learningId,
      p_morgy_id: morgyId,
      p_user_id: userId,
      p_conversation_id: conversationId || null,
      p_feedback: feedback || null
    });
  } catch (error) {
    console.error('Error recording Morgy learning application:', error);
  }
}

/**
 * Approve a Morgy learning
 */
export async function approveMorgyLearning(
  learningId: string,
  approverId: string
): Promise<void> {
  try {
    await supabase.rpc('approve_morgy_learning', {
      p_learning_id: learningId,
      p_approver_id: approverId
    });
  } catch (error) {
    console.error('Error approving Morgy learning:', error);
    throw error;
  }
}

/**
 * Reject a Morgy learning
 */
export async function rejectMorgyLearning(
  learningId: string,
  reason?: string
): Promise<void> {
  try {
    await supabase.rpc('reject_morgy_learning', {
      p_learning_id: learningId,
      p_reason: reason || null
    });
  } catch (error) {
    console.error('Error rejecting Morgy learning:', error);
    throw error;
  }
}

// ============================================
// CONVERSATIONS
// ============================================

/**
 * Create a new conversation
 */
export async function createConversation(
  userId: string,
  morgyId?: string,
  title?: string
): Promise<{ id: string; success: boolean }> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        morgy_id: morgyId || null,
        title: title || 'New Conversation'
      })
      .select('id')
      .single();

    if (error) throw error;

    return { id: data.id, success: true };
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

/**
 * Add a message to a conversation
 */
export async function addConversationMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: any,
  appliedLearnings?: string[],
  proposedLearningId?: string
): Promise<{ id: string; success: boolean }> {
  try {
    const { data, error } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        metadata: metadata || {},
        applied_learnings: appliedLearnings || [],
        proposed_learning_id: proposedLearningId || null
      })
      .select('id')
      .single();

    if (error) throw error;

    return { id: data.id, success: true };
  } catch (error) {
    console.error('Error adding conversation message:', error);
    throw error;
  }
}

/**
 * Get conversation history
 */
export async function getConversationHistory(
  conversationId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return [];
  }
}

/**
 * Get user's conversations
 */
export async function getUserConversations(
  userId: string,
  status: 'active' | 'archived' | 'deleted' = 'active',
  limit: number = 20
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('last_message_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting user conversations:', error);
    return [];
  }
}
