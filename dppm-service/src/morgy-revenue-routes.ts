import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const router = Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover'
});

// Middleware to verify authentication
const requireAuth = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  (req as any).userId = req.headers['x-user-id'] || 'placeholder-user-id';
  next();
};

/**
 * GET /api/creators/:creatorId/revenue
 * Get creator's revenue breakdown
 */
router.get('/:creatorId/revenue', requireAuth, async (req: Request, res: Response) => {
  try {
    const { creatorId } = req.params;
    const userId = (req as any).userId;
    
    // Verify user is the creator or admin
    if (creatorId !== userId) {
      // TODO: Check if user is admin
      return res.status(403).json({ 
        success: false, 
        error: 'You do not have permission to view this revenue data' 
      });
    }
    
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const morgyId = req.query.morgyId as string;
    
    // Build query for purchases
    let query = supabase
      .from('morgy_purchases')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('payment_status', 'completed');
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    if (morgyId) {
      query = query.eq('morgy_id', morgyId);
    }
    
    const { data: purchases, error } = await query;
    
    if (error) {
      console.error('Error fetching revenue:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch revenue data' 
      });
    }
    
    // Calculate totals
    const totalRevenue = purchases.reduce((sum, p) => sum + parseFloat(p.price), 0);
    const platformFees = purchases.reduce((sum, p) => sum + parseFloat(p.platform_fee), 0);
    const netRevenue = purchases.reduce((sum, p) => sum + parseFloat(p.creator_revenue), 0);
    
    // Get paid out amount
    const { data: payouts } = await supabase
      .from('creator_payouts')
      .select('amount')
      .eq('creator_id', creatorId)
      .eq('status', 'paid');
    
    const paidOut = payouts?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
    const pendingPayout = netRevenue - paidOut;
    
    // Group by Morgy
    const morgyBreakdown: Record<string, any> = {};
    
    for (const purchase of purchases) {
      if (!morgyBreakdown[purchase.morgy_id]) {
        morgyBreakdown[purchase.morgy_id] = {
          morgyId: purchase.morgy_id,
          totalSales: 0,
          revenue: 0
        };
      }
      
      morgyBreakdown[purchase.morgy_id].totalSales += 1;
      morgyBreakdown[purchase.morgy_id].revenue += parseFloat(purchase.creator_revenue);
    }
    
    // Fetch Morgy names
    const morgyIds = Object.keys(morgyBreakdown);
    if (morgyIds.length > 0) {
      const { data: morgys } = await supabase
        .from('morgys')
        .select('id, name')
        .in('id', morgyIds);
      
      if (morgys) {
        for (const morgy of morgys) {
          if (morgyBreakdown[morgy.id]) {
            morgyBreakdown[morgy.id].morgyName = morgy.name;
          }
        }
      }
    }
    
    // Get recent transactions
    const recentTransactions = purchases
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        morgyId: p.morgy_id,
        buyerId: p.buyer_id,
        amount: parseFloat(p.price),
        creatorRevenue: parseFloat(p.creator_revenue),
        date: p.created_at
      }));
    
    res.json({
      success: true,
      revenue: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        platformFees: Math.round(platformFees * 100) / 100,
        netRevenue: Math.round(netRevenue * 100) / 100,
        pendingPayout: Math.round(pendingPayout * 100) / 100,
        paidOut: Math.round(paidOut * 100) / 100,
        breakdown: Object.values(morgyBreakdown),
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Error in GET /api/creators/:creatorId/revenue:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/creators/:creatorId/request-payout
 * Request a payout
 */
router.post('/:creatorId/request-payout', requireAuth, async (req: Request, res: Response) => {
  try {
    const { creatorId } = req.params;
    const userId = (req as any).userId;
    const { amount } = req.body;
    
    // Verify user is the creator
    if (creatorId !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'You do not have permission to request payouts for this creator' 
      });
    }
    
    // Validate amount
    const payoutAmount = parseFloat(amount);
    if (isNaN(payoutAmount) || payoutAmount < 50) {
      return res.status(400).json({ 
        success: false, 
        error: 'Minimum payout amount is $50' 
      });
    }
    
    // Calculate available balance
    const { data: purchases } = await supabase
      .from('morgy_purchases')
      .select('creator_revenue')
      .eq('creator_id', creatorId)
      .eq('payment_status', 'completed');
    
    const totalEarned = purchases?.reduce((sum, p) => sum + parseFloat(p.creator_revenue), 0) || 0;
    
    const { data: payouts } = await supabase
      .from('creator_payouts')
      .select('amount')
      .eq('creator_id', creatorId)
      .in('status', ['paid', 'processing', 'pending']);
    
    const totalPaidOrPending = payouts?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
    const availableBalance = totalEarned - totalPaidOrPending;
    
    if (payoutAmount > availableBalance) {
      return res.status(400).json({ 
        success: false, 
        error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}` 
      });
    }
    
    // TODO: Verify creator has Stripe Connect account
    // const stripeConnectAccountId = 'acct_placeholder';
    
    // Create payout record
    const { data: lastPayout } = await supabase
      .from('creator_payouts')
      .select('period_end')
      .eq('creator_id', creatorId)
      .order('period_end', { ascending: false })
      .limit(1)
      .single();
    
    const periodStart = lastPayout?.period_end ? new Date(lastPayout.period_end) : new Date(0);
    const periodEnd = new Date();
    
    const { data: payout, error: payoutError } = await supabase
      .from('creator_payouts')
      .insert([{
        creator_id: creatorId,
        amount: payoutAmount,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        status: 'pending'
      }])
      .select()
      .single();
    
    if (payoutError) {
      console.error('Error creating payout:', payoutError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create payout request' 
      });
    }
    
    // TODO: Initiate Stripe transfer
    // const transfer = await stripe.transfers.create({
    //   amount: Math.round(payoutAmount * 100),
    //   currency: 'usd',
    //   destination: stripeConnectAccountId,
    //   metadata: {
    //     payoutId: payout.id,
    //     creatorId
    //   }
    // });
    
    // Update payout with Stripe ID
    // await supabase
    //   .from('creator_payouts')
    //   .update({ 
    //     stripe_payout_id: transfer.id,
    //     status: 'processing'
    //   })
    //   .eq('id', payout.id);
    
    // TODO: Send confirmation email
    
    const estimatedArrival = new Date();
    estimatedArrival.setDate(estimatedArrival.getDate() + 3);
    
    res.json({
      success: true,
      payout: {
        id: payout.id,
        amount: parseFloat(payout.amount),
        status: payout.status,
        estimatedArrival: estimatedArrival.toISOString()
      }
    });
  } catch (error) {
    console.error('Error in POST /api/creators/:creatorId/request-payout:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/creators/:creatorId/payouts
 * Get payout history
 */
router.get('/:creatorId/payouts', requireAuth, async (req: Request, res: Response) => {
  try {
    const { creatorId } = req.params;
    const userId = (req as any).userId;
    
    // Verify user is the creator or admin
    if (creatorId !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'You do not have permission to view this payout data' 
      });
    }
    
    // Fetch payouts
    const { data: payouts, error } = await supabase
      .from('creator_payouts')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching payouts:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch payout history' 
      });
    }
    
    // Calculate summary
    const totalPaid = payouts
      ?.filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
    
    const pendingAmount = payouts
      ?.filter(p => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
    
    // Next payout date (1st of next month)
    const nextPayoutDate = new Date();
    nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1);
    nextPayoutDate.setDate(1);
    
    res.json({
      success: true,
      payouts: payouts?.map(p => ({
        id: p.id,
        amount: parseFloat(p.amount),
        periodStart: p.period_start,
        periodEnd: p.period_end,
        status: p.status,
        createdAt: p.created_at,
        paidAt: p.paid_at
      })),
      summary: {
        totalPaid: Math.round(totalPaid * 100) / 100,
        pendingAmount: Math.round(pendingAmount * 100) / 100,
        nextPayoutDate: nextPayoutDate.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Error in GET /api/creators/:creatorId/payouts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/morgys/:morgyId/analytics
 * Get Morgy analytics
 */
router.get('/:morgyId/analytics', requireAuth, async (req: Request, res: Response) => {
  try {
    const { morgyId } = req.params;
    const userId = (req as any).userId;
    
    // Verify user is the creator
    const { data: morgy, error: morgyError } = await supabase
      .from('morgys')
      .select('creator_id, name, total_purchases, total_revenue, rating, view_count')
      .eq('id', morgyId)
      .single();
    
    if (morgyError || !morgy) {
      return res.status(404).json({ 
        success: false, 
        error: 'Morgy not found' 
      });
    }
    
    if (morgy.creator_id !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'You do not have permission to view analytics for this Morgy' 
      });
    }
    
    const startDate = req.query.startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = req.query.endDate as string || new Date().toISOString().split('T')[0];
    
    // Fetch analytics data
    const { data: analytics, error: analyticsError } = await supabase
      .from('morgy_analytics')
      .select('*')
      .eq('morgy_id', morgyId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    
    if (analyticsError) {
      console.error('Error fetching analytics:', analyticsError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch analytics' 
      });
    }
    
    // Calculate summary
    const totalViews = analytics?.reduce((sum, a) => sum + a.views, 0) || 0;
    const totalPurchases = analytics?.reduce((sum, a) => sum + a.purchases, 0) || 0;
    const totalRevenue = analytics?.reduce((sum, a) => sum + parseFloat(a.revenue), 0) || 0;
    const conversionRate = totalViews > 0 ? (totalPurchases / totalViews) * 100 : 0;
    
    // Get top buyers
    const { data: topBuyers } = await supabase
      .from('morgy_purchases')
      .select('buyer_id, created_at')
      .eq('morgy_id', morgyId)
      .eq('payment_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);
    
    res.json({
      success: true,
      analytics: {
        summary: {
          totalViews,
          totalPurchases,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          avgRating: parseFloat(morgy.rating),
          conversionRate: Math.round(conversionRate * 100) / 100
        },
        timeSeries: analytics?.map(a => ({
          date: a.date,
          views: a.views,
          purchases: a.purchases,
          revenue: parseFloat(a.revenue)
        })),
        topBuyers: topBuyers?.map(b => ({
          userId: b.buyer_id,
          purchaseDate: b.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Error in GET /api/morgys/:morgyId/analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/creators/:creatorId/dashboard
 * Get creator dashboard stats
 */
router.get('/:creatorId/dashboard', requireAuth, async (req: Request, res: Response) => {
  try {
    const { creatorId } = req.params;
    const userId = (req as any).userId;
    
    // Verify user is the creator or admin
    if (creatorId !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'You do not have permission to view this dashboard' 
      });
    }
    
    // Get Morgy stats
    const { data: morgys } = await supabase
      .from('morgys')
      .select('id, name, is_public, total_purchases, total_revenue, rating')
      .eq('creator_id', creatorId)
      .eq('is_active', true);
    
    const totalMorgys = morgys?.length || 0;
    const publicMorgys = morgys?.filter(m => m.is_public).length || 0;
    const totalSales = morgys?.reduce((sum, m) => sum + m.total_purchases, 0) || 0;
    const totalRevenue = morgys?.reduce((sum, m) => sum + parseFloat(m.total_revenue), 0) || 0;
    const avgRating = morgys && morgys.length > 0
      ? morgys.reduce((sum, m) => sum + parseFloat(m.rating), 0) / morgys.length
      : 0;
    
    // Find top Morgy
    const topMorgy = morgys && morgys.length > 0
      ? morgys.reduce((top, m) => m.total_purchases > top.total_purchases ? m : top)
      : null;
    
    // Get recent activity
    const { data: recentPurchases } = await supabase
      .from('morgy_purchases')
      .select('id, morgy_id, buyer_id, price, created_at')
      .eq('creator_id', creatorId)
      .eq('payment_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5);
    
    res.json({
      success: true,
      dashboard: {
        totalMorgys,
        publicMorgys,
        totalSales,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgRating: Math.round(avgRating * 100) / 100,
        topMorgy: topMorgy ? {
          id: topMorgy.id,
          name: topMorgy.name,
          sales: topMorgy.total_purchases,
          revenue: parseFloat(topMorgy.total_revenue)
        } : null,
        recentActivity: recentPurchases?.map(p => ({
          id: p.id,
          morgyId: p.morgy_id,
          buyerId: p.buyer_id,
          amount: parseFloat(p.price),
          date: p.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Error in GET /api/creators/:creatorId/dashboard:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;
