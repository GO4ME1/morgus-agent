import React, { useState, useEffect } from 'react';
import './NotebooksPanel.css';

interface Notebook {
  id: string;
  user_id: string;
  purpose: string;
  title: string;
  summary: string;
  raw_notebook: string;
  sections: NotebookSection[];
  mindmap: unknown;
  flowchart: unknown;
  created_at: string;
  updated_at: string;
}

interface NotebookSection {
  title: string;
  bullets: string[];
}

interface NotebookAsset {
  id: string;
  notebook_id: string;
  type: string;
  label: string;
  content: string;
  created_at: string;
}

interface NotebooksPanelProps {
  userId: string | null;
  onNotebookSelect: (notebookId: string) => void;
}

export const NotebooksPanel: React.FC<NotebooksPanelProps> = ({
  userId,
  onNotebookSelect,
}) => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
  const [assets, setAssets] = useState<NotebookAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [dailyLimit, setDailyLimit] = useState({ used: 0, total: 5 });

  useEffect(() => {
    if (userId) {
      loadNotebooks();
      loadDailyLimit();
    }
  }, [userId]);

  const loadNotebooks = async () => {
    try {
      const response = await fetch(
        `https://morgus-orchestrator.morgan-426.workers.dev/api/notebooks?user_id=${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        setNotebooks(data.notebooks || []);
      }
    } catch {
      console.error('Failed to load notebooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyLimit = async () => {
    try {
      const response = await fetch(
        `https://morgus-orchestrator.morgan-426.workers.dev/api/notebooks/daily-limit?user_id=${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        setDailyLimit(data);
      }
    } catch {
      console.error('Failed to load daily limit:', error);
    }
  };

  const loadNotebookAssets = async (notebookId: string) => {
    try {
      const response = await fetch(
        `https://morgus-orchestrator.morgan-426.workers.dev/api/notebooks/${notebookId}/assets`
      );
      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets || []);
      }
    } catch {
      console.error('Failed to load notebook assets:', error);
    }
  };

  const handleNotebookClick = async (notebook: Notebook) => {
    setSelectedNotebook(notebook);
    setViewMode('detail');
    await loadNotebookAssets(notebook.id);
    onNotebookSelect(notebook.id);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedNotebook(null);
    setAssets([]);
  };

  const handleDelete = async (notebookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Delete this notebook? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(
        `https://morgus-orchestrator.morgan-426.workers.dev/api/notebooks/${notebookId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        await loadNotebooks();
        if (selectedNotebook?.id === notebookId) {
          handleBackToList();
        }
      }
    } catch {
      console.error('Failed to delete notebook:', error);
    }
  };

  const getPurposeEmoji = (purpose: string): string => {
    const emojiMap: Record<string, string> = {
      deep_research: '🔬',
      study_guide: '📚',
      faq: '❓',
      timeline: '📅',
      infographic_generation: '📊',
      roadmap: '🗺️',
    };
    return emojiMap[purpose] || '📓';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="notebooks-panel">Loading...</div>;
  }

  // List View
  if (viewMode === 'list') {
    return (
      <div className="notebooks-panel">
        <div className="notebooks-header">
          <h3>📓 Notebooks</h3>
          <div className="daily-limit">
            {dailyLimit.used}/{dailyLimit.total} today
          </div>
        </div>

        {notebooks.length === 0 ? (
          <div className="notebooks-empty">
            <p>No notebooks yet!</p>
            <p className="empty-hint">
              Ask Morgy to create a notebook from your research
            </p>
          </div>
        ) : (
          <div className="notebooks-list">
            {notebooks.map((notebook) => (
              <div
                key={notebook.id}
                className="notebook-item"
                onClick={() => handleNotebookClick(notebook)}
              >
                <div className="notebook-icon">
                  {getPurposeEmoji(notebook.purpose)}
                </div>
                <div className="notebook-content">
                  <div className="notebook-title">{notebook.title}</div>
                  <div className="notebook-meta">
                    <span className="notebook-purpose">
                      {notebook.purpose.replace(/_/g, ' ')}
                    </span>
                    <span className="notebook-date">
                      {formatDate(notebook.created_at)}
                    </span>
                  </div>
                  {notebook.summary && (
                    <div className="notebook-summary">
                      {notebook.summary.substring(0, 100)}
                      {notebook.summary.length > 100 ? '...' : ''}
                    </div>
                  )}
                </div>
                <button
                  className="delete-notebook-btn"
                  onClick={(e) => handleDelete(notebook.id, e)}
                  title="Delete Notebook"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Detail View
  return (
    <div className="notebooks-panel notebook-detail-view">
      <div className="notebooks-header">
        <button className="back-btn" onClick={handleBackToList}>
          ← Back
        </button>
        <h3>{getPurposeEmoji(selectedNotebook!.purpose)} {selectedNotebook!.title}</h3>
      </div>

      <div className="notebook-detail">
        <div className="notebook-meta-detail">
          <span className="purpose-badge">
            {selectedNotebook!.purpose.replace(/_/g, ' ')}
          </span>
          <span className="date-badge">
            {formatDate(selectedNotebook!.created_at)}
          </span>
        </div>

        {selectedNotebook!.summary && (
          <div className="notebook-summary-full">
            <h4>Summary</h4>
            <p>{selectedNotebook!.summary}</p>
          </div>
        )}

        {selectedNotebook!.sections && selectedNotebook!.sections.length > 0 && (
          <div className="notebook-sections">
            <h4>Contents</h4>
            {selectedNotebook!.sections.map((section, idx) => (
              <div key={idx} className="notebook-section">
                <h5>{section.title}</h5>
                <ul>
                  {section.bullets.map((bullet, bulletIdx) => (
                    <li key={bulletIdx}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {assets.length > 0 && (
          <div className="notebook-assets">
            <h4>Visual Assets</h4>
            <div className="assets-grid">
              {assets.map((asset) => (
                <div key={asset.id} className="asset-item">
                  <div className="asset-label">{asset.label}</div>
                  {asset.type.includes('svg') ? (
                    <div
                      className="asset-svg"
                      dangerouslySetInnerHTML={{ __html: asset.content }}
                    />
                  ) : (
                    <img
                      src={asset.content}
                      alt={asset.label}
                      className="asset-image"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedNotebook!.mindmap && (
          <div className="notebook-mindmap">
            <h4>Mind Map</h4>
            <div className="mindmap-placeholder">
              Mind map visualization coming soon
            </div>
          </div>
        )}

        {selectedNotebook!.flowchart && (
          <div className="notebook-flowchart">
            <h4>Flow Chart</h4>
            <div className="flowchart-placeholder">
              Flow chart visualization coming soon
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
