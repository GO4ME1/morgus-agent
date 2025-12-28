import React, { useState, useEffect } from 'react';
import { notebookLMService } from '../services/notebooklm';
import './NotebooksPanel.css';

interface NotebookLMNotebook {
  id: string;
  name: string;
  sourceCount: number;
  type: 'personal' | 'shared' | 'public';
}

interface NotebooksPanelProps {
  userId: string | null;
  onNotebookSelect: (notebookId: string) => void;
}

export const NotebooksPanelSimple: React.FC<NotebooksPanelProps> = ({
  userId,
  onNotebookSelect,
}) => {
  const [notebooks, setNotebooks] = useState<NotebookLMNotebook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadNotebooks();
    }
  }, [userId]);

  const loadNotebooks = async () => {
    try {
      const notebooks = notebookLMService.getNotebooks();
      setNotebooks(notebooks);
    } catch (error) {
      console.error('Failed to load NotebookLM notebooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotebook = () => {
    const name = prompt('Enter notebook name:');
    if (name) {
      notebookLMService.createNotebook(name);
      loadNotebooks();
    }
  };

  const handleOpenNotebook = (notebookId: string) => {
    notebookLMService.openNotebook(notebookId);
    onNotebookSelect(notebookId);
  };

  if (loading) {
    return <div className="notebooks-panel">Loading...</div>;
  }

  return (
    <div className="notebooks-panel">
      <div className="notebooks-header">
        <h3>💭 NotebookLM</h3>
        <button className="create-notebook-btn" onClick={handleCreateNotebook}>
          + New
        </button>
      </div>

      {notebooks.length === 0 ? (
        <div className="notebooks-empty">
          <p>No notebooks yet!</p>
          <p className="empty-hint">
            Click [+] on messages to save them to NotebookLM
          </p>
          <button className="create-notebook-btn-large" onClick={handleCreateNotebook}>
            + Create Your First Notebook
          </button>
        </div>
      ) : (
        <div className="notebooks-list">
          {notebooks.map((notebook) => (
            <div
              key={notebook.id}
              className="notebook-item notebooklm-item"
              onClick={() => handleOpenNotebook(notebook.id)}
            >
              <div className="notebook-icon">
                {notebook.type === 'personal' ? '💭' : notebook.type === 'shared' ? '👥' : '🌐'}
              </div>
              <div className="notebook-content">
                <div className="notebook-title">{notebook.name}</div>
                <div className="notebook-meta">
                  <span className="notebook-purpose">
                    {notebook.type}
                  </span>
                  <span className="notebook-sources">
                    {notebook.sourceCount} sources
                  </span>
                </div>
              </div>
              <button
                className="open-external-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenNotebook(notebook.id);
                }}
                title="Open in NotebookLM"
              >
                ↗
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="notebooklm-hint">
        <p><strong>How to use:</strong></p>
        <ul>
          <li>Click <strong>[+]</strong> on any message to save it to NotebookLM</li>
          <li>Click <strong>[💭]</strong> to get AI insights from your notebooks</li>
          <li>Click <strong>[↗]</strong> to open notebook in NotebookLM</li>
        </ul>
      </div>
    </div>
  );
};
