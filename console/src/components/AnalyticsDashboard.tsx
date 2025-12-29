import { useState, useEffect } from 'react';
import { TrendingUp, Users, MessageSquare, DollarSign, Activity, BarChart3, PieChart, Calendar } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { getUserAnalytics, getPlatformAnalytics } from '../lib/api-client';

interface PlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  newSignups: number;
  totalMessages: number;
  apiCalls: number;
  revenue: {
    mrr: number;
    arr: number;
    totalRevenue: number;
  };
  conversionRate: number;
}

interface UserAnalytics {
  messagesCount: number;
  avgResponseTime: number;
  favoriteModels: Array<{ model: string; count: number }>;
  usageByDay: Array<{ date: string; count: number }>;
  creditsUsed: number;
  creditsRemaining: number;
}

interface PerformanceMetrics {
  avgResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  uptime: number;
  requestsPerSecond: number;
}

export const AnalyticsDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [platformMetrics, setPlatformMetrics] = useState<PlatformMetrics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [performanceMetrics, _setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const isAdmin = profile?.is_admin;

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, user]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load user analytics
      try {
        const userData = await getUserAnalytics(user.id);
        setUserAnalytics((userData as UserAnalytics) || null);
      } catch (error) {
        console.error('Failed to load user analytics:', error);
      }

      // Load platform metrics (admin only)
      if (isAdmin) {
        try {
          const platformData = await getPlatformAnalytics();
          setPlatformMetrics((platformData as PlatformMetrics) || null);
          // Note: Performance metrics endpoint not yet implemented
        } catch (error) {
          console.error('Failed to load platform analytics:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Analytics Dashboard</h1>
            <p className="text-gray-400">
              {isAdmin ? 'Platform metrics and user insights' : 'Your usage statistics and insights'}
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${timeRange === range
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }
                `}
              >
                {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Platform Metrics (Admin Only) */}
        {isAdmin && platformMetrics && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Platform Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Total Users</span>
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatNumber(platformMetrics.totalUsers)}
                </div>
                <div className="text-sm text-green-400">
                  +{formatNumber(platformMetrics.newSignups)} new this period
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Active Users</span>
                  <Activity className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatNumber(platformMetrics.activeUsers)}
                </div>
                <div className="text-sm text-gray-400">
                  {((platformMetrics.activeUsers / platformMetrics.totalUsers) * 100).toFixed(1)}% of total
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Total Messages</span>
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatNumber(platformMetrics.totalMessages)}
                </div>
                <div className="text-sm text-gray-400">
                  {formatNumber(platformMetrics.apiCalls)} API calls
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">MRR</span>
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(platformMetrics.revenue.mrr)}
                </div>
                <div className="text-sm text-gray-400">
                  ARR: {formatCurrency(platformMetrics.revenue.arr)}
                </div>
              </div>
            </div>

            {/* Revenue & Conversion */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  Revenue Metrics
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-400">Total Revenue</span>
                      <span className="text-white font-bold">
                        {formatCurrency(platformMetrics.revenue.totalRevenue)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-400">Conversion Rate</span>
                      <span className="text-white font-bold">
                        {platformMetrics.conversionRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${platformMetrics.conversionRate}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              {performanceMetrics && (
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    System Performance
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Avg Response Time</span>
                      <span className="text-white font-medium">
                        {performanceMetrics.avgResponseTime.toFixed(0)}ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">P95 Response Time</span>
                      <span className="text-white font-medium">
                        {performanceMetrics.p95ResponseTime.toFixed(0)}ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Error Rate</span>
                      <span className={`font-medium ${
                        performanceMetrics.errorRate < 1 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {performanceMetrics.errorRate.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Uptime</span>
                      <span className="text-green-400 font-medium">
                        {performanceMetrics.uptime.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Requests/sec</span>
                      <span className="text-white font-medium">
                        {performanceMetrics.requestsPerSecond.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Analytics */}
        {userAnalytics && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Your Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Messages Sent</span>
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatNumber(userAnalytics.messagesCount)}
                </div>
                <div className="text-sm text-gray-400">
                  Avg response: {userAnalytics.avgResponseTime.toFixed(1)}s
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Credits Used</span>
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {formatNumber(userAnalytics.creditsUsed)}
                </div>
                <div className="text-sm text-gray-400">
                  {formatNumber(userAnalytics.creditsRemaining)} remaining
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Top Model</span>
                  <PieChart className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {userAnalytics.favoriteModels[0]?.model || 'N/A'}
                </div>
                <div className="text-sm text-gray-400">
                  {userAnalytics.favoriteModels[0]?.count || 0} uses
                </div>
              </div>
            </div>

            {/* Usage Chart */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                Daily Usage
              </h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {userAnalytics.usageByDay.map((day, index) => {
                  const maxCount = Math.max(...userAnalytics.usageByDay.map(d => d.count));
                  const height = (day.count / maxCount) * 100;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-purple-500 rounded-t hover:bg-purple-400 transition-colors cursor-pointer"
                        style={{ height: `${height}%` }}
                        title={`${day.date}: ${day.count} messages`}
                      />
                      <span className="text-xs text-gray-400 transform -rotate-45 origin-top-left">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
