import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function NewTask() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [model, setModel] = useState('gpt-4');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title,
            description,
            model,
            status: 'pending',
            phase: 'RESEARCH'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Redirect to task detail page
      navigate(`/task/${data.id}`);
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="new-task">
      <h2>Create New Task</h2>
      
      <form onSubmit={handleSubmit} className="task-form">
        <div className="form-group">
          <label htmlFor="title">Task Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Build a personal blog website"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Task Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you want Morgus to build or accomplish..."
            rows={6}
            required
          />
          <small>Be as specific as possible. Include requirements, preferences, and any constraints.</small>
        </div>

        <div className="form-group">
          <label htmlFor="model">AI Model</label>
          <select
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="gpt-4">GPT-4 (Recommended)</option>
            <option value="gpt-5.1">GPT-5.1 (Advanced)</option>
          </select>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>

      <div className="task-info">
        <h3>How Morgus Works</h3>
        <ol>
          <li><strong>Research:</strong> Morgus gathers information and understands requirements</li>
          <li><strong>Plan:</strong> Creates a detailed implementation plan</li>
          <li><strong>Build:</strong> Generates code and configuration files</li>
          <li><strong>Execute:</strong> Tests and deploys the solution</li>
          <li><strong>Finalize:</strong> Commits to git and reports results</li>
        </ol>
      </div>
    </div>
  );
}
