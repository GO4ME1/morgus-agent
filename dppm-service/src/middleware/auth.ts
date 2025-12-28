/**
 * Authentication Middleware
 * 
 * Handles authentication via:
 * - Supabase JWT tokens (for frontend)
 * - API keys (for programmatic access)
 * 
 * Security features:
 * - JWT verification
 * - API key validation
 * - User session management
 * - Role-based access control (RBAC)
 */

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

/**
 * Extended Request interface with user info
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
  apiKey?: {
    id: string;
    scopes: string[];
  };
}

/**
 * Verify Supabase JWT token
 */
const verifyJWT = async (token: string): Promise<any> => {
  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Error verifying JWT:', error);
    return null;
  }
};

/**
 * Verify API key
 */
const verifyApiKey = async (apiKey: string): Promise<any> => {
  try {
    // Extract prefix
    const prefix = apiKey.substring(0, 13); // "morg_" + first 8 chars
    
    // Get API key from database
    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_prefix', prefix)
      .eq('is_active', true);
    
    if (error || !keys || keys.length === 0) {
      return null;
    }
    
    // In production, verify hash using bcrypt
    // For now, just check if key exists
    const validKey = keys[0];
    
    // Check expiration
    if (validKey.expires_at && new Date(validKey.expires_at) < new Date()) {
      return null;
    }
    
    // Update last_used_at (async)
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
    
    return {
      id: validKey.id,
      user_id: validKey.user_id,
      scopes: validKey.scopes
    };
    
  } catch (error) {
    console.error('Error verifying API key:', error);
    return null;
  }
};

/**
 * Authentication middleware (optional)
 * 
 * Attempts to authenticate but doesn't require it
 * Useful for endpoints that work for both authenticated and anonymous users
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for JWT token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Try to verify as JWT
      const user = await verifyJWT(token);
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role || 'user'
        };
        req.headers['x-user-id'] = user.id;
        return next();
      }
      
      // Try to verify as API key
      const apiKeyData = await verifyApiKey(token);
      if (apiKeyData) {
        req.user = {
          id: apiKeyData.user_id,
          role: 'api_user'
        };
        req.apiKey = {
          id: apiKeyData.id,
          scopes: apiKeyData.scopes
        };
        req.headers['x-user-id'] = apiKeyData.user_id;
        return next();
      }
    }
    
    // Check for API key in header
    const apiKey = req.headers['x-api-key'] as string;
    if (apiKey) {
      const apiKeyData = await verifyApiKey(apiKey);
      if (apiKeyData) {
        req.user = {
          id: apiKeyData.user_id,
          role: 'api_user'
        };
        req.apiKey = {
          id: apiKeyData.id,
          scopes: apiKeyData.scopes
        };
        req.headers['x-user-id'] = apiKeyData.user_id;
        return next();
      }
    }
    
    // No valid auth found, but that's okay for optional auth
    next();
    
  } catch (error) {
    console.error('Error in optional auth middleware:', error);
    next();
  }
};

/**
 * Authentication middleware (required)
 * 
 * Requires valid authentication
 */
export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for JWT token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Try to verify as JWT
      const user = await verifyJWT(token);
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role || 'user'
        };
        req.headers['x-user-id'] = user.id;
        return next();
      }
      
      // Try to verify as API key
      const apiKeyData = await verifyApiKey(token);
      if (apiKeyData) {
        req.user = {
          id: apiKeyData.user_id,
          role: 'api_user'
        };
        req.apiKey = {
          id: apiKeyData.id,
          scopes: apiKeyData.scopes
        };
        req.headers['x-user-id'] = apiKeyData.user_id;
        return next();
      }
    }
    
    // Check for API key in header
    const apiKey = req.headers['x-api-key'] as string;
    if (apiKey) {
      const apiKeyData = await verifyApiKey(apiKey);
      if (apiKeyData) {
        req.user = {
          id: apiKeyData.user_id,
          role: 'api_user'
        };
        req.apiKey = {
          id: apiKeyData.id,
          scopes: apiKeyData.scopes
        };
        req.headers['x-user-id'] = apiKeyData.user_id;
        return next();
      }
    }
    
    // No valid auth found
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Valid authentication required. Please provide a Bearer token or API key.'
    });
    
  } catch (error) {
    console.error('Error in require auth middleware:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

/**
 * Role-based access control middleware
 * 
 * Requires specific role(s)
 */
export const requireRole = (...roles: string[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role || 'user')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `This action requires one of the following roles: ${roles.join(', ')}`
      });
    }
    
    next();
  };
};

/**
 * Scope-based access control for API keys
 * 
 * Requires specific scope(s)
 */
export const requireScope = (...scopes: string[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    // If not using API key, allow (JWT users have full access)
    if (!req.apiKey) {
      return next();
    }
    
    // Check if API key has required scope
    const hasScope = scopes.some(scope => 
      req.apiKey!.scopes.includes(scope)
    );
    
    if (!hasScope) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `This action requires one of the following scopes: ${scopes.join(', ')}`
      });
    }
    
    next();
  };
};

/**
 * Admin middleware
 * 
 * Requires admin role
 */
export const requireAdmin = requireRole('admin', 'superadmin');

export default {
  optionalAuth,
  requireAuth,
  requireRole,
  requireScope,
  requireAdmin
};
