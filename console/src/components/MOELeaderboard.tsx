import { useState, useEffect } from 'react';
import './MOELeaderboard.css';

const API_URL = 'https://morgus-orchestrator.morgan-426.workers.dev';

interface ModelStats {
  model_name: string;
  total_competitions: number;
  total_wins: number;
  win_rate: number;
  avg_score: number;
  avg_latency: number;
}

export function MOELeaderboard() {
  const [stats, setStats] = useState<ModelStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats/leaderboard`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || []);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (index: number) => {
    const badges = ['🥇', '🥈', '🥉'];
    return badges[index] || `${index + 1}`;
  };

  const getModelShortName = (fullName: string) => {
    const parts = fullName.split('/');
    const modelName = parts[parts.length - 1];
    
    return modelName
      .replace('gemini-2.0-flash-exp:free', 'Gemini 2.0')
      .replace('claude-3.5-haiku', 'Claude 3.5')
      .replace('gpt-4o-mini', 'GPT-4o mini')
      .replace(':free', '');
  };

  if (loading || stats.length === 0) {
    return null;
  }

  return (
    <div className="moe-leaderboard-box">
      <div className="leaderboard-title">🏆 Model Rankings</div>
      <div className="leaderboard-grid">
        {stats.slice(0, 3).map((stat, index) => (
          <div key={stat.model_name} className={`leaderboard-row rank-${index + 1}`}>
            <span className="rank-badge">{getRankBadge(index)}</span>
            <div className="model-info">
              <div className="model-name-short">{getModelShortName(stat.model_name)}</div>
              <div className="win-rate-badge">{stat.win_rate.toFixed(0)}% wins</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
