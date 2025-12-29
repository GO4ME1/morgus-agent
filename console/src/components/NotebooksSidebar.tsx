/**
 * Notebooks Sidebar Component
 * 
 * Left sidebar showing user's NotebookLM notebooks
 */

import React, { useState, useEffect } from 'react';
import { NOTEBOOKLM_CONFIG } from '../config/notebooklm';
import type { Notebook } from '../config/notebooklm';
import './NotebooksSidebar.css';

interface NotebooksSidebarProps {
  onSelectNotebook: (notebookId: string) => void;
  selectedNotebookId?: string;
}

export const NotebooksSidebar: React.FC<NotebooksSidebarProps> = ({
  onSelectNotebook,
  selectedNotebookId
}) => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewNotebookDialog, setShowNewNotebookDialog] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');

  useEffect(() => {
    loadNotebooks();
  }, []);

  const loadNotebooks = async () => {
    try {
      setLoading(true);
      
      // Load from localStorage (will be replaced with API call)
      const stored = localStorage.getItem('morgus_notebooks');
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotebooks(parsed.map((n: { id: string; name: string; sourceCount: number; createdAt: string; updatedAt: string }) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt)
        })));
      } else {
        // Initialize with default notebook
        const defaultNotebook: Notebook = {
          id: NOTEBOOKLM_CONFIG.defaultNotebookId,
          name: 'Morgus Research',
          description: 'Main research notebook',
          createdAt: new Date(),
          updatedAt: new Date(),
          sourceCount: 0
        };
        setNotebooks([defaultNotebook]);
        localStorage.setItem('morgus_notebooks', JSON.stringify([defaultNotebook]));
      }
    } catch (error) {
      console.error('Failed to load notebooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotebook = async () => {
    if (!newNotebookName.trim()) return;

    const newNotebook: Notebook = {
      id: `notebook-${Date.now()}`,
      name: newNotebookName,
      createdAt: new Date(),
      updatedAt: new Date(),
      sourceCount: 0
    };

    const updated = [...notebooks, newNotebook];
    setNotebooks(updated);
    localStorage.setItem('morgus_notebooks', JSON.stringify(updated));
    
    setNewNotebookName('');
    setShowNewNotebookDialog(false);
    onSelectNotebook(newNotebook.id);
  };

  const handleOpenInNotebookLM = (notebookId: string) => {
    const url = `${NOTEBOOKLM_CONFIG.baseUrl}/notebook/${notebookId}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="notebooks-sidebar loading">
        <div className="loading-spinner">Loading notebooks...</div>
      </div>
    );
  }

  return (
    <div className="notebooks-sidebar">
      <div className="notebooks-header">
        <h3>📚 Notebooks</h3>
        <button
          className="btn-new-notebook"
          onClick={() => setShowNewNotebookDialog(true)}
          title="Create new notebook"
        >
          +
        </button>
      </div>

      <div className="notebooks-list">
        {notebooks.map((notebook) => (
          <div
            key={notebook.id}
            className={`notebook-item ${selectedNotebookId === notebook.id ? 'selected' : ''}`}
            onClick={() => onSelectNotebook(notebook.id)}
          >
            <div className="notebook-info">
              <div className="notebook-name">{notebook.name}</div>
              {notebook.description && (
                <div className="notebook-description">{notebook.description}</div>
              )}
              <div className="notebook-meta">
                {notebook.sourceCount} sources
              </div>
            </div>
            <button
              className="btn-open-external"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenInNotebookLM(notebook.id);
              }}
              title="Open in NotebookLM"
            >
              ↗
            </button>
          </div>
        ))}
      </div>

      {notebooks.length === 0 && (
        <div className="empty-state">
          <p>No notebooks yet</p>
          <button onClick={() => setShowNewNotebookDialog(true)}>
            Create your first notebook
          </button>
        </div>
      )}

      {showNewNotebookDialog && (
        <div className="dialog-overlay" onClick={() => setShowNewNotebookDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h4>Create New Notebook</h4>
            <input
              type="text"
              placeholder="Notebook name"
              value={newNotebookName}
              onChange={(e) => setNewNotebookName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateNotebook()}
              autoFocus
            />
            <div className="dialog-actions">
              <button onClick={() => setShowNewNotebookDialog(false)}>Cancel</button>
              <button
                onClick={handleCreateNotebook}
                disabled={!newNotebookName.trim()}
                className="primary"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
