// Referral System API for Morgus
// Handles referral tracking, rewards, and leaderboards

interface ReferralEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Referral rewards configuration
const REFERRAL_REWARDS = {
  referrer: {
    type: 'day_pass',
    value: 1,
    description: '1 free day pass for each successful referral',
  },
  referee: {
    type: 'day_pass',
    value: 1,
    description: '1 free day pass for signing up with a referral',
  },
  milestone_5: {
    type: 'morgy',
    value: 1,
    description: 'Unlock a special Morgy at 5 referrals',
  },
  milestone_10: {
    type: 'skin',
    value: 1,
    description: 'Unlock an exclusive skin at 10 referrals',
  },
  milestone_25: {
    type: 'day_pass',
    value: 7,
    description: '7 free day passes at 25 referrals',
  },
};

export async function handleReferralAPI(request: Request, env: ReferralEnv): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // GET /api/referral/:userId - Get user's referral info
  if (path.match(/^\/api\/referral\/[\w-]+$/) && request.method === 'GET') {
    const userId = path.split('/').pop()!;
    
    try {
      const referralInfo = await getReferralInfo(env, userId);
      return new Response(JSON.stringify(referralInfo), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/referral/track - Track a referral (called on signup)
  if (path === '/api/referral/track' && request.method === 'POST') {
    try {
      const body = await request.json() as { refereeId: string; referralCode: string };
      const result = await trackReferral(env, body.refereeId, body.referralCode);
      
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

  // POST /api/referral/complete - Complete a referral (when referee makes first action)
  if (path === '/api/referral/complete' && request.method === 'POST') {
    try {
      const body = await request.json() as { refereeId: string };
      const result = await completeReferral(env, body.refereeId);
      
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

  // GET /api/referral/leaderboard - Get referral leaderboard
  if (path === '/api/referral/leaderboard' && request.method === 'GET') {
    try {
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const leaderboard = await getReferralLeaderboard(env, limit);
      
      return new Response(JSON.stringify(leaderboard), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/referral/validate/:code - Validate a referral code
  if (path.match(/^\/api\/referral\/validate\/[\w-]+$/) && request.method === 'GET') {
    const code = path.split('/').pop()!;
    
    try {
      const result = await validateReferralCode(env, code);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ valid: false, message: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Not Found', { status: 404, headers: corsHeaders });
}

// Helper functions

async function getReferralInfo(env: ReferralEnv, userId: string): Promise<{
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  rewards: { type: string; value: number; description: string }[];
  nextMilestone: { count: number; reward: string } | null;
}> {
  // Get user's referral code
  const profileResponse = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=referral_code`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  
  const profiles = await profileResponse.json() as any[];
  const referralCode = profiles[0]?.referral_code || '';
  
  // Get referral stats
  const referralsResponse = await fetch(
    `${env.SUPABASE_URL}/rest/v1/referrals?referrer_id=eq.${userId}&select=status`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  
  const referrals = await referralsResponse.json() as any[];
  const completedReferrals = referrals.filter(r => r.status === 'completed').length;
  const pendingReferrals = referrals.filter(r => r.status === 'pending').length;
  
  // Calculate rewards earned
  const rewards: { type: string; value: number; description: string }[] = [];
  
  // Day passes from referrals
  if (completedReferrals > 0) {
    rewards.push({
      type: 'day_pass',
      value: completedReferrals,
      description: `${completedReferrals} day pass${completedReferrals > 1 ? 'es' : ''} from referrals`,
    });
  }
  
  // Milestone rewards
  if (completedReferrals >= 5) {
    rewards.push(REFERRAL_REWARDS.milestone_5);
  }
  if (completedReferrals >= 10) {
    rewards.push(REFERRAL_REWARDS.milestone_10);
  }
  if (completedReferrals >= 25) {
    rewards.push(REFERRAL_REWARDS.milestone_25);
  }
  
  // Calculate next milestone
  let nextMilestone: { count: number; reward: string } | null = null;
  if (completedReferrals < 5) {
    nextMilestone = { count: 5, reward: REFERRAL_REWARDS.milestone_5.description };
  } else if (completedReferrals < 10) {
    nextMilestone = { count: 10, reward: REFERRAL_REWARDS.milestone_10.description };
  } else if (completedReferrals < 25) {
    nextMilestone = { count: 25, reward: REFERRAL_REWARDS.milestone_25.description };
  }
  
  return {
    referralCode,
    referralLink: `https://morgus.ai?ref=${referralCode}`,
    totalReferrals: referrals.length,
    completedReferrals,
    pendingReferrals,
    rewards,
    nextMilestone,
  };
}

async function trackReferral(env: ReferralEnv, refereeId: string, referralCode: string): Promise<{
  success: boolean;
  message: string;
  reward?: { type: string; value: number; description: string };
}> {
  // Find referrer by code
  const referrerResponse = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?referral_code=eq.${referralCode}&select=id`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  
  const referrers = await referrerResponse.json() as any[];
  
  if (!referrers.length) {
    return { success: false, message: 'Invalid referral code' };
  }
  
  const referrerId = referrers[0].id;
  
  // Can't refer yourself
  if (referrerId === refereeId) {
    return { success: false, message: 'You cannot refer yourself' };
  }
  
  // Check if already referred
  const existingResponse = await fetch(
    `${env.SUPABASE_URL}/rest/v1/referrals?referee_id=eq.${refereeId}`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  
  const existing = await existingResponse.json() as any[];
  if (existing.length > 0) {
    return { success: false, message: 'You have already been referred' };
  }
  
  // Create referral record
  await fetch(
    `${env.SUPABASE_URL}/rest/v1/referrals`,
    {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        referrer_id: referrerId,
        referee_id: refereeId,
        status: 'pending',
      }),
    }
  );
  
  // Update referee's referred_by field
  await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${refereeId}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        referred_by: referrerId,
      }),
    }
  );
  
  // Give referee their welcome reward (1 day pass)
  await addDayPasses(env, refereeId, REFERRAL_REWARDS.referee.value);
  
  return {
    success: true,
    message: 'Referral tracked! You received a free day pass.',
    reward: REFERRAL_REWARDS.referee,
  };
}

async function completeReferral(env: ReferralEnv, refereeId: string): Promise<{
  success: boolean;
  message: string;
}> {
  // Find pending referral
  const referralResponse = await fetch(
    `${env.SUPABASE_URL}/rest/v1/referrals?referee_id=eq.${refereeId}&status=eq.pending&select=id,referrer_id`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  
  const referrals = await referralResponse.json() as any[];
  
  if (!referrals.length) {
    return { success: false, message: 'No pending referral found' };
  }
  
  const referral = referrals[0];
  
  // Mark referral as completed
  await fetch(
    `${env.SUPABASE_URL}/rest/v1/referrals?id=eq.${referral.id}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        status: 'completed',
        completed_at: new Date().toISOString(),
      }),
    }
  );
  
  // Give referrer their reward (1 day pass)
  await addDayPasses(env, referral.referrer_id, REFERRAL_REWARDS.referrer.value);
  
  // Check for milestone rewards
  await checkAndAwardMilestones(env, referral.referrer_id);
  
  return {
    success: true,
    message: 'Referral completed! Referrer has been rewarded.',
  };
}

async function getReferralLeaderboard(env: ReferralEnv, limit: number): Promise<{
  leaderboard: { rank: number; displayName: string; referralCount: number }[];
}> {
  // Get top referrers
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/referrals?status=eq.completed&select=referrer_id`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  
  const referrals = await response.json() as any[];
  
  // Count referrals per user
  const counts: Record<string, number> = {};
  for (const r of referrals) {
    counts[r.referrer_id] = (counts[r.referrer_id] || 0) + 1;
  }
  
  // Sort and get top users
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  
  // Get display names
  const userIds = sorted.map(([id]) => id);
  const profilesResponse = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=in.(${userIds.join(',')})&select=id,display_name,email`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  
  const profiles = await profilesResponse.json() as any[];
  const profileMap = new Map(profiles.map(p => [p.id, p]));
  
  const leaderboard = sorted.map(([userId, count], index) => {
    const profile = profileMap.get(userId);
    const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'Anonymous';
    return {
      rank: index + 1,
      displayName: displayName.substring(0, 2) + '***', // Privacy
      referralCount: count,
    };
  });
  
  return { leaderboard };
}

async function validateReferralCode(env: ReferralEnv, code: string): Promise<{
  valid: boolean;
  message?: string;
}> {
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?referral_code=eq.${code}&select=id,display_name`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  
  const profiles = await response.json() as any[];
  
  if (!profiles.length) {
    return { valid: false, message: 'Invalid referral code' };
  }
  
  return { valid: true };
}

async function addDayPasses(env: ReferralEnv, userId: string, count: number): Promise<void> {
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
  const newBalance = Math.min(currentBalance + count, 30); // Max 30 day passes from referrals
  
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

async function checkAndAwardMilestones(env: ReferralEnv, userId: string): Promise<void> {
  // Get completed referral count
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/referrals?referrer_id=eq.${userId}&status=eq.completed`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  
  const referrals = await response.json() as any[];
  const count = referrals.length;
  
  // Check milestones (in a real app, track which milestones have been awarded)
  // For now, this is simplified
  if (count === 5 || count === 10 || count === 25) {
    // Award milestone reward
    console.log(`User ${userId} reached ${count} referrals milestone!`);
    // In production, you'd track awarded milestones and give appropriate rewards
  }
}
