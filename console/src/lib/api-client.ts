/**
 * API Client for Morgus Creator Economy
 */

import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Get auth headers with user ID
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { user } } = await supabase.auth.getUser();
  
  return {
    'Content-Type': 'application/json',
    'x-user-id': user?.id || '',
  };
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

export async function uploadKnowledge(morgyId: string, file: File): Promise<KnowledgeItem> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('morgyId', morgyId);

  const { data: { user } } = await supabase.auth.getUser();

  const response = await fetch(`${API_BASE}/api/knowledge/upload`, {
    method: 'POST',
    headers: {
      'x-user-id': user?.id || '',
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload knowledge');
  }

  return response.json();
}

export async function scrapeWebsite(morgyId: string, url: string): Promise<KnowledgeItem> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/knowledge/scrape`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ morgyId, url }),
  });

  if (!response.ok) {
    throw new Error('Failed to scrape website');
  }

  return response.json();
}

export async function addTextKnowledge(morgyId: string, title: string, content: string): Promise<KnowledgeItem> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/knowledge/text`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ morgyId, title, content }),
  });

  if (!response.ok) {
    throw new Error('Failed to add text knowledge');
  }

  return response.json();
}

export async function getKnowledge(morgyId: string): Promise<KnowledgeItem[]> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/knowledge/${morgyId}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to get knowledge');
  }

  return response.json();
}

export async function deleteKnowledge(knowledgeId: string): Promise<void> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/knowledge/${knowledgeId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to delete knowledge');
  }
}

export async function testKnowledge(morgyId: string, query: string): Promise<any[]> {
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

export async function browseMarketplace(filters?: any): Promise<any[]> {
  const params = new URLSearchParams(filters);

  const response = await fetch(`${API_BASE}/api/marketplace/browse?${params}`);

  if (!response.ok) {
    throw new Error('Failed to browse marketplace');
  }

  return response.json();
}

export async function purchaseMorgy(listingId: string): Promise<any> {
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

export async function getCreatorAnalytics(): Promise<any> {
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

export async function testMCP(morgyId: string): Promise<any> {
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
  avatarConfig?: any;
  templates?: string[];
  workflows?: string[];
}

export async function createMorgy(config: MorgyConfig): Promise<any> {
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

export async function updateMorgy(morgyId: string, updates: Partial<MorgyConfig>): Promise<any> {
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

export async function getMorgy(morgyId: string): Promise<any> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/morgys/${morgyId}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to get Morgy');
  }

  return response.json();
}

export async function getMyMorgys(): Promise<any[]> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE}/api/morgys`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to get Morgys');
  }

  return response.json();
}
