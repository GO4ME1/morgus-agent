// @ts-nocheck
/**
 * Analytics Service
 * Tracks user behavior, revenue, and system performance
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'mock-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export class AnalyticsService {
  /**
   * Get platform-wide metrics
   */
  async getPlatformMetrics(timeRange: '24h' | '7d' | '30d' | 'all' = '30d') {
    try {
      const since = this.getTimeRangeDate(timeRange);

      // Total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Active users (used in time range)
      const { count: activeUsers } = await supabase
        .from('user_usage')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', since.toISOString());

      // Total messages
      const { count: totalMessages } = await supabase
        .from('user_usage')
        .select('*', { count: 'exact', head: true })
        .eq('action_type', 'chat')
        .gte('created_at', since.toISOString());

      // Total revenue (from usage quotas)
      const { data: revenueData } = await supabase
        .from('usage_quotas')
        .select('cost_usd')
        .gte('created_at', since.toISOString());

      const totalRevenue = revenueData?.reduce((sum, row) => sum + parseFloat(row.cost_usd || 0), 0) || 0;

      // Subscription breakdown
      const { data: subscriptions } = await supabase
        .from('profiles')
        .select('subscription_tier');

      const tierCounts = subscriptions?.reduce((acc, row) => {
        const tier = row.subscription_tier || 'free';
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // MRR (Monthly Recurring Revenue)
      const mrr = (tierCounts.pro || 0) * 20 + (tierCounts.business || 0) * 99;

      return {
        users: {
          total: totalUsers || 0,
          active: activeUsers || 0,
          byTier: tierCounts
        },
        usage: {
          totalMessages: totalMessages || 0,
          avgMessagesPerUser: activeUsers ? Math.round((totalMessages || 0) / activeUsers) : 0
        },
        revenue: {
          total: totalRevenue,
          mrr,
          arpu: totalUsers ? (totalRevenue / totalUsers).toFixed(2) : 0 // Average Revenue Per User
        },
        timeRange
      };
    } catch (error) {
      console.error('Error getting platform metrics:', error);
      return null;
    }
  }

  /**
   * Get user-specific analytics
   */
  async getUserAnalytics(userId: string, timeRange: '24h' | '7d' | '30d' | 'all' = '30d') {
    try {
      const since = this.getTimeRangeDate(timeRange);

      // Usage over time
      const { data: usage } = await supabase
        .from('user_usage')
        .select('action_type, tokens_used, cost_usd, created_at')
        .eq('user_id', userId)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true });

      // Tool usage breakdown
      const toolUsage = usage?.reduce((acc, row) => {
        acc[row.action_type] = (acc[row.action_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Daily activity
      const dailyActivity = usage?.reduce((acc, row) => {
        const date = row.created_at.split('T')[0];
        if (!acc[date]) {
          acc[date] = { messages: 0, tokens: 0, cost: 0 };
        }
        if (row.action_type === 'chat') acc[date].messages++;
        acc[date].tokens += row.tokens_used || 0;
        acc[date].cost += parseFloat(row.cost_usd || 0);
        return acc;
      }, {} as Record<string, any>) || {};

      // Total stats
      const totalMessages = usage?.filter(u => u.action_type === 'chat').length || 0;
      const totalTokens = usage?.reduce((sum, u) => sum + (u.tokens_used || 0), 0) || 0;
      const totalCost = usage?.reduce((sum, u) => sum + parseFloat(u.cost_usd || 0), 0) || 0;

      return {
        summary: {
          totalMessages,
          totalTokens,
          totalCost: totalCost.toFixed(4),
          avgTokensPerMessage: totalMessages ? Math.round(totalTokens / totalMessages) : 0
        },
        toolUsage,
        dailyActivity,
        timeRange
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      return null;
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(timeRange: '24h' | '7d' | '30d' | 'all' = '30d') {
    try {
      const since = this.getTimeRangeDate(timeRange);

      // Revenue by tier
      const { data: quotas } = await supabase
        .from('usage_quotas')
        .select('user_id, cost_usd, month')
        .gte('created_at', since.toISOString());

      // Get user tiers
      const userIds = [...new Set(quotas?.map(q => q.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, subscription_tier')
        .in('id', userIds);

      const tierMap = profiles?.reduce((acc, p) => {
        acc[p.id] = p.subscription_tier || 'free';
        return acc;
      }, {} as Record<string, string>) || {};

      // Calculate revenue by tier
      const revenueByTier = quotas?.reduce((acc, q) => {
        const tier = tierMap[q.user_id] || 'free';
        acc[tier] = (acc[tier] || 0) + parseFloat(q.cost_usd || 0);
        return acc;
      }, {} as Record<string, number>) || {};

      // Revenue by month
      const revenueByMonth = quotas?.reduce((acc, q) => {
        acc[q.month] = (acc[q.month] || 0) + parseFloat(q.cost_usd || 0);
        return acc;
      }, {} as Record<string, number>) || {};

      // Total revenue
      const totalRevenue = Object.values(revenueByTier).reduce((sum, val) => sum + val, 0);

      // Growth rate (compare to previous period)
      const months = Object.keys(revenueByMonth).sort();
      const currentMonth = months[months.length - 1];
      const previousMonth = months[months.length - 2];
      const growthRate = previousMonth 
        ? ((revenueByMonth[currentMonth] - revenueByMonth[previousMonth]) / revenueByMonth[previousMonth] * 100).toFixed(1)
        : 0;

      return {
        total: totalRevenue.toFixed(2),
        byTier: revenueByTier,
        byMonth: revenueByMonth,
        growthRate: `${growthRate}%`,
        timeRange
      };
    } catch (error) {
      console.error('Error getting revenue analytics:', error);
      return null;
    }
  }

  /**
   * Get system performance metrics
   */
  async getPerformanceMetrics(timeRange: '24h' | '7d' | '30d' | 'all' = '24h') {
    try {
      const since = this.getTimeRangeDate(timeRange);

      // Get usage data with metadata
      const { data: usage } = await supabase
        .from('user_usage')
        .select('action_type, metadata, created_at')
        .gte('created_at', since.toISOString());

      // Calculate average latency by action type
      const latencyByAction = usage?.reduce((acc, row) => {
        const latency = row.metadata?.latency;
        if (latency) {
          if (!acc[row.action_type]) {
            acc[row.action_type] = { total: 0, count: 0 };
          }
          acc[row.action_type].total += latency;
          acc[row.action_type].count++;
        }
        return acc;
      }, {} as Record<string, { total: number; count: number }>) || {};

      const avgLatency = Object.entries(latencyByAction).reduce((acc, [action, data]) => {
        acc[action] = Math.round(data.total / data.count);
        return acc;
      }, {} as Record<string, number>);

      // Error rate
      const totalActions = usage?.length || 0;
      const errors = usage?.filter(u => u.metadata?.error).length || 0;
      const errorRate = totalActions ? ((errors / totalActions) * 100).toFixed(2) : 0;

      // Requests per minute
      const durationMinutes = (Date.now() - since.getTime()) / 1000 / 60;
      const rpm = totalActions / durationMinutes;

      return {
        avgLatency,
        errorRate: `${errorRate}%`,
        requestsPerMinute: rpm.toFixed(2),
        totalRequests: totalActions,
        timeRange
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return null;
    }
  }

  /**
   * Get user retention metrics
   */
  async getRetentionMetrics() {
    try {
      // Users who signed up in last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const { data: newUsers } = await supabase
        .from('profiles')
        .select('id, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Check which ones are still active (used in last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const { data: activeUsage } = await supabase
        .from('user_usage')
        .select('user_id')
        .gte('created_at', sevenDaysAgo.toISOString());

      const activeUserIds = new Set(activeUsage?.map(u => u.user_id) || []);
      const retainedUsers = newUsers?.filter(u => activeUserIds.has(u.id)).length || 0;
      const totalNewUsers = newUsers?.length || 0;

      const retentionRate = totalNewUsers ? ((retainedUsers / totalNewUsers) * 100).toFixed(1) : 0;

      // Daily Active Users (DAU)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { count: dau } = await supabase
        .from('user_usage')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo.toISOString());

      // Monthly Active Users (MAU)
      const { count: mau } = await supabase
        .from('user_usage')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      return {
        retentionRate: `${retentionRate}%`,
        newUsers: totalNewUsers,
        retainedUsers,
        dau: dau || 0,
        mau: mau || 0,
        dauMauRatio: mau ? ((dau || 0) / mau).toFixed(2) : 0
      };
    } catch (error) {
      console.error('Error getting retention metrics:', error);
      return null;
    }
  }

  /**
   * Helper: Get date for time range
   */
  private getTimeRangeDate(timeRange: '24h' | '7d' | '30d' | 'all'): Date {
    const now = Date.now();
    switch (timeRange) {
      case '24h':
        return new Date(now - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now - 30 * 24 * 60 * 60 * 1000);
      case 'all':
      default:
        return new Date(0); // Beginning of time
    }
  }
}

export const analyticsService = new AnalyticsService();
