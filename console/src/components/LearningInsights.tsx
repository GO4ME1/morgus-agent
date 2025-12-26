import { useState, useEffect } from 'react';
import './LearningInsights.css';

const API_URL = 'https://morgus-orchestrator.morgan-426.workers.dev';

interface UserLesson {
  id: string;
  task_type: string;
  model_used: string;
  feedback_type: 'positive' | 'negative' | 'glitch';
  what_worked?: string;
  what_failed?: string;
  lesson_learned: string;
  applied_count: number;
  created_at: string;
}

interface UserPattern {
  id: string;
  pattern_type: 'task' | 'style' | 'preference';
  pattern_key: string;
  pattern_value: string;
  confidence: number;
  occurrence_count: number;
  last_seen: string;
}

interface UserPreferences {
  preferred_tone: string;
  preferred_models: string[];
  industry?: string;
  common_tasks: string[];
  avoid_patterns: string[];
  style_notes: string[];
}

interface LearningInsightsProps {
  userId?: string;
}

export function LearningInsights({ userId }: LearningInsightsProps) {
  const [lessons, setLessons] = useState<UserLesson[]>([]);
  const [patterns, setPatterns] = useState<UserPattern[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'lessons' | 'patterns'>('overview');

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
      // Load all data in parallel
      const [lessonsRes, patternsRes, prefsRes] = await Promise.all([
        fetch(`${API_URL}/api/user/lessons?user_id=${userId}`),
        fetch(`${API_URL}/api/user/patterns?user_id=${userId}`),
        fetch(`${API_URL}/api/user/preferences?user_id=${userId}`),
      ]);

      if (lessonsRes.ok) {
        const lessonsData = await lessonsRes.json();
        setLessons(Array.isArray(lessonsData) ? lessonsData : []);
      }

      if (patternsRes.ok) {
        const patternsData = await patternsRes.json();
        setPatterns(Array.isArray(patternsData) ? patternsData : []);
      }

      if (prefsRes.ok) {
        const prefsData = await prefsRes.json();
        setPreferences(prefsData);
      }
    } catch (err) {
      console.error('Failed to load learning data:', err);
      setError('Failed to load learning insights');
    } finally {
      setIsLoading(false);
    }
  };

  const getFeedbackEmoji = (type: string) => {
    switch (type) {
      case 'positive': return '👍';
      case 'negative': return '👎';
      case 'glitch': return '🍅';
      default: return '📝';
    }
  };

  const getConfidenceBar = (confidence: number) => {
    const percentage = Math.round(confidence * 100);
    return (
      <div className="confidence-bar">
        <div 
          className="confidence-fill" 
          style={{ width: `${percentage}%` }}
        />
        <span className="confidence-text">{percentage}%</span>
      </div>
    );
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
          className={`section-tab ${activeSection === 'lessons' ? 'active' : ''}`}
          onClick={() => setActiveSection('lessons')}
        >
          📚 Lessons ({lessons.length})
        </button>
        <button 
          className={`section-tab ${activeSection === 'patterns' ? 'active' : ''}`}
          onClick={() => setActiveSection('patterns')}
        >
          🔍 Patterns ({patterns.length})
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
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-icon">📚</span>
                  <span className="stat-value">{lessons.length}</span>
                  <span className="stat-label">Lessons Learned</span>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">🔍</span>
                  <span className="stat-value">{patterns.length}</span>
                  <span className="stat-label">Patterns Detected</span>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">👍</span>
                  <span className="stat-value">{lessons.filter(l => l.feedback_type === 'positive').length}</span>
                  <span className="stat-label">Positive Feedback</span>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">👎</span>
                  <span className="stat-value">{lessons.filter(l => l.feedback_type === 'negative').length}</span>
                  <span className="stat-label">Areas to Improve</span>
                </div>
              </div>

              {preferences && (
                <div className="preferences-summary">
                  <h4>Your Preferences</h4>
                  <div className="pref-item">
                    <span className="pref-label">Preferred Tone:</span>
                    <span className="pref-value">{preferences.preferred_tone || 'Not set'}</span>
                  </div>
                  {preferences.industry && (
                    <div className="pref-item">
                      <span className="pref-label">Industry:</span>
                      <span className="pref-value">{preferences.industry}</span>
                    </div>
                  )}
                  {preferences.preferred_models?.length > 0 && (
                    <div className="pref-item">
                      <span className="pref-label">Preferred Models:</span>
                      <span className="pref-value">{preferences.preferred_models.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}

              {lessons.length === 0 && patterns.length === 0 && (
                <div className="empty-state">
                  <span className="empty-icon">🌱</span>
                  <h4>Start Teaching Morgus!</h4>
                  <p>Use the 👍 👎 🍅 buttons on responses to help Morgus learn your preferences.</p>
                </div>
              )}
            </div>
          )}

          {activeSection === 'lessons' && (
            <div className="lessons-section">
              {lessons.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📚</span>
                  <p>No lessons yet. Give feedback on responses to start teaching!</p>
                </div>
              ) : (
                <div className="lessons-list">
                  {lessons.map((lesson) => (
                    <div key={lesson.id} className={`lesson-card ${lesson.feedback_type}`}>
                      <div className="lesson-header">
                        <span className="feedback-emoji">{getFeedbackEmoji(lesson.feedback_type)}</span>
                        <span className="task-type">{lesson.task_type}</span>
                        <span className="model-badge">{lesson.model_used}</span>
                        <span className="lesson-date">{formatDate(lesson.created_at)}</span>
                      </div>
                      <div className="lesson-content">
                        <p className="lesson-text">{lesson.lesson_learned}</p>
                        {lesson.what_worked && (
                          <p className="what-worked">✅ {lesson.what_worked}</p>
                        )}
                        {lesson.what_failed && (
                          <p className="what-failed">❌ {lesson.what_failed}</p>
                        )}
                      </div>
                      {lesson.applied_count > 0 && (
                        <div className="applied-count">
                          Applied {lesson.applied_count} time{lesson.applied_count > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'patterns' && (
            <div className="patterns-section">
              {patterns.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🔍</span>
                  <p>No patterns detected yet. Keep using Morgus to build your profile!</p>
                </div>
              ) : (
                <div className="patterns-list">
                  {patterns.map((pattern) => (
                    <div key={pattern.id} className="pattern-card">
                      <div className="pattern-header">
                        <span className="pattern-type">{pattern.pattern_type}</span>
                        <span className="occurrence-count">{pattern.occurrence_count}x</span>
                      </div>
                      <div className="pattern-content">
                        <span className="pattern-key">{pattern.pattern_key}:</span>
                        <span className="pattern-value">{pattern.pattern_value}</span>
                      </div>
                      <div className="pattern-confidence">
                        <span className="confidence-label">Confidence:</span>
                        {getConfidenceBar(pattern.confidence)}
                      </div>
                      <div className="pattern-date">
                        Last seen: {formatDate(pattern.last_seen)}
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
