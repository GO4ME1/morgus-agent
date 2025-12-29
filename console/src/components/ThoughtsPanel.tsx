import React, { useState, useEffect } from 'react';
import './ThoughtsPanel.css';

interface Thought {
  id: string;
  title: string;
  description: string | null;
  custom_instructions: string | null;
  model_preference: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface ThoughtsPanelProps {
  currentThoughtId: string | null;
  onThoughtChange: (thoughtId: string) => void;
  onThoughtCreate: (title: string, description?: string) => void;
}

export const ThoughtsPanel: React.FC<ThoughtsPanelProps> = ({
  currentThoughtId,
  onThoughtChange,

}) => {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThoughts();
  }, []);

  const loadThoughts = async () => {
    try {
      const response = await fetch('https://morgus-orchestrator.morgan-426.workers.dev/api/thoughts');
      if (response.ok) {
        const data = await response.json();
        setThoughts(data.thoughts || []);
        
        // If no current thought selected, select the default one
        if (!currentThoughtId && data.thoughts.length > 0) {
          const defaultThought = data.thoughts.find((t: Thought) => t.is_default) || data.thoughts[0];
          onThoughtChange(defaultThought.id);
        }
      }
    } catch {
      console.error('Failed to load thoughts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;

    try {
      const response = await fetch('https://morgus-orchestrator.morgan-426.workers.dev/api/thoughts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await loadThoughts();
        onThoughtChange(data.thought.id);
        setIsCreating(false);
        setNewTitle('');
        setNewDescription('');
      }
    } catch {
      console.error('Failed to create thought:', error);
    }
  };

  const handleDelete = async (thoughtId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Delete this Thought? This will remove all associated messages.')) {
      return;
    }

    try {
      const response = await fetch(`https://morgus-orchestrator.morgan-426.workers.dev/api/thoughts/${thoughtId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadThoughts();
        if (currentThoughtId === thoughtId) {
          const defaultThought = thoughts.find(t => t.is_default);
          if (defaultThought) {
            onThoughtChange(defaultThought.id);
          }
        }
      }
    } catch {
      console.error('Failed to delete thought:', error);
    }
  };

  if (loading) {
    return <div className="thoughts-panel">Loading...</div>;
  }

  return (
    <div className="thoughts-panel">
      <div className="thoughts-header">
        <h3>💭 Thoughts</h3>
        <button 
          className="create-thought-btn"
          onClick={() => setIsCreating(!isCreating)}
          title="Create new Thought"
        >
          +
        </button>
      </div>

      {isCreating && (
        <div className="thought-creator">
          <input
            type="text"
            placeholder="Thought title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <textarea
            placeholder="Description (optional)..."
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={2}
          />
          <div className="creator-actions">
            <button onClick={handleCreate} disabled={!newTitle.trim()}>
              Create
            </button>
            <button onClick={() => {
              setIsCreating(false);
              setNewTitle('');
              setNewDescription('');
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="thoughts-list">
        {thoughts.map((thought) => (
          <div
            key={thought.id}
            className={`thought-item ${currentThoughtId === thought.id ? 'active' : ''}`}
            onClick={() => onThoughtChange(thought.id)}
          >
            <div className="thought-content">
              <div className="thought-title">{thought.title}</div>
              {thought.description && (
                <div className="thought-description">{thought.description}</div>
              )}
            </div>
            {!thought.is_default && (
              <button
                className="delete-thought-btn"
                onClick={(e) => handleDelete(thought.id, e)}
                title="Delete Thought"
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
