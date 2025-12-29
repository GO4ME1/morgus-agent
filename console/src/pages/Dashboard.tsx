import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Task } from '../lib/supabase';

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchTasks();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Task Dashboard</h2>
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All ({tasks.length})
          </button>
          <button 
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            Pending ({tasks.filter(t => t.status === 'pending').length})
          </button>
          <button 
            className={filter === 'running' ? 'active' : ''}
            onClick={() => setFilter('running')}
          >
            Running ({tasks.filter(t => t.status === 'running').length})
          </button>
          <button 
            className={filter === 'completed' ? 'active' : ''}
            onClick={() => setFilter('completed')}
          >
            Completed ({tasks.filter(t => t.status === 'completed').length})
          </button>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <p>No tasks found. <Link to="/new">Create your first task</Link></p>
        </div>
      ) : (
        <div className="task-list">
          {filteredTasks.map(task => (
            <Link to={`/task/${task.id}`} key={task.id} className="task-card">
              <div className="task-card-header">
                <h3>{task.title}</h3>
                <span className={`badge ${getStatusBadge(task.status)}`}>
                  {task.status}
                </span>
              </div>
              <p className="task-description">{task.description}</p>
              <div className="task-meta">
                <span className="task-phase">Phase: {task.phase}</span>
                <span className="task-date">{formatDate(task.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
