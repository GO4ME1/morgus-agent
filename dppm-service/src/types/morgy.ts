// ============================================
// MORGY SYSTEM - TYPESCRIPT TYPES
// ============================================

export type Platform = 'twitter' | 'facebook' | 'reddit' | 'tiktok' | 'instagram' | 'linkedin';
export type LicenseType = 'free' | 'trial' | 'monthly' | 'annual' | 'lifetime';
export type MemoryType = 'fact' | 'preference' | 'context' | 'task';
export type SourceType = 'document' | 'website' | 'code' | 'text' | 'media';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PostStatus = 'draft' | 'scheduled' | 'posted' | 'failed';
export type InteractionType = 'reply' | 'like' | 'follow' | 'dm';

// ============================================
// MORGY CORE
// ============================================

export interface MorgyPersonality {
  traits: string[];
  communication_style: string;
  expertise_areas: string[];
  tone: string;
  speaking_patterns?: string[];
  catchphrases?: string[];
}

export interface MorgyAvatarConfig {
  body_shape: string;
  body_size?: string;
  posture?: string;
  color: string;
  pattern: string;
  secondary_color?: string;
  ears: string;
  snout: string;
  eyes: string;
  eye_color: string;
  eyewear?: string;
  expression: string;
  facial_hair?: string;
  outfit: string;
  outfit_color?: string;
  head_accessory?: string;
  neck_accessory?: string;
  hand_accessory?: string;
  props?: string[];
  background?: string;
  art_style?: string;
}

export interface MorgySkills {
  social_media: boolean;
  research: boolean;
  writing: boolean;
  data_analysis: boolean;
  customer_support: boolean;
  content_creation?: boolean;
  financial_modeling?: boolean;
  market_analysis?: boolean;
  strategic_planning?: boolean;
  graphic_design?: boolean;
  video_editing?: boolean;
  trend_analysis?: boolean;
  community_management?: boolean;
  academic_writing?: boolean;
  fact_checking?: boolean;
  literature_review?: boolean;
  study_guide_creation?: boolean;
  technical_documentation?: boolean;
}

export interface Morgy {
  id: string;
  creator_id: string;
  user_id: string; // Same as creator_id, for compatibility
  name: string;
  slug: string;
  description: string;
  personality: MorgyPersonality;
  avatar_config: MorgyAvatarConfig;
  skills: MorgySkills;
  knowledge_base_id?: string;
  system_prompt?: string;
  category?: string;
  is_public: boolean;
  is_starter: boolean;
  price_cents?: number;
  license_type?: LicenseType;
  total_conversations: number;
  total_messages: number;
  total_sales: number;
  average_rating?: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface MorgyAvatar {
  id: string;
  morgy_id: string;
  config: MorgyAvatarConfig;
  image_url: string;
  thumbnail_url?: string;
  idle_animation?: string[];
  thinking_animation?: string[];
  excited_animation?: string[];
  working_animation?: string[];
  speaking_animation?: string[];
  created_at: Date;
}

// ============================================
// CONVERSATIONS & MESSAGES
// ============================================

export interface Conversation {
  id: string;
  morgy_id: string;
  user_id: string;
  title?: string;
  last_message_at: Date;
  created_at: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface Memory {
  id: string;
  morgy_id: string;
  user_id: string;
  memory_type: MemoryType;
  content: string;
  importance: number;
  embedding?: number[];
  created_at: Date;
  accessed_at: Date;
  access_count: number;
}

// ============================================
// KNOWLEDGE BASE
// ============================================

export interface KnowledgeBase {
  id: string;
  user_id: string;
  morgy_id?: string;
  name: string;
  description?: string;
  total_chunks: number;
  created_at: Date;
}

export interface KnowledgeSource {
  id: string;
  knowledge_base_id: string;
  source_type: SourceType;
  source_name: string;
  source_url?: string;
  file_path?: string;
  file_size_bytes?: number;
  processing_status: ProcessingStatus;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface KnowledgeChunk {
  id: string;
  source_id: string;
  content: string;
  embedding?: number[];
  chunk_index: number;
  token_count: number;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface SearchResult {
  chunk_id: string;
  content: string;
  similarity: number;
  source_name: string;
  metadata?: Record<string, any>;
}

// ============================================
// SOCIAL MEDIA
// ============================================

export interface SocialAccount {
  id: string;
  user_id: string;
  morgy_id?: string;
  platform: Platform;
  account_name: string;
  account_id: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: Date;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface SocialPost {
  id: string;
  morgy_id: string;
  social_account_id: string;
  content: string;
  media_urls?: string[];
  scheduled_for?: Date;
  posted_at?: Date;
  platform_post_id?: string;
  status: PostStatus;
  error_message?: string;
  likes: number;
  shares: number;
  comments: number;
  views: number;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface SocialInteraction {
  id: string;
  morgy_id: string;
  social_account_id: string;
  interaction_type: InteractionType;
  target_user: string;
  target_post_id?: string;
  content?: string;
  performed_at: Date;
  status: 'pending' | 'completed' | 'failed';
  error_message?: string;
}

export interface GeneratedContent {
  platform: Platform;
  text: string;
  hashtags: string[];
  mediaUrls?: string[];
  metadata: {
    characterCount: number;
    estimatedEngagement: number;
    optimalPostTime: Date;
  };
}

// ============================================
// MARKETPLACE
// ============================================

export interface License {
  id: string;
  morgy_id: string;
  user_id: string;
  license_type: LicenseType;
  price_paid_cents?: number;
  starts_at: Date;
  expires_at?: Date;
  is_active: boolean;
  stripe_subscription_id?: string;
  stripe_payment_intent_id?: string;
  created_at: Date;
}

export interface Review {
  id: string;
  morgy_id: string;
  user_id: string;
  rating: number;
  review_text?: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: Date;
}

export interface Sale {
  id: string;
  morgy_id: string;
  seller_id: string;
  buyer_id: string;
  price_cents: number;
  platform_fee_cents: number;
  seller_earnings_cents: number;
  stripe_payment_intent_id?: string;
  created_at: Date;
}

export interface CreatorBalance {
  creator_id: string;
  balance_cents: number;
  total_earned_cents: number;
  total_withdrawn_cents: number;
  updated_at: Date;
}

export interface CreatorPayout {
  id: string;
  creator_id: string;
  user_id: string; // Same as creator_id, for compatibility
  amount_cents: number;
  stripe_payout_id?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: Date;
}

export interface MarketMorgy extends Morgy {
  creator: {
    id: string;
    name: string;
    reputation: number;
  };
}

export interface CreatorStats {
  totalMorgys: number;
  totalSales: number;
  totalRevenue: number;
  pendingPayout: number;
  averageRating: number;
  topMorgy?: {
    name: string;
    sales: number;
    revenue: number;
  };
  recentSales: Sale[];
  revenueByMonth: Record<string, number>;
}

// ============================================
// MCP INTEGRATION
// ============================================

export interface MorgyAPIKey {
  id: string;
  morgy_id: string;
  user_id: string;
  key_hash: string;
  key_prefix: string;
  name?: string;
  last_used_at?: Date;
  expires_at?: Date;
  is_active: boolean;
  created_at: Date;
}

export interface MCPExport {
  id: string;
  morgy_id: string;
  user_id: string;
  export_config: MCPConfig;
  download_count: number;
  created_at: Date;
}

export interface MCPConfig {
  mcpServers: {
    [key: string]: {
      command: string;
      args: string[];
      env: {
        MORGY_ID: string;
        MORGY_API_KEY: string;
        MORGY_API_BASE?: string;
      };
    };
  };
}

// ============================================
// ANALYTICS
// ============================================

export interface MorgyAnalytics {
  id: string;
  morgy_id: string;
  date: Date;
  total_messages: number;
  total_conversations: number;
  unique_users: number;
  posts_created: number;
  posts_published: number;
  total_engagement: number;
  knowledge_queries: number;
  created_at: Date;
}

export interface Insights {
  totalPosts: number;
  totalEngagement: number;
  avgEngagement: number;
  bestPost: {
    content: string;
    engagement: number;
  };
  bestTimeToPost: string;
  recommendations: string[];
}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

export interface CreateMorgyRequest {
  name: string;
  description: string;
  personality: MorgyPersonality;
  avatar_config: MorgyAvatarConfig;
  skills: MorgySkills;
  category?: string;
  is_public?: boolean;
  price_cents?: number;
  license_type?: LicenseType;
}

export interface ChatRequest {
  morgy_id: string;
  conversation_id?: string;
  message: string;
  context?: Record<string, any>;
}

export interface ChatResponse {
  conversation_id: string;
  message_id: string;
  response: string;
  metadata?: Record<string, any>;
}

export interface UploadKnowledgeRequest {
  morgy_id: string;
  knowledge_base_name: string;
  sources: {
    type: SourceType;
    content: File | string;
    metadata?: Record<string, any>;
  }[];
}

export interface SearchKnowledgeRequest {
  knowledge_base_id: string;
  query: string;
  top_k?: number;
  threshold?: number;
}

export interface CreatePostRequest {
  morgy_id: string;
  social_account_id: string;
  prompt: string;
  platforms?: Platform[];
  scheduled_for?: Date;
  media_type?: 'none' | 'image' | 'video';
}

export interface PurchaseLicenseRequest {
  morgy_id: string;
  user_id: string;
  license_type: LicenseType;
}

export interface SubmitReviewRequest {
  morgy_id: string;
  user_id: string;
  rating: number;
  review_text?: string;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  priceRange?: { min: number; max: number };
  rating?: number;
  skills?: string[];
  licenseType?: LicenseType[];
  sortBy?: 'popular' | 'rating' | 'price_low' | 'price_high' | 'newest';
}

// ============================================
// MORGY CONTEXT
// ============================================

export interface MorgyContext {
  morgy: Morgy;
  user: {
    id: string;
    name?: string;
    email?: string;
  };
  conversation: Conversation;
  shortTermMemory: Message[];
  longTermMemory: Memory[];
  knowledgeBase?: KnowledgeChunk[];
}

// ============================================
// UTILITY TYPES
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];
