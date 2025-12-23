// Promo Code and Day Pass Wallet API for Morgus
// Handles promo code redemption and day pass management

interface PromoEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface PromoCode {
  id: string;
  code: string;
  type: 'day_pass' | 'discount' | 'trial';
  value: number;
  max_uses: number;
  uses_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  description: string | null;
}

interface RedemptionResult {
  success: boolean;
  message: string;
  reward?: {
    type: string;
    value: number;
    description: string;
  };
}

export async function handlePromoAPI(request: Request, env: PromoEnv): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // POST /api/promo/redeem - Redeem a promo code
  if (path === '/api/promo/redeem' && request.method === 'POST') {
    try {
      const body = await request.json() as { userId: string; code: string };
      const result = await redeemPromoCode(env, body.userId, body.code);
      
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ success: false, message: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/promo/validate/:code - Validate a promo code without redeeming
  if (path.match(/^\/api\/promo\/validate\/[\w-]+$/) && request.method === 'GET') {
    const code = path.split('/').pop()!;
    
    try {
      const promoCode = await getPromoCode(env, code);
      
      if (!promoCode) {
        return new Response(JSON.stringify({ valid: false, message: 'Invalid promo code' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const now = new Date();
      const startsAt = new Date(promoCode.starts_at);
      const expiresAt = promoCode.expires_at ? new Date(promoCode.expires_at) : null;
      
      if (!promoCode.is_active) {
        return new Response(JSON.stringify({ valid: false, message: 'This promo code is no longer active' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (now < startsAt) {
        return new Response(JSON.stringify({ valid: false, message: 'This promo code is not yet active' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (expiresAt && now > expiresAt) {
        return new Response(JSON.stringify({ valid: false, message: 'This promo code has expired' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (promoCode.uses_count >= promoCode.max_uses) {
        return new Response(JSON.stringify({ valid: false, message: 'This promo code has reached its usage limit' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({
        valid: true,
        reward: {
          type: promoCode.reward_type,
          value: promoCode.reward_value,
          description: getRewardDescription(promoCode.reward_type, promoCode.reward_value),
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ valid: false, message: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/wallet/:userId - Get user's day pass wallet
  if (path.match(/^\/api\/wallet\/[\w-]+$/) && request.method === 'GET') {
    const userId = path.split('/').pop()!;
    
    try {
      const wallet = await getDayPassWallet(env, userId);
      return new Response(JSON.stringify(wallet), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/wallet/use - Use a day pass from wallet
  if (path === '/api/wallet/use' && request.method === 'POST') {
    try {
      const body = await request.json() as { userId: string };
      const result = await useDayPass(env, body.userId);
      
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ success: false, message: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Admin: POST /api/promo/create - Create a new promo code
  if (path === '/api/promo/create' && request.method === 'POST') {
    try {
      const body = await request.json() as {
        adminUserId: string;
        code: string;
        rewardType: 'day_pass' | 'morgy' | 'skin' | 'discount';
        rewardValue: number;
        maxUses?: number;
        maxUsesPerUser?: number;
        expiresAt?: string;
        description?: string;
      };
      
      // Verify admin status
      const isAdmin = await checkAdminStatus(env, body.adminUserId);
      if (!isAdmin) {
        return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const result = await createPromoCode(env, body);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ success: false, message: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Not Found', { status: 404, headers: corsHeaders });
}

// Helper functions

async function getPromoCode(env: PromoEnv, code: string): Promise<PromoCode | null> {
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/promo_codes?code=eq.${code.toUpperCase()}`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  
  const codes = await response.json() as PromoCode[];
  return codes.length > 0 ? codes[0] : null;
}

async function redeemPromoCode(env: PromoEnv, userId: string, code: string): Promise<RedemptionResult> {
  const promoCode = await getPromoCode(env, code);
  
  if (!promoCode) {
    return { success: false, message: 'Invalid promo code' };
  }
  
  const now = new Date();
  const startsAt = new Date(promoCode.starts_at);
  const expiresAt = promoCode.expires_at ? new Date(promoCode.expires_at) : null;
  
  // Validate promo code
  if (!promoCode.is_active) {
    return { success: false, message: 'This promo code is no longer active' };
  }
  
  if (now < startsAt) {
    return { success: false, message: 'This promo code is not yet active' };
  }
  
  if (expiresAt && now > expiresAt) {
    return { success: false, message: 'This promo code has expired' };
  }
  
  if (promoCode.uses_count >= promoCode.max_uses) {
    return { success: false, message: 'This promo code has reached its usage limit' };
  }
  
  // Check if user already redeemed this code
  const redemptionCheck = await fetch(
    `${env.SUPABASE_URL}/rest/v1/promo_redemptions?user_id=eq.${userId}&promo_code_id=eq.${promoCode.id}`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  
  const existingRedemptions = await redemptionCheck.json() as any[];
  if (existingRedemptions.length >= promoCode.max_uses_per_user) {
    return { success: false, message: 'You have already redeemed this promo code' };
  }
  
  // Apply reward based on type
  switch (promoCode.reward_type) {
    case 'day_pass':
      await addDayPasses(env, userId, promoCode.reward_value);
      break;
    // Add other reward types as needed
  }
  
  // Record redemption
  await fetch(
    `${env.SUPABASE_URL}/rest/v1/promo_redemptions`,
    {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        user_id: userId,
        promo_code_id: promoCode.id,
      }),
    }
  );
  
  // Increment uses count
  await fetch(
    `${env.SUPABASE_URL}/rest/v1/promo_codes?id=eq.${promoCode.id}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        uses_count: promoCode.uses_count + 1,
      }),
    }
  );
  
  return {
    success: true,
    message: 'Promo code redeemed successfully!',
    reward: {
      type: promoCode.reward_type,
      value: promoCode.reward_value,
      description: getRewardDescription(promoCode.reward_type, promoCode.reward_value),
    },
  };
}

async function addDayPasses(env: PromoEnv, userId: string, count: number): Promise<void> {
  // Get current balance
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=day_pass_balance`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  
  const profiles = await response.json() as any[];
  const currentBalance = profiles[0]?.day_pass_balance || 0;
  const newBalance = Math.min(currentBalance + count, 3); // Max 3 day passes
  
  await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        day_pass_balance: newBalance,
      }),
    }
  );
}

async function getDayPassWallet(env: PromoEnv, userId: string): Promise<{ balance: number; expiresAt: string | null }> {
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=day_pass_balance,day_pass_expires_at`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  
  const profiles = await response.json() as any[];
  
  if (!profiles.length) {
    return { balance: 0, expiresAt: null };
  }
  
  return {
    balance: profiles[0].day_pass_balance || 0,
    expiresAt: profiles[0].day_pass_expires_at,
  };
}

async function useDayPass(env: PromoEnv, userId: string): Promise<{ success: boolean; message: string; expiresAt?: string }> {
  const wallet = await getDayPassWallet(env, userId);
  
  if (wallet.balance <= 0) {
    return { success: false, message: 'No day passes available' };
  }
  
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        day_pass_balance: wallet.balance - 1,
        day_pass_expires_at: expiresAt.toISOString(),
        subscription_status: 'daily',
        subscription_tier: 'daily',
        subscription_ends_at: expiresAt.toISOString(),
      }),
    }
  );
  
  return {
    success: true,
    message: 'Day pass activated! You have 24 hours of full access.',
    expiresAt: expiresAt.toISOString(),
  };
}

async function checkAdminStatus(env: PromoEnv, userId: string): Promise<boolean> {
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=is_admin`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  
  const profiles = await response.json() as any[];
  return profiles.length > 0 && profiles[0].is_admin === true;
}

async function createPromoCode(env: PromoEnv, data: {
  adminUserId: string;
  code: string;
  rewardType: 'day_pass' | 'morgy' | 'skin' | 'discount';
  rewardValue: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  expiresAt?: string;
  description?: string;
}): Promise<{ success: boolean; promoCode?: PromoCode; message?: string }> {
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/promo_codes`,
    {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        code: data.code.toUpperCase(),
        reward_type: data.rewardType,
        reward_value: data.rewardValue,
        max_uses: data.maxUses || 1000,
        max_uses_per_user: data.maxUsesPerUser || 1,
        expires_at: data.expiresAt || null,
        description: data.description || null,
        created_by: data.adminUserId,
      }),
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    return { success: false, message: error };
  }
  
  const codes = await response.json() as PromoCode[];
  return { success: true, promoCode: codes[0] };
}

function getRewardDescription(type: string, value: number): string {
  switch (type) {
    case 'day_pass':
      return `${value} free day pass${value > 1 ? 'es' : ''}`;
    case 'morgy':
      return `Unlock a new Morgy companion`;
    case 'skin':
      return `Unlock a new Morgy skin`;
    case 'discount':
      return `${value}% off your next purchase`;
    default:
      return 'Special reward';
  }
}
