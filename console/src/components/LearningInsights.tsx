import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './LearningInsights.css';

// Types matching our Supabase tables
interface DPPMReflection {
  id: string;
  goal_description: string;
  goal_category: string;
  subtask_results: Array<{
    id: number;
    title: string;
    model: string;
    latency_ms: number;
    status: 'success' | 'failed';
  }>;
  winning_model: string;
  success_rate: number;
  total_latency_ms: number;
  lessons_learned: string[];
  reflection_text: string;
  created_at: string;
}

interface ModelPerformance {
  model_name: string;
  task_category: string;
  total_attempts: number;
  wins: number;
  avg_latency_ms: number;
  win_rate: number;
}

interface LearningStats {
  total_dppm_tasks: number;
  total_subtasks_completed: number;
  avg_success_rate: number;
  avg_latency_ms: number;
  favorite_model: string;
  top_category: string;
}

interface LearningInsightsProps {
  userId?: string;
}

export function LearningInsights({ userId }: LearningInsightsProps) {
  const [reflections, setReflections] = useState<DPPMReflection[]>([]);
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance[]>([]);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'history' | 'models'>('overview');

  useEffect(() => {
    if (userId) {
      loadLearningData();
    }
  }, [userId]);

  const loadLearningData = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Load DPPM reflections
      const { data: reflectionsData, error: reflectionsError } = await supabase
        .from('dppm_reflections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (reflectionsError) {
        console.error('Error loading reflections:', reflectionsError);
      } else {
        setReflections(reflectionsData || []);
      }

      // Load model performance data
      const { data: performanceData, error: performanceError } = await supabase
        .from('model_performance')
        .select('*')
        .order('wins', { ascending: false });

      if (performanceError) {
        console.error('Error loading model performance:', performanceError);
      } else {
        // Calculate win rate for each model
        const withWinRate = (performanceData || []).map(p => ({
          ...p,
          win_rate: p.total_attempts > 0 ? p.wins / p.total_attempts : 0
        }));
        setModelPerformance(withWinRate);
      }

      // Calculate aggregate stats
      if (reflectionsData && reflectionsData.length > 0) {
        const totalTasks = reflectionsData.length;
        const totalSubtasks = reflectionsData.reduce((sum, r) => 
          sum + (r.subtask_results?.length || 0), 0);
        const avgSuccess = reflectionsData.reduce((sum, r) => 
          sum + (r.success_rate || 0), 0) / totalTasks;
        const avgLatency = reflectionsData.reduce((sum, r) => 
          sum + (r.total_latency_ms || 0), 0) / totalTasks;
        
        // Find favorite model
        const modelCounts: Record<string, number> = {};
        reflectionsData.forEach(r => {
          if (r.winning_model) {
            modelCounts[r.winning_model] = (modelCounts[r.winning_model] || 0) + 1;
          }
        });
        const favoriteModel = Object.entries(modelCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        // Find top category
        const categoryCounts: Record<string, number> = {};
        reflectionsData.forEach(r => {
          if (r.goal_category) {
            categoryCounts[r.goal_category] = (categoryCounts[r.goal_category] || 0) + 1;
          }
        });
        const topCategory = Object.entries(categoryCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'general';

        setStats({
          total_dppm_tasks: totalTasks,
          total_subtasks_completed: totalSubtasks,
          avg_success_rate: avgSuccess,
          avg_latency_ms: avgLatency,
          favorite_model: favoriteModel,
          top_category: topCategory
        });
      } else {
        setStats(null);
      }
    } catch (err) {
      console.error('Failed to load learning data:', err);
      setError('Failed to load learning insights');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      'coding': '💻',
      'writing': '✍️',
      'analysis': '📊',
      'web_development': '🌐',
      'math': '🔢',
      'general': '📝'
    };
    return emojis[category] || '📝';
  };

  const getSuccessColor = (rate: number) => {
    if (rate >= 0.9) return '#4ade80';
    if (rate >= 0.7) return '#facc15';
    return '#f87171';
  };

  if (!userId) {
    return (
      <div className="learning-insights">
        <div className="no-user-message">
          <span className="icon">🔒</span>
          <p>Log in to see your learning insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="learning-insights">
      <div className="insights-header">
        <h3>🧠 Learning Insights</h3>
        <button 
          className="refresh-btn" 
          onClick={loadLearningData}
          disabled={isLoading}
        >
          {isLoading ? '⏳' : '🔄'} Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="section-tabs">
        <button 
          className={`section-tab ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`section-tab ${activeSection === 'history' ? 'active' : ''}`}
          onClick={() => setActiveSection('history')}
        >
          📜 History ({reflections.length})
        </button>
        <button 
          className={`section-tab ${activeSection === 'models' ? 'active' : ''}`}
          onClick={() => setActiveSection('models')}
        >
          🤖 Models ({modelPerformance.length})
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading your learning data...</p>
        </div>
      ) : (
        <div className="insights-content">
          {activeSection === 'overview' && (
            <div className="overview-section">
              {stats ? (
                <>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <span className="stat-icon">🎯</span>
                      <span className="stat-value">{stats.total_dppm_tasks}</span>
                      <span className="stat-label">DPPM Tasks</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-icon">✅</span>
                      <span className="stat-value">{stats.total_subtasks_completed}</span>
                      <span className="stat-label">Subtasks Completed</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-icon">📈</span>
                      <span className="stat-value" style={{ color: getSuccessColor(stats.avg_success_rate) }}>
                        {(stats.avg_success_rate * 100).toFixed(0)}%
                      </span>
                      <span className="stat-label">Success Rate</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-icon">⚡</span>
                      <span className="stat-value">{formatLatency(stats.avg_latency_ms)}</span>
                      <span className="stat-label">Avg Response Time</span>
                    </div>
                  </div>

                  <div className="preferences-summary">
                    <h4>Your Profile</h4>
                    <div className="pref-item">
                      <span className="pref-label">🏆 Favorite Model:</span>
                      <span className="pref-value model-badge">{stats.favorite_model}</span>
                    </div>
                    <div className="pref-item">
                      <span className="pref-label">{getCategoryEmoji(stats.top_category)} Top Category:</span>
                      <span className="pref-value">{stats.top_category.replace('_', ' ')}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">🌱</span>
                  <h4>Start Using Deep Thinking!</h4>
                  <p>Enable DPPM mode for complex tasks to see your learning insights here.</p>
                  <p className="hint">Tip: Use the 🧠 button in chat to enable deep thinking mode.</p>
                </div>
              )}
            </div>
          )}

          {activeSection === 'history' && (
            <div className="lessons-section">
              {reflections.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📜</span>
                  <p>No DPPM tasks yet. Try deep thinking mode for complex tasks!</p>
                </div>
              ) : (
                <div className="lessons-list">
                  {reflections.map((reflection) => (
                    <div key={reflection.id} className="lesson-card">
                      <div className="lesson-header">
                        <span className="feedback-emoji">{getCategoryEmoji(reflection.goal_category)}</span>
                        <span className="task-type">{reflection.goal_category.replace('_', ' ')}</span>
                        <span className="model-badge">{reflection.winning_model}</span>
                        <span className="lesson-date">{formatDate(reflection.created_at)}</span>
                      </div>
                      <div className="lesson-content">
                        <p className="lesson-text">{reflection.goal_description}</p>
                        <div className="reflection-stats">
                          <span className="stat-pill" style={{ backgroundColor: getSuccessColor(reflection.success_rate) }}>
                            {(reflection.success_rate * 100).toFixed(0)}% success
                          </span>
                          <span className="stat-pill">
                            ⚡ {formatLatency(reflection.total_latency_ms)}
                          </span>
                          <span className="stat-pill">
                            📋 {reflection.subtask_results?.length || 0} subtasks
                          </span>
                        </div>
                        {reflection.lessons_learned && reflection.lessons_learned.length > 0 && (
                          <div className="lessons-learned">
                            <strong>Lessons:</strong>
                            <ul>
                              {reflection.lessons_learned.map((lesson, i) => (
                                <li key={i}>{lesson}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'models' && (
            <div className="patterns-section">
              {modelPerformance.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🤖</span>
                  <p>No model performance data yet. Complete some DPPM tasks first!</p>
                </div>
              ) : (
                <div className="patterns-list">
                  {modelPerformance.map((model, index) => (
                    <div key={`${model.model_name}-${model.task_category}`} className="pattern-card">
                      <div className="pattern-header">
                        <span className="pattern-type">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🤖'} {model.model_name}
                        </span>
                        <span className="occurrence-count">{model.wins} wins</span>
                      </div>
                      <div className="pattern-content">
                        <span className="pattern-key">Category:</span>
                        <span className="pattern-value">{getCategoryEmoji(model.task_category)} {model.task_category}</span>
                      </div>
                      <div className="pattern-confidence">
                        <span className="confidence-label">Win Rate:</span>
                        <div className="confidence-bar">
                          <div 
                            className="confidence-fill" 
                            style={{ 
                              width: `${model.win_rate * 100}%`,
                              backgroundColor: getSuccessColor(model.win_rate)
                            }}
                          />
                          <span className="confidence-text">{(model.win_rate * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="pattern-date">
                        Avg latency: {formatLatency(model.avg_latency_ms)} • {model.total_attempts} attempts
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
