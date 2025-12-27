/**
 * OAuth API Routes
 * Handles OAuth flows for all platform integrations
 */

import { Router } from 'express';
import { OAuthManager } from './oauth-manager';
import { requireAuth } from './auth-middleware';

const router = Router();
const oauthManager = new OAuthManager();

// ============================================================================
// OAUTH INITIATION ROUTES
// ============================================================================

/**
 * GET /api/oauth/:platform/connect
 * Initiate OAuth flow for a platform
 */
router.get('/:platform/connect', requireAuth, (req, res) => {
  try {
    const { platform } = req.params;
    const { morgyId } = req.query;
    const userId = req.user!.id;

    const authUrl = oauthManager.getAuthorizationUrl(
      platform,
      userId,
      morgyId as string | undefined
    );

    res.json({ authUrl });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// OAUTH CALLBACK ROUTES
// ============================================================================

/**
 * GET /api/oauth/:platform/callback
 * Handle OAuth callback from platform
 */
router.get('/:platform/callback', async (req, res) => {
  try {
    const { platform } = req.params;
    const { code, state, error, error_description } = req.query;

    // Check for OAuth errors
    if (error) {
      return res.redirect(
        `${process.env.APP_URL}/morgy-pen?error=${error}&description=${error_description || ''}`
      );
    }

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }

    // Exchange code for token
    const { userId, morgyId, token } = await oauthManager.exchangeCode(
      platform,
      code as string,
      state as string
    );

    // Get platform user info
    const { platformUserId, platformUsername } = await getPlatformUserInfo(
      platform,
      token.access_token
    );

    // Save connection
    await oauthManager.saveConnection(
      userId,
      platform,
      token,
      morgyId,
      platformUserId,
      platformUsername
    );

    // Redirect back to app
    const redirectUrl = morgyId
      ? `${process.env.APP_URL}/morgy-pen?morgy=${morgyId}&connected=${platform}`
      : `${process.env.APP_URL}/morgy-pen?connected=${platform}`;

    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    res.redirect(
      `${process.env.APP_URL}/morgy-pen?error=oauth_failed&description=${encodeURIComponent(error.message)}`
    );
  }
});

// ============================================================================
// CONNECTION MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/oauth/connections
 * Get all platform connections for user
 */
router.get('/connections', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const connections = await oauthManager.getUserConnections(userId);

    // Remove sensitive data
    const sanitized = connections.map(conn => ({
      id: conn.id,
      platform: conn.platform,
      morgy_id: conn.morgy_id,
      platform_username: conn.platform_username,
      scopes: conn.scopes,
      created_at: conn.created_at,
      updated_at: conn.updated_at,
    }));

    res.json({ connections: sanitized });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/oauth/morgys/:morgyId/connections
 * Get all platform connections for a Morgy
 */
router.get('/morgys/:morgyId/connections', requireAuth, async (req, res) => {
  try {
    const { morgyId } = req.params;
    const connections = await oauthManager.getMorgyConnections(morgyId);

    // Remove sensitive data
    const sanitized = connections.map(conn => ({
      id: conn.id,
      platform: conn.platform,
      platform_username: conn.platform_username,
      scopes: conn.scopes,
      created_at: conn.created_at,
      updated_at: conn.updated_at,
    }));

    res.json({ connections: sanitized });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/oauth/:platform/disconnect
 * Disconnect a platform
 */
router.delete('/:platform/disconnect', requireAuth, async (req, res) => {
  try {
    const { platform } = req.params;
    const { morgyId } = req.query;
    const userId = req.user!.id;

    await oauthManager.deleteConnection(
      userId,
      platform,
      morgyId as string | undefined
    );

    res.json({ success: true, message: `Disconnected from ${platform}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/oauth/:platform/status
 * Check if platform is connected
 */
router.get('/:platform/status', requireAuth, async (req, res) => {
  try {
    const { platform } = req.params;
    const { morgyId } = req.query;
    const userId = req.user!.id;

    const connection = await oauthManager.getConnection(
      userId,
      platform,
      morgyId as string | undefined
    );

    res.json({
      connected: !!connection,
      platform_username: connection?.platform_username,
      scopes: connection?.scopes || [],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get platform user info
 */
async function getPlatformUserInfo(
  platform: string,
  accessToken: string
): Promise<{ platformUserId: string; platformUsername: string }> {
  switch (platform) {
    case 'reddit':
      return getRedditUserInfo(accessToken);
    case 'gmail':
    case 'youtube':
      return getGoogleUserInfo(accessToken);
    case 'twitter':
      return getTwitterUserInfo(accessToken);
    case 'tiktok':
      return getTikTokUserInfo(accessToken);
    default:
      return { platformUserId: '', platformUsername: '' };
  }
}

async function getRedditUserInfo(accessToken: string) {
  const response = await fetch('https://oauth.reddit.com/api/v1/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'Morgus/1.0',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get Reddit user info');
  }

  const data = await response.json();
  return {
    platformUserId: data.id,
    platformUsername: data.name,
  };
}

async function getGoogleUserInfo(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get Google user info');
  }

  const data = await response.json();
  return {
    platformUserId: data.id,
    platformUsername: data.email,
  };
}

async function getTwitterUserInfo(accessToken: string) {
  const response = await fetch('https://api.twitter.com/2/users/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get Twitter user info');
  }

  const data = await response.json();
  return {
    platformUserId: data.data.id,
    platformUsername: data.data.username,
  };
}

async function getTikTokUserInfo(accessToken: string) {
  const response = await fetch('https://open.tiktokapis.com/v2/user/info/', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get TikTok user info');
  }

  const data = await response.json();
  return {
    platformUserId: data.data.user.open_id,
    platformUsername: data.data.user.display_name,
  };
}

export default router;
