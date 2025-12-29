import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './DeepResearchPanel.css';

interface ResearchStep {
  id: string;
  step_index: number;
  question: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  final_answer?: string;
  final_confidence?: number;
}

interface ResearchSession {
  id: string;
  original_question: string;
  status: 'planning' | 'researching' | 'synthesizing' | 'completed' | 'failed';
  final_answer?: string;
  created_at: string;
}

interface DeepResearchPanelProps {
  sessionId: string | null;
  isActive: boolean;
  onClose: () => void;
}

export function DeepResearchPanel({ sessionId, isActive, onClose }: DeepResearchPanelProps) {
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [steps, setSteps] = useState<ResearchStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSteps = async () => {
    if (!sessionId) return;
    
    const { data, error } = await supabase
      .from('research_steps')
      .select('*')
      .eq('session_id', sessionId)
      .order('step_index', { ascending: true });

    if (!error && data) {
      setSteps(data);
    }
  };

  const loadSession = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('research_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!error && data) {
      setSession(data);
      loadSteps();
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (sessionId && isActive) {
      loadSession();
      // Set up real-time subscription
      const subscription = supabase
        .channel(`research_${sessionId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'research_steps',
          filter: `session_id=eq.${sessionId}`,
        }, () => {
          loadSteps();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'research_sessions',
          filter: `id=eq.${sessionId}`,
        }, () => {
          loadSession();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [sessionId, isActive]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'in_progress': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'planning': return '🧠';
      case 'researching': return '🔍';
      case 'synthesizing': return '📝';
      default: return '⏳';
    }
  };

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case 'facts': return '📚';
      case 'stats': return '📊';
      case 'synthesis': return '🔗';
      case 'legal': return '⚖️';
      case 'technical': return '⚙️';
      case 'comparison': return '⚖️';
      case 'definition': return '📖';
      default: return '❓';
    }
  };

  const getProgressPercentage = () => {
    if (steps.length === 0) return 0;
    const completed = steps.filter(s => s.status === 'completed').length;
    return Math.round((completed / steps.length) * 100);
  };

  if (!isActive || !sessionId) return null;

  return (
    <div className="deep-research-panel">
      <div className="research-header">
        <div className="research-title">
          <span className="research-icon">🧠</span>
          <h3>Deep Research Mode</h3>
        </div>
        <button className="close-research" onClick={onClose}>×</button>
      </div>

      {isLoading ? (
        <div className="research-loading">
          <div className="research-spinner"></div>
          <p>Loading research session...</p>
        </div>
      ) : session ? (
        <>
          <div className="research-question">
            <span className="label">Original Question:</span>
            <p>{session.original_question}</p>
          </div>

          <div className="research-status">
            <span className="status-badge" data-status={session.status}>
              {getStatusIcon(session.status)} {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
            <span className="progress-text">{getProgressPercentage()}%</span>
          </div>

          <div className="research-steps">
            <h4>Research Steps ({steps.length})</h4>
            {steps.length === 0 ? (
              <div className="no-steps">
                <p>🧠 Analyzing question and planning research steps...</p>
              </div>
            ) : (
              <ul className="steps-list">
                {steps.map((step) => (
                  <li key={step.id} className={`step-item ${step.status}`}>
                    <div className="step-header">
                      <span className="step-number">#{step.step_index}</span>
                      <span className="step-type">{getStepTypeIcon(step.type)} {step.type}</span>
                      <span className="step-status">{getStatusIcon(step.status)}</span>
                    </div>
                    <p className="step-question">{step.question}</p>
                    {step.final_answer && (
                      <div className="step-answer">
                        <span className="answer-label">Answer:</span>
                        <p>{step.final_answer}</p>
                        {step.final_confidence && (
                          <span className="confidence">
                            Confidence: {Math.round(step.final_confidence * 100)}%
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {session.final_answer && (
            <div className="research-final-answer">
              <h4>📋 Final Synthesis</h4>
              <div className="final-answer-content">
                {session.final_answer}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="research-empty">
          <p>No active research session</p>
        </div>
      )}
    </div>
  );
}
