// @ts-nocheck
/**
 * Analytics API Routes
 * Provides metrics, dashboards, and insights
 */

import { Router } from 'express';
import { analyticsService } from './analytics-service';
import { authMiddleware, adminMiddleware } from './auth-middleware';

const router = Router();

/**
 * GET /api/analytics/platform
 * Get platform-wide metrics (admin only)
 */
router.get('/platform', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { timeRange } = req.query;
    const metrics = await analyticsService.getPlatformMetrics(
      timeRange as '24h' | '7d' | '30d' | 'all'
    );

    res.json(metrics);
  } catch (error) {
    console.error('Error getting platform metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/analytics/user
 * Get user-specific analytics
 */
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { timeRange } = req.query;
    const analytics = await analyticsService.getUserAnalytics(
      userId,
      timeRange as '24h' | '7d' | '30d' | 'all'
    );

    res.json(analytics);
  } catch (error) {
    console.error('Error getting user analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/analytics/revenue
 * Get revenue analytics (admin only)
 */
router.get('/revenue', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { timeRange } = req.query;
    const revenue = await analyticsService.getRevenueAnalytics(
      timeRange as '24h' | '7d' | '30d' | 'all'
    );

    res.json(revenue);
  } catch (error) {
    console.error('Error getting revenue analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/analytics/performance
 * Get system performance metrics (admin only)
 */
router.get('/performance', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { timeRange } = req.query;
    const performance = await analyticsService.getPerformanceMetrics(
      timeRange as '24h' | '7d' | '30d' | 'all'
    );

    res.json(performance);
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/analytics/retention
 * Get user retention metrics (admin only)
 */
router.get('/retention', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const retention = await analyticsService.getRetentionMetrics();
    res.json(retention);
  } catch (error) {
    console.error('Error getting retention metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/analytics/dashboard
 * Get complete dashboard data for user
 */
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [userAnalytics, billingInfo] = await Promise.all([
      analyticsService.getUserAnalytics(userId, '30d'),
      (async () => {
        const { billingService } = await import('./billing-service');
        return billingService.getBillingInfo(userId);
      })(),
    ]);

    res.json({
      analytics: userAnalytics,
      billing: billingInfo
    });
  } catch (error) {
    console.error('Error getting dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/analytics/admin-dashboard
 * Get complete admin dashboard (admin only)
 */
router.get('/admin-dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [platform, revenue, performance, retention] = await Promise.all([
      analyticsService.getPlatformMetrics('30d'),
      analyticsService.getRevenueAnalytics('30d'),
      analyticsService.getPerformanceMetrics('24h'),
      analyticsService.getRetentionMetrics()
    ]);

    res.json({
      platform,
      revenue,
      performance,
      retention
    });
  } catch (error) {
    console.error('Error getting admin dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
