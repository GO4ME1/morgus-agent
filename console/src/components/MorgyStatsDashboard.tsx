/**
 * Morgy Stats Dashboard
 * 
 * Shows creator analytics and performance metrics
 */

import { useState, useEffect } from 'react';
import { getCreatorAnalytics } from '../lib/api-client';
import './MorgyStatsDashboard.css';

interface CreatorStats {
  totalListings: number;
  totalSales: number;
  totalRevenue: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export function MorgyStatsDashboard() {
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCreatorAnalytics();
      setStats(data);
    } catch (err: unknown) {
      setError(err.message || 'Failed to load stats');
      // Set default stats for new creators
      setStats({
        totalListings: 0,
        totalSales: 0,
        totalRevenue: 0,
        totalEarnings: 0,
        averageRating: 0,
        totalReviews: 0,
        tier: 'bronze'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="stats-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading your stats...</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const tierEmojis = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎'
  };

  const tierColors = {
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700',
    platinum: '#e5e4e2'
  };

  return (
    <div className="stats-dashboard">
      <div className="stats-header">
        <h2>📊 Creator Dashboard</h2>
        <div 
          className="creator-tier" 
          style={{ 
            background: `linear-gradient(135deg, ${tierColors[stats.tier]}, ${tierColors[stats.tier]}88)` 
          }}
        >
          {tierEmojis[stats.tier]} {stats.tier.toUpperCase()}
        </div>
      </div>

      {error && (
        <div className="stats-notice">
          ℹ️ {error}. Start creating to see your stats!
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎨</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalListings}</div>
            <div className="stat-label">Listings</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalSales}</div>
            <div className="stat-label">Sales</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <div className="stat-value">${stats.totalRevenue.toFixed(2)}</div>
            <div className="stat-label">Revenue</div>
          </div>
        </div>

        <div className="stat-card highlight">
          <div className="stat-icon">🎉</div>
          <div className="stat-content">
            <div className="stat-value">${stats.totalEarnings.toFixed(2)}</div>
            <div className="stat-label">Your Earnings (70%)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{stats.averageRating.toFixed(1)}</div>
            <div className="stat-label">Avg Rating</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalReviews}</div>
            <div className="stat-label">Reviews</div>
          </div>
        </div>
      </div>

      <div className="stats-footer">
        <p>
          🚀 <strong>Next Tier:</strong> {
            stats.tier === 'bronze' ? 'Silver (10 sales)' :
            stats.tier === 'silver' ? 'Gold (50 sales)' :
            stats.tier === 'gold' ? 'Platinum (100 sales)' :
            'You\'re at the top! 🎉'
          }
        </p>
      </div>
    </div>
  );
}
