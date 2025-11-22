import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, Task, TaskStep, Artifact } from '../lib/supabase';

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [steps, setSteps] = useState<TaskStep[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    fetchTaskData();

    // Subscribe to real-time updates
    const taskSubscription = supabase
      .channel(`task-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `id=eq.${id}` }, () => {
        fetchTask();
      })
      .subscribe();

    const stepsSubscription = supabase
      .channel(`task-steps-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_steps', filter: `task_id=eq.${id}` }, () => {
        fetchSteps();
      })
      .subscribe();

    return () => {
      taskSubscription.unsubscribe();
      stepsSubscription.unsubscribe();
    };
  }, [id]);

  const fetchTaskData = async () => {
    await Promise.all([fetchTask(), fetchSteps(), fetchArtifacts()]);
    setLoading(false);
  };

  const fetchTask = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setTask(data);
    } catch (error) {
      console.error('Error fetching task:', error);
    }
  };

  const fetchSteps = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('task_steps')
        .select('*')
        .eq('task_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSteps(data || []);
    } catch (error) {
      console.error('Error fetching steps:', error);
    }
  };

  const fetchArtifacts = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('artifacts')
        .select('*')
        .eq('task_id', id);

      if (error) throw error;
      setArtifacts(data || []);
    } catch (error) {
      console.error('Error fetching artifacts:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'badge-gray',
      running: 'badge-blue',
      completed: 'badge-green',
      error: 'badge-red',
      waiting_for_input: 'badge-yellow'
    };
    return statusColors[status] || 'badge-gray';
  };

  const getStepIcon = (type: string) => {
    const icons: Record<string, string> = {
      PHASE_START: '🚀',
      PHASE_COMPLETE: '✅',
      LLM_RESPONSE: '🤖',
      TOOL_CALL: '🔧',
      TOOL_RESULT: '📋',
      USER_NOTIFICATION: '📢',
      USER_QUESTION: '❓'
    };
    return icons[type] || '•';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="loading">Loading task details...</div>;
  }

  if (!task) {
    return <div className="error">Task not found</div>;
  }

  return (
    <div className="task-detail">
      <div className="task-header">
        <Link to="/" className="back-link">← Back to Dashboard</Link>
        <div className="task-title-section">
          <h2>{task.title}</h2>
          <span className={`badge ${getStatusBadge(task.status)}`}>
            {task.status}
          </span>
        </div>
        <p className="task-description">{task.description}</p>
        <div className="task-metadata">
          <span>Phase: <strong>{task.phase}</strong></span>
          <span>Model: <strong>{task.model}</strong></span>
          <span>Created: {formatDate(task.created_at)}</span>
          {task.completed_at && (
            <span>Completed: {formatDate(task.completed_at)}</span>
          )}
        </div>
      </div>

      {artifacts.length > 0 && (
        <div className="artifacts-section">
          <h3>Artifacts & Outputs</h3>
          <div className="artifacts-list">
            {artifacts.map(artifact => (
              <div key={artifact.id} className="artifact-card">
                <div className="artifact-icon">
                  {artifact.type === 'deployment' ? '🌐' : '📄'}
                </div>
                <div className="artifact-info">
                  <h4>{artifact.name}</h4>
                  <p className="artifact-type">{artifact.type}</p>
                  {artifact.url && (
                    <a href={artifact.url} target="_blank" rel="noopener noreferrer" className="artifact-link">
                      View →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="timeline-section">
        <h3>Execution Timeline</h3>
        <div className="timeline">
          {steps.map((step, index) => (
            <div key={step.id} className={`timeline-item ${step.type.toLowerCase()}`}>
              <div className="timeline-marker">
                <span className="timeline-icon">{getStepIcon(step.type)}</span>
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="timeline-phase">{step.phase}</span>
                  <span className="timeline-type">{step.type}</span>
                  <span className="timeline-time">{formatDate(step.created_at)}</span>
                </div>
                <div className="timeline-body">
                  <pre>{step.content}</pre>
                  {step.metadata && Object.keys(step.metadata).length > 0 && (
                    <details className="timeline-metadata">
                      <summary>Metadata</summary>
                      <pre>{JSON.stringify(step.metadata, null, 2)}</pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
