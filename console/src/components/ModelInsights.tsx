// Model Insights Dashboard Component
import { useState, useEffect } from 'react';
import './ModelInsights.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://morgus-orchestrator.morgan-426.workers.dev';

interface CategoryPerformance {
  category: string;
  model_name: string;
  total_competitions: number;
  wins: number;
  win_rate: number;
  avg_score: number;
  avg_latency: number;
}

interface ComplexityPerformance {
  complexity: string;
  model_name: string;
  total: number;
  wins: number;
  win_rate: number;
}

interface LeaderboardEntry {
  model_name: string;
  total_competitions: number;
  total_wins: number;
  win_rate: number;
  avg_score: number;
  avg_latency: number;
  rank: number;
}

interface InsightsSummary {
  total_competitions: number;
  categories_tracked: string[];
  best_by_category: Record<string, string>;
  model_specialties: Record<string, string[]>;
}

interface InsightsData {
  summary: InsightsSummary;
  by_category: CategoryPerformance[];
  by_complexity: ComplexityPerformance[];
  leaderboard: LeaderboardEntry[];
  generated_at: string;
}

interface ModelInsightsProps {
  userId: string;
}

export function ModelInsights({ userId }: ModelInsightsProps) {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'category' | 'complexity'>('overview');

  useEffect(() => {
    fetchInsights();
  }, [userId]);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/admin/model-insights`, {
        headers: {
          'Authorization': `Bearer ${userId}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch insights: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err: unknown) {
      console.error('Error fetching model insights:', err);
      setError(err.message || 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="insights-loading">
        <div className="loading-spinner"></div>
        <p>Loading model insights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="insights-error">
        <p>⚠️ {error}</p>
        <button onClick={fetchInsights}>Retry</button>
      </div>
    );
  }

  if (!data) {
    return <div className="insights-empty">No insights data available</div>;
  }

  // Group category performance by category for easier display
  const categoryGroups: Record<string, CategoryPerformance[]> = {};
  data.by_category.forEach(perf => {
    if (!categoryGroups[perf.category]) {
      categoryGroups[perf.category] = [];
    }
    categoryGroups[perf.category].push(perf);
  });

  // Group complexity performance by complexity
  const complexityGroups: Record<string, ComplexityPerformance[]> = {};
  data.by_complexity.forEach(perf => {
    if (!complexityGroups[perf.complexity]) {
      complexityGroups[perf.complexity] = [];
    }
    complexityGroups[perf.complexity].push(perf);
  });

  return (
    <div className="model-insights">
      <div className="insights-header">
        <h2>🤖 Model Performance Insights</h2>
        <p className="insights-timestamp">
          Last updated: {new Date(data.generated_at).toLocaleString()}
        </p>
        <button className="refresh-btn" onClick={fetchInsights}>🔄 Refresh</button>
      </div>

      {/* Summary Cards */}
      <div className="insights-summary">
        <div className="summary-card">
          <div className="summary-icon">🏆</div>
          <div className="summary-content">
            <span className="summary-value">{data.summary.total_competitions}</span>
            <span className="summary-label">Total Competitions</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <span className="summary-value">{data.summary.categories_tracked?.length || 0}</span>
            <span className="summary-label">Categories Tracked</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">🥇</div>
          <div className="summary-content">
            <span className="summary-value">{data.leaderboard[0]?.model_name || 'N/A'}</span>
            <span className="summary-label">Top Model</span>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="insights-tabs">
        <button 
          className={selectedView === 'overview' ? 'active' : ''} 
          onClick={() => setSelectedView('overview')}
        >
          📈 Leaderboard
        </button>
        <button 
          className={selectedView === 'category' ? 'active' : ''} 
          onClick={() => setSelectedView('category')}
        >
          🏷️ By Category
        </button>
        <button 
          className={selectedView === 'complexity' ? 'active' : ''} 
          onClick={() => setSelectedView('complexity')}
        >
          🎯 By Complexity
        </button>
      </div>

      {/* Leaderboard View */}
      {selectedView === 'overview' && (
        <div className="insights-section">
          <h3>🏆 Model Leaderboard</h3>
          {data.leaderboard.length === 0 ? (
            <p className="no-data">No competition data yet. Start chatting to generate insights!</p>
          ) : (
            <table className="insights-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Model</th>
                  <th>Competitions</th>
                  <th>Wins</th>
                  <th>Win Rate</th>
                  <th>Avg Score</th>
                  <th>Avg Latency</th>
                </tr>
              </thead>
              <tbody>
                {data.leaderboard.map((entry, index) => (
                  <tr key={entry.model_name} className={index === 0 ? 'top-model' : ''}>
                    <td className="rank">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </td>
                    <td className="model-name">{entry.model_name}</td>
                    <td>{entry.total_competitions}</td>
                    <td>{entry.total_wins}</td>
                    <td>
                      <span className={`win-rate ${entry.win_rate >= 50 ? 'high' : 'low'}`}>
                        {entry.win_rate?.toFixed(1)}%
                      </span>
                    </td>
                    <td>{entry.avg_score?.toFixed(2)}</td>
                    <td>{entry.avg_latency?.toFixed(0)}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Best by Category Summary */}
          {Object.keys(data.summary.best_by_category || {}).length > 0 && (
            <div className="best-by-category">
              <h4>🎯 Best Model by Category</h4>
              <div className="category-badges">
                {Object.entries(data.summary.best_by_category).map(([category, model]) => (
                  <div key={category} className="category-badge">
                    <span className="badge-category">{category}</span>
                    <span className="badge-model">{model}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category View */}
      {selectedView === 'category' && (
        <div className="insights-section">
          <h3>🏷️ Performance by Query Category</h3>
          {Object.keys(categoryGroups).length === 0 ? (
            <p className="no-data">No category data yet. Categories are tracked automatically as users chat.</p>
          ) : (
            Object.entries(categoryGroups).map(([category, models]) => (
              <div key={category} className="category-group">
                <h4 className="category-title">
                  {getCategoryEmoji(category)} {category}
                </h4>
                <table className="insights-table compact">
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th>Competitions</th>
                      <th>Wins</th>
                      <th>Win Rate</th>
                      <th>Avg Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.sort((a, b) => b.win_rate - a.win_rate).map(perf => (
                      <tr key={perf.model_name}>
                        <td className="model-name">{perf.model_name}</td>
                        <td>{perf.total_competitions}</td>
                        <td>{perf.wins}</td>
                        <td>
                          <div className="win-rate-bar">
                            <div 
                              className="win-rate-fill" 
                              style={{ width: `${Math.min(perf.win_rate, 100)}%` }}
                            />
                            <span>{perf.win_rate?.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td>{perf.avg_score?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}

      {/* Complexity View */}
      {selectedView === 'complexity' && (
        <div className="insights-section">
          <h3>🎯 Performance by Query Complexity</h3>
          {Object.keys(complexityGroups).length === 0 ? (
            <p className="no-data">No complexity data yet. Complexity is tracked automatically as users chat.</p>
          ) : (
            <div className="complexity-grid">
              {['simple', 'medium', 'complex'].map(complexity => {
                const models = complexityGroups[complexity] || [];
                if (models.length === 0) return null;
                return (
                  <div key={complexity} className={`complexity-card ${complexity}`}>
                    <h4>
                      {complexity === 'simple' ? '🟢' : complexity === 'medium' ? '🟡' : '🔴'} 
                      {complexity.charAt(0).toUpperCase() + complexity.slice(1)} Queries
                    </h4>
                    <div className="complexity-models">
                      {models.sort((a, b) => b.win_rate - a.win_rate).map(perf => (
                        <div key={perf.model_name} className="complexity-model">
                          <span className="model-name">{perf.model_name}</span>
                          <span className="win-rate">{perf.win_rate?.toFixed(1)}%</span>
                          <span className="sample-size">({perf.total} samples)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Model Specialties */}
      {Object.keys(data.summary.model_specialties || {}).length > 0 && (
        <div className="insights-section specialties">
          <h3>⭐ Model Specialties</h3>
          <p className="section-desc">Categories where each model has &gt;50% win rate with 5+ samples</p>
          <div className="specialties-grid">
            {Object.entries(data.summary.model_specialties).map(([model, categories]) => (
              <div key={model} className="specialty-card">
                <h4>{model}</h4>
                <div className="specialty-tags">
                  {categories.map(cat => (
                    <span key={cat} className="specialty-tag">
                      {getCategoryEmoji(cat)} {cat}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    coding: '💻',
    research: '🔬',
    creative: '🎨',
    math: '🔢',
    analysis: '📊',
    task: '✅',
    conversation: '💬',
  };
  return emojis[category] || '📝';
}
