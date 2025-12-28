import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const router = Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

/**
 * API Key Management Routes
 * 
 * Security features:
 * - API keys are hashed with bcrypt (never stored in plaintext)
 * - Key prefix for identification without exposing full key
 * - Scoped permissions
 * - Expiration support
 * - Active/inactive toggle
 * - Rate limiting per key
 */

/**
 * Generate API key
 * Format: morg_<32 random bytes in hex>
 */
const generateApiKey = (): { key: string; prefix: string } => {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const key = `morg_${randomBytes}`;
  const prefix = `morg_${randomBytes.substring(0, 8)}`;
  return { key, prefix };
};

/**
 * Hash API key using bcrypt
 */
const hashApiKey = async (key: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(key, saltRounds);
};

/**
 * Verify API key against hash
 */
const verifyApiKey = async (key: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(key, hash);
};

/**
 * POST /api/api-keys
 * Generate new API key
 * 
 * Security:
 * - Returns full key only once (on creation)
 * - Stores hashed version
 * - Validates scopes
 * - Enforces key limits per user
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, name, scopes = [], expires_in_days } = req.body;
    
    // Validate required fields
    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Name is required and must be a non-empty string'
      });
    }
    
    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Name must be less than 100 characters'
      });
    }
    
    // Validate scopes
    const validScopes = [
      'morgys:read',
      'morgys:write',
      'morgys:delete',
      'marketplace:read',
      'marketplace:purchase',
      'analytics:read',
      'knowledge:read',
      'knowledge:write',
      'mcp:export'
    ];
    
    if (scopes && !Array.isArray(scopes)) {
      return res.status(400).json({
        success: false,
        error: 'Scopes must be an array'
      });
    }
    
    const invalidScopes = scopes.filter((s: string) => !validScopes.includes(s));
    if (invalidScopes.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid scopes: ${invalidScopes.join(', ')}`,
        valid_scopes: validScopes
      });
    }
    
    // Check user's existing key count (limit to 10 per user for stability)
    const { data: existingKeys, error: countError } = await supabase
      .from('api_keys')
      .select('id')
      .eq('user_id', user_id)
      .eq('is_active', true);
    
    if (countError) {
      console.error('Error counting API keys:', countError);
      return res.status(500).json({
        success: false,
        error: 'Failed to check existing keys'
      });
    }
    
    if (existingKeys && existingKeys.length >= 10) {
      return res.status(429).json({
        success: false,
        error: 'Maximum number of API keys reached (10). Please delete some keys first.'
      });
    }
    
    // Generate API key
    const { key, prefix } = generateApiKey();
    
    // Hash the key
    const keyHash = await hashApiKey(key);
    
    // Calculate expiration
    let expiresAt = null;
    if (expires_in_days && typeof expires_in_days === 'number' && expires_in_days > 0) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expires_in_days);
      expiresAt = expirationDate.toISOString();
    }
    
    // Insert API key
    const { data: apiKey, error: insertError } = await supabase
      .from('api_keys')
      .insert({
        user_id,
        name: name.trim(),
        key_prefix: prefix,
        key_hash: keyHash,
        scopes: scopes || [],
        is_active: true,
        expires_at: expiresAt
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating API key:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create API key'
      });
    }
    
    // Return full key (only time it's shown)
    res.status(201).json({
      success: true,
      api_key: {
        ...apiKey,
        key // Full key returned only once
      },
      warning: 'Save this API key now. You will not be able to see it again!',
      usage: {
        header: 'Authorization: Bearer <your_api_key>',
        example: `curl -H "Authorization: Bearer ${key}" https://morgus-deploy.fly.dev/api/morgys`
      }
    });
    
  } catch (error) {
    console.error('Error in POST /api-keys:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/api-keys
 * List user's API keys
 * 
 * Security:
 * - Returns only key metadata (not the actual key)
 * - Filters by user_id
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    // Get user's API keys (exclude key_hash for security)
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('id, user_id, name, key_prefix, scopes, is_active, last_used_at, expires_at, created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching API keys:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch API keys'
      });
    }
    
    // Add status for each key
    const keysWithStatus = (apiKeys || []).map(key => {
      let status = 'active';
      
      if (!key.is_active) {
        status = 'revoked';
      } else if (key.expires_at && new Date(key.expires_at) < new Date()) {
        status = 'expired';
      }
      
      return {
        ...key,
        status
      };
    });
    
    res.json({
      success: true,
      api_keys: keysWithStatus,
      total: keysWithStatus.length
    });
    
  } catch (error) {
    console.error('Error in GET /api-keys:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/api-keys/:keyId
 * Get specific API key details
 * 
 * Security:
 * - Validates ownership
 * - Excludes key_hash
 */
router.get('/:keyId', async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    const { user_id } = req.query;
    
    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(keyId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid key ID format'
      });
    }
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    // Get API key
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .select('id, user_id, name, key_prefix, scopes, is_active, last_used_at, expires_at, created_at')
      .eq('id', keyId)
      .eq('user_id', user_id)
      .single();
    
    if (error || !apiKey) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }
    
    // Add status
    let status = 'active';
    if (!apiKey.is_active) {
      status = 'revoked';
    } else if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      status = 'expired';
    }
    
    res.json({
      success: true,
      api_key: {
        ...apiKey,
        status
      }
    });
    
  } catch (error) {
    console.error('Error in GET /api-keys/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/api-keys/:keyId
 * Update API key (name, scopes, active status)
 * 
 * Security:
 * - Validates ownership
 * - Cannot update key itself (immutable)
 */
router.put('/:keyId', async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    const { user_id, name, scopes, is_active } = req.body;
    
    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(keyId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid key ID format'
      });
    }
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    // Check if key exists and user owns it
    const { data: existing, error: existingError } = await supabase
      .from('api_keys')
      .select('id')
      .eq('id', keyId)
      .eq('user_id', user_id)
      .single();
    
    if (existingError || !existing) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }
    
    // Build update object
    const updates: any = {};
    
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Name must be a non-empty string'
        });
      }
      updates.name = name.trim();
    }
    
    if (scopes !== undefined) {
      if (!Array.isArray(scopes)) {
        return res.status(400).json({
          success: false,
          error: 'Scopes must be an array'
        });
      }
      updates.scopes = scopes;
    }
    
    if (is_active !== undefined) {
      if (typeof is_active !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'is_active must be a boolean'
        });
      }
      updates.is_active = is_active;
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }
    
    // Update API key
    const { data: apiKey, error: updateError } = await supabase
      .from('api_keys')
      .update(updates)
      .eq('id', keyId)
      .eq('user_id', user_id)
      .select('id, user_id, name, key_prefix, scopes, is_active, last_used_at, expires_at, created_at')
      .single();
    
    if (updateError) {
      console.error('Error updating API key:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update API key'
      });
    }
    
    res.json({
      success: true,
      api_key: apiKey
    });
    
  } catch (error) {
    console.error('Error in PUT /api-keys/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/api-keys/:keyId
 * Revoke (soft delete) API key
 * 
 * Security:
 * - Validates ownership
 * - Sets is_active to false (soft delete for audit trail)
 */
router.delete('/:keyId', async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    const { user_id } = req.body;
    
    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(keyId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid key ID format'
      });
    }
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    // Check if key exists and user owns it
    const { data: existing, error: existingError } = await supabase
      .from('api_keys')
      .select('id')
      .eq('id', keyId)
      .eq('user_id', user_id)
      .single();
    
    if (existingError || !existing) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }
    
    // Soft delete (set is_active to false)
    const { error: updateError } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId)
      .eq('user_id', user_id);
    
    if (updateError) {
      console.error('Error revoking API key:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to revoke API key'
      });
    }
    
    res.json({
      success: true,
      message: 'API key revoked successfully'
    });
    
  } catch (error) {
    console.error('Error in DELETE /api-keys/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/api-keys/verify
 * Verify an API key (for authentication middleware)
 * 
 * Security:
 * - Checks if key is valid, active, and not expired
 * - Updates last_used_at timestamp
 * - Returns user_id and scopes for authorization
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { api_key } = req.body;
    
    if (!api_key || typeof api_key !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'API key is required'
      });
    }
    
    // Extract prefix from key
    const prefix = api_key.substring(0, 13); // "morg_" + first 8 chars
    
    // Get all keys with this prefix
    const { data: keys, error: keysError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_prefix', prefix)
      .eq('is_active', true);
    
    if (keysError || !keys || keys.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }
    
    // Verify key against hashes
    let validKey = null;
    for (const key of keys) {
      const isValid = await verifyApiKey(api_key, key.key_hash);
      if (isValid) {
        validKey = key;
        break;
      }
    }
    
    if (!validKey) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }
    
    // Check expiration
    if (validKey.expires_at && new Date(validKey.expires_at) < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'API key has expired'
      });
    }
    
    // Update last_used_at (async, don't wait)
    (async () => {
      try {
        await supabase
          .from('api_keys')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', validKey.id);
      } catch (err) {
        console.error('Error updating last_used_at:', err);
      }
    })();
    
    res.json({
      success: true,
      user_id: validKey.user_id,
      scopes: validKey.scopes,
      key_id: validKey.id
    });
    
  } catch (error) {
    console.error('Error in POST /api-keys/verify:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
