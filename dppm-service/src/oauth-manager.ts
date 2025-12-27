// @ts-nocheck
/**
 * OAuth Manager
 * Centralized OAuth 2.0 management for all platform integrations
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
}

export interface OAuthToken {
  access_token: string;
  refresh_token?: string;
  expires_at?: Date;
  scope?: string;
  token_type?: string;
}

export interface PlatformConnection {
  id: string;
  user_id: string;
  morgy_id?: string;
  platform: 'reddit' | 'gmail' | 'youtube' | 'twitter' | 'tiktok' | 'did' | 'luma';
  access_token: string;
  refresh_token?: string;
  expires_at?: Date;
  scopes: string[];
  platform_user_id?: string;
  platform_username?: string;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// PLATFORM OAUTH CONFIGS
// ============================================================================

export const PLATFORM_CONFIGS: Record<string, OAuthConfig> = {
  reddit: {
    clientId: process.env.REDDIT_CLIENT_ID || '',
    clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
    redirectUri: `${process.env.APP_URL}/api/oauth/reddit/callback`,
    scopes: ['identity', 'read', 'submit', 'vote', 'mysubreddits'],
    authUrl: 'https://www.reddit.com/api/v1/authorize',
    tokenUrl: 'https://www.reddit.com/api/v1/access_token',
  },
  
  gmail: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: `${process.env.APP_URL}/api/oauth/gmail/callback`,
    scopes: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
    ],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
  },
  
  youtube: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: `${process.env.APP_URL}/api/oauth/youtube/callback`,
    scopes: [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.force-ssl',
    ],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
  },
  
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID || '',
    clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
    redirectUri: `${process.env.APP_URL}/api/oauth/twitter/callback`,
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
  },
  
  tiktok: {
    clientId: process.env.TIKTOK_CLIENT_KEY || '',
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
    redirectUri: `${process.env.APP_URL}/api/oauth/tiktok/callback`,
    scopes: ['user.info.basic', 'video.list', 'video.upload'],
    authUrl: 'https://www.tiktok.com/v2/auth/authorize',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token',
  },
};

// ============================================================================
// OAUTH MANAGER
// ============================================================================

export class OAuthManager {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || ''
    );
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(
    platform: string,
    userId: string,
    morgyId?: string
  ): string {
    const config = PLATFORM_CONFIGS[platform];
    if (!config) {
      throw new Error(`Platform not supported: ${platform}`);
    }

    const state = this.generateState(userId, morgyId);
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state,
    });

    // Platform-specific parameters
    if (platform === 'reddit') {
      params.append('duration', 'permanent');
    }
    if (platform === 'gmail' || platform === 'youtube') {
      params.append('access_type', 'offline');
      params.append('prompt', 'consent');
    }
    if (platform === 'twitter') {
      params.append('code_challenge', 'challenge');
      params.append('code_challenge_method', 'plain');
    }

    return `${config.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCode(
    platform: string,
    code: string,
    state: string
  ): Promise<{ userId: string; morgyId?: string; token: OAuthToken }> {
    const config = PLATFORM_CONFIGS[platform];
    if (!config) {
      throw new Error(`Platform not supported: ${platform}`);
    }

    // Verify and decode state
    const { userId, morgyId } = this.decodeState(state);

    // Exchange code for token
    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
    });

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const data = await response.json();
    
    const token: OAuthToken = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_in 
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
      scope: data.scope,
      token_type: data.token_type,
    };

    return { userId, morgyId, token };
  }

  /**
   * Refresh access token
   */
  async refreshToken(platform: string, refreshToken: string): Promise<OAuthToken> {
    const config = PLATFORM_CONFIGS[platform];
    if (!config) {
      throw new Error(`Platform not supported: ${platform}`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    const data = await response.json();
    
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_at: data.expires_in 
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
      scope: data.scope,
      token_type: data.token_type,
    };
  }

  /**
   * Save platform connection
   */
  async saveConnection(
    userId: string,
    platform: string,
    token: OAuthToken,
    morgyId?: string,
    platformUserId?: string,
    platformUsername?: string
  ): Promise<PlatformConnection> {
    const { data, error } = await this.supabase
      .from('platform_connections')
      .upsert({
        user_id: userId,
        morgy_id: morgyId,
        platform,
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_at: token.expires_at?.toISOString(),
        scopes: token.scope?.split(' ') || [],
        platform_user_id: platformUserId,
        platform_username: platformUsername,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save connection: ${error.message}`);
    }

    return data;
  }

  /**
   * Get platform connection
   */
  async getConnection(
    userId: string,
    platform: string,
    morgyId?: string
  ): Promise<PlatformConnection | null> {
    let query = this.supabase
      .from('platform_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform);

    if (morgyId) {
      query = query.eq('morgy_id', morgyId);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get connection: ${error.message}`);
    }

    return data;
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidToken(
    userId: string,
    platform: string,
    morgyId?: string
  ): Promise<string> {
    const connection = await this.getConnection(userId, platform, morgyId);
    if (!connection) {
      throw new Error(`No connection found for ${platform}`);
    }

    // Check if token is expired
    if (connection.expires_at) {
      const expiresAt = new Date(connection.expires_at);
      const now = new Date();
      const bufferMinutes = 5; // Refresh 5 minutes before expiry

      if (expiresAt.getTime() - now.getTime() < bufferMinutes * 60 * 1000) {
        // Token expired or about to expire, refresh it
        if (!connection.refresh_token) {
          throw new Error(`Token expired and no refresh token available for ${platform}`);
        }

        const newToken = await this.refreshToken(platform, connection.refresh_token);
        await this.saveConnection(
          userId,
          platform,
          newToken,
          morgyId,
          connection.platform_user_id,
          connection.platform_username
        );

        return newToken.access_token;
      }
    }

    return connection.access_token;
  }

  /**
   * Delete platform connection
   */
  async deleteConnection(
    userId: string,
    platform: string,
    morgyId?: string
  ): Promise<void> {
    let query = this.supabase
      .from('platform_connections')
      .delete()
      .eq('user_id', userId)
      .eq('platform', platform);

    if (morgyId) {
      query = query.eq('morgy_id', morgyId);
    }

    const { error } = await query;

    if (error) {
      throw new Error(`Failed to delete connection: ${error.message}`);
    }
  }

  /**
   * Get all connections for user
   */
  async getUserConnections(userId: string): Promise<PlatformConnection[]> {
    const { data, error } = await this.supabase
      .from('platform_connections')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to get connections: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all connections for Morgy
   */
  async getMorgyConnections(morgyId: string): Promise<PlatformConnection[]> {
    const { data, error } = await this.supabase
      .from('platform_connections')
      .select('*')
      .eq('morgy_id', morgyId);

    if (error) {
      throw new Error(`Failed to get connections: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Generate state parameter (encodes userId and morgyId)
   */
  private generateState(userId: string, morgyId?: string): string {
    const data = { userId, morgyId, timestamp: Date.now() };
    return Buffer.from(JSON.stringify(data)).toString('base64url');
  }

  /**
   * Decode state parameter
   */
  private decodeState(state: string): { userId: string; morgyId?: string } {
    try {
      const data = JSON.parse(Buffer.from(state, 'base64url').toString());
      
      // Check timestamp (state valid for 10 minutes)
      const age = Date.now() - data.timestamp;
      if (age > 10 * 60 * 1000) {
        throw new Error('State expired');
      }

      return { userId: data.userId, morgyId: data.morgyId };
    } catch (error: any) {
      throw new Error(`Invalid state: ${error.message}`);
    }
  }
}
