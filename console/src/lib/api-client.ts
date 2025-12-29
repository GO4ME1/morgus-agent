/**
 * API Client for Morgus Creator Economy
 */

import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'https://morgus-deploy.fly.dev';

/**
 * Get auth headers with JWT token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// ============================================
// KNOWLEDGE API
// ============================================

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  source_type: 'file' | 'website' | 'text';
  source_url?: string;
  chunks: number;
  created_at: string;
}

export interface KnowledgeTestResult {
  chunk: string;
  score: number;
  source: string;
}

export async function uploadKnowledge(morgyId: string, file: File): Promise<KnowledgeItem> {
  const formData = new FormData();
  formData.append('file', file);

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${API_BASE}/api/knowledge-base/${morgyId}/sources`, {
    method: 'POST',
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload knowledge');
  }

  const result = await response.json();
  return result.knowledge || result;
}

export async function scrapeWebsite(morgyId: string, url: string): Promise<KnowledgeItem> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/knowledge-base/${morgyId}/sources`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error('Failed to scrape website');
  }

  const result = await response.json();
  return result.knowledge || result;
}

export async function addTextKnowledge(morgyId: string, title: string, content: string): Promise<KnowledgeItem> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/knowledge-base/${morgyId}/sources`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text: content, title }),
  });

  if (!response.ok) {
    throw new Error('Failed to add text knowledge');
  }

  const result = await response.json();
  return result.knowledge || result;
}

export async function getKnowledge(morgyId: string): Promise<KnowledgeItem[]> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/knowledge-base/${morgyId}/sources`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to get knowledge');
  }

  const result = await response.json();
  return result.sources || result;
}

export async function deleteKnowledge(knowledgeId: string): Promise<void> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/knowledge-base/sources/${knowledgeId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to delete knowledge');
  }
}

export async function testKnowledge(morgyId: string, query: string): Promise<KnowledgeTestResult[]> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/knowledge/test`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ morgyId, query }),
  });

  if (!response.ok) {
    throw new Error('Failed to test knowledge');
  }

  return response.json();
}

// ============================================
// MARKETPLACE API
// ============================================

export interface MarketplaceListing {
  id: string;
  morgyId: string;
  creatorId: string;
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

export interface MarketplaceFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  sortBy?: string;
  search?: string;
}

export interface PurchaseResult {
  success: boolean;
  purchaseId: string;
  morgyId: string;
}

export async function createListing(morgyId: string, listing: Partial<MarketplaceListing>): Promise<MarketplaceListing> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/marketplace/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ morgyId, listing }),
  });

  if (!response.ok) {
    throw new Error('Failed to create listing');
  }

  return response.json();
}

export async function browseMarketplace(filters?: MarketplaceFilters): Promise<MarketplaceListing[]> {
  const params = new URLSearchParams(filters as Record<string, string>);

  const response = await fetch(`${API_BASE}/api/marketplace/browse?${params}`);

  if (!response.ok) {
    throw new Error('Failed to browse marketplace');
  }

  return response.json();
}

export async function purchaseMorgy(listingId: string): Promise<PurchaseResult> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/marketplace/purchase`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ listingId }),
  });

  if (!response.ok) {
    throw new Error('Failed to purchase Morgy');
  }

  return response.json();
}

export async function getMyListings(): Promise<MarketplaceListing[]> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/marketplace/my-listings`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to get my listings');
  }

  return response.json();
}

export interface CreatorAnalytics {
  totalSales: number;
  totalRevenue: number;
  topMorgys: Array<{ id: string; name: string; sales: number }>;
  recentSales: Array<{ date: string; amount: number }>;
}

export async function getCreatorAnalytics(): Promise<CreatorAnalytics> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/marketplace/analytics`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to get creator analytics');
  }

  return response.json();
}

// ============================================
// MCP EXPORT API
// ============================================

export interface MCPExportOptions {
  includeKnowledge: boolean;
  includeTemplates: boolean;
  shareWithTeam: boolean;
}

export interface MCPExportPackage {
  configJson: string;
  instructions: string;
  macInstaller: string;
  packageJson: string;
  serverCode: string;
  shareUrl?: string;
}

export interface MCPTestResult {
  success: boolean;
  message: string;
  tools: string[];
}

export async function exportToMCP(morgyId: string, options: MCPExportOptions): Promise<MCPExportPackage> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/mcp/export`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ morgyId, options }),
  });

  if (!response.ok) {
    throw new Error('Failed to export to MCP');
  }

  return response.json();
}

export async function getMCPConfig(morgyId: string, options: MCPExportOptions): Promise<string> {
  const headers = await getAuthHeaders();

  const params = new URLSearchParams({
    includeKnowledge: options.includeKnowledge.toString(),
    includeTemplates: options.includeTemplates.toString(),
  });

  const response = await fetch(`${API_BASE}/api/mcp/config/${morgyId}?${params}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to get MCP config');
  }

  return response.text();
}

export async function testMCP(morgyId: string): Promise<MCPTestResult> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/mcp/test`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ morgyId }),
  });

  if (!response.ok) {
    throw new Error('Failed to test MCP');
  }

  return response.json();
}

// ============================================
// MORGY API (Extended)
// ============================================

export interface AvatarConfig {
  style: string;
  backgroundColor: string;
  accessory?: string;
  expression?: string;
}

export interface MorgyConfig {
  name: string;
  description: string;
  category: string;
  personality: {
    energy: number;
    formality: number;
    humor: number;
    verbosity: number;
    emoji: number;
    systemPrompt?: string;
  };
  avatarConfig?: AvatarConfig;
  templates?: string[];
  workflows?: string[];
}

export interface Morgy extends MorgyConfig {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export async function createMorgy(config: MorgyConfig): Promise<Morgy> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/morgys`, {
    method: 'POST',
    headers,
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error('Failed to create Morgy');
  }

  return response.json();
}

export async function updateMorgy(morgyId: string, updates: Partial<MorgyConfig>): Promise<Morgy> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/morgys/${morgyId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update Morgy');
  }

  return response.json();
}

export async function getMorgy(morgyId: string): Promise<Morgy> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/morgys/${morgyId}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to get Morgy');
  }

  return response.json();
}

export async function getMyMorgys(): Promise<Morgy[]> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/morgys`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to get Morgys');
  }

  return response.json();
}


// ============================================
// API KEY MANAGEMENT
// ============================================

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
  status: 'active' | 'revoked' | 'expired';
}

export async function createApiKey(data: {
  user_id: string;
  name: string;
  scopes?: string[];
  expires_in_days?: number;
}): Promise<{ api_key: ApiKey & { key: string }; warning: string }> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/api-keys`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create API key');
  }

  return response.json();
}

export async function listApiKeys(userId: string): Promise<ApiKey[]> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/api-keys?user_id=${userId}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to list API keys');
  }

  const result = await response.json();
  return result.api_keys || [];
}

export async function updateApiKey(keyId: string, updates: {
  user_id: string;
  name?: string;
  scopes?: string[];
  is_active?: boolean;
}): Promise<ApiKey> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/api-keys/${keyId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update API key');
  }

  const result = await response.json();
  return result.api_key;
}

export async function revokeApiKey(keyId: string, userId: string): Promise<void> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/api-keys/${keyId}`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ user_id: userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to revoke API key');
  }
}

// ============================================
// BILLING API
// ============================================

export interface BillingInfo {
  subscription: {
    tier: string;
    status: string;
    current_period_end?: string;
  };
  usage: {
    credits_used: number;
    credits_limit: number;
    percentage: number;
  };
}

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
}

export async function getBillingInfo(): Promise<BillingInfo> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/billing/info`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to get billing info');
  }

  return response.json();
}

export async function getPricingTiers(): Promise<PricingTier[]> {
  const response = await fetch(`${API_BASE}/api/billing/pricing`);

  if (!response.ok) {
    throw new Error('Failed to get pricing tiers');
  }

  return response.json();
}

export async function createCheckoutSession(priceId: string): Promise<{ url: string }> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/billing/checkout`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ priceId }),
  });

  if (!response.ok) {
    throw new Error('Failed to create checkout session');
  }

  return response.json();
}

export async function createPortalSession(): Promise<{ url: string }> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/billing/portal`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to create portal session');
  }

  return response.json();
}

// ============================================
// ANALYTICS API
// ============================================

export interface UserAnalytics {
  totalTasks: number;
  completedTasks: number;
  creditsUsed: number;
  topTools: Array<{ name: string; count: number }>;
}

export interface PlatformAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalTasks: number;
  revenue: number;
}

export async function getUserAnalytics(userId: string): Promise<UserAnalytics> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/analytics/user/${userId}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to get user analytics');
  }

  return response.json();
}

export async function getPlatformAnalytics(): Promise<PlatformAnalytics> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/analytics/platform`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to get platform analytics');
  }

  return response.json();
}

// ============================================
// AXIOS-LIKE API CLIENT
// ============================================

interface ApiResponse<T> {
  data: T;
}

/**
 * Simple axios-like API client for components that need it
 */
export const apiClient = {
  async get<T = unknown>(url: string): Promise<ApiResponse<T>> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}${url}`, { headers });
    if (!response.ok) throw new Error(`GET ${url} failed`);
    return { data: await response.json() };
  },
  
  async post<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) throw new Error(`POST ${url} failed`);
    return { data: await response.json() };
  },
  
  async put<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) throw new Error(`PUT ${url} failed`);
    return { data: await response.json() };
  },
  
  async delete<T = unknown>(url: string): Promise<ApiResponse<T>> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error(`DELETE ${url} failed`);
    return { data: await response.json() };
  },
};
