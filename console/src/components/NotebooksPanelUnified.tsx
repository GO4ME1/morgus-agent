import React, { useState, useEffect } from 'react';
import { notebookLMService } from '../services/notebooklm';
import './NotebooksPanel.css';

interface MorgusNotebook {
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

export const NotebooksPanelUnified: React.FC<NotebooksPanelProps> = ({
  userId,
  onNotebookSelect,
}) => {
  // Tabs
  const [activeTab, setActiveTab] = useState<'morgus' | 'notebooklm'>('morgus');
  
  // Morgus Notebooks
  const [morgusNotebooks, setMorgusNotebooks] = useState<MorgusNotebook[]>([]);
  const [selectedMorgusNotebook, setSelectedMorgusNotebook] = useState<MorgusNotebook | null>(null);
  const [assets, setAssets] = useState<NotebookAsset[]>([]);
  const [morgusViewMode, setMorgusViewMode] = useState<'list' | 'detail'>('list');
  const [dailyLimit, setDailyLimit] = useState({ used: 0, total: 5 });
  
  // NotebookLM
  const [notebooklmNotebooks, setNotebooklmNotebooks] = useState<NotebookLMNotebook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadMorgusNotebooks();
      loadDailyLimit();
      loadNotebookLMNotebooks();
    }
  }, [userId]);

  // Morgus Notebooks Functions
  const loadMorgusNotebooks = async () => {
    try {
      const response = await fetch(
        `https://morgus-orchestrator.morgan-426.workers.dev/api/notebooks?user_id=${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        setMorgusNotebooks(data.notebooks || []);
      }
    } catch {
      console.error('Failed to load Morgus notebooks:', error);
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

  const handleMorgusNotebookClick = async (notebook: MorgusNotebook) => {
    setSelectedMorgusNotebook(notebook);
    setMorgusViewMode('detail');
    await loadNotebookAssets(notebook.id);
    onNotebookSelect(notebook.id);
  };

  const handleBackToMorgusList = () => {
    setMorgusViewMode('list');
    setSelectedMorgusNotebook(null);
    setAssets([]);
  };

  const handleDeleteMorgusNotebook = async (notebookId: string, e: React.MouseEvent) => {
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
        await loadMorgusNotebooks();
        if (selectedMorgusNotebook?.id === notebookId) {
          handleBackToMorgusList();
        }
      }
    } catch {
      console.error('Failed to delete notebook:', error);
    }
  };

  // NotebookLM Functions
  const loadNotebookLMNotebooks = async () => {
    try {
      const notebooks = notebookLMService.getNotebooks();
      setNotebooklmNotebooks(notebooks);
    } catch {
      console.error('Failed to load NotebookLM notebooks:', error);
    }
  };

  const handleCreateNotebookLM = () => {
    const name = prompt('Enter notebook name:');
    if (name) {
      notebookLMService.createNotebook(name);
      loadNotebookLMNotebooks();
    }
  };

  const handleOpenNotebookLM = (notebookId: string) => {
    notebookLMService.openNotebook(notebookId);
  };

  // Helper Functions
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

  // Render Tabs
  const renderTabs = () => (
    <div className="notebooks-tabs">
      <button
        className={`tab ${activeTab === 'morgus' ? 'active' : ''}`}
        onClick={() => setActiveTab('morgus')}
      >
        📚 Morgus
      </button>
      <button
        className={`tab ${activeTab === 'notebooklm' ? 'active' : ''}`}
        onClick={() => setActiveTab('notebooklm')}
      >
        💭 NotebookLM
      </button>
    </div>
  );

  // Render Morgus Notebooks Tab
  const renderMorgusTab = () => {
    if (morgusViewMode === 'detail' && selectedMorgusNotebook) {
      return (
        <div className="notebook-detail-view">
          <div className="notebooks-header">
            <button className="back-btn" onClick={handleBackToMorgusList}>
              ← Back
            </button>
            <h3>{getPurposeEmoji(selectedMorgusNotebook.purpose)} {selectedMorgusNotebook.title}</h3>
          </div>

          <div className="notebook-detail">
            <div className="notebook-meta-detail">
              <span className="purpose-badge">
                {selectedMorgusNotebook.purpose.replace(/_/g, ' ')}
              </span>
              <span className="date-badge">
                {formatDate(selectedMorgusNotebook.created_at)}
              </span>
            </div>

            {selectedMorgusNotebook.summary && (
              <div className="notebook-summary-full">
                <h4>Summary</h4>
                <p>{selectedMorgusNotebook.summary}</p>
              </div>
            )}

            {selectedMorgusNotebook.sections && selectedMorgusNotebook.sections.length > 0 && (
              <div className="notebook-sections">
                <h4>Contents</h4>
                {selectedMorgusNotebook.sections.map((section, idx) => (
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
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="notebooks-header">
          <h3>📚 Morgus Notebooks</h3>
          <div className="daily-limit">
            {dailyLimit.used}/{dailyLimit.total} today
          </div>
        </div>

        {morgusNotebooks.length === 0 ? (
          <div className="notebooks-empty">
            <p>No notebooks yet!</p>
            <p className="empty-hint">
              Ask Morgus to create a notebook from your research
            </p>
          </div>
        ) : (
          <div className="notebooks-list">
            {morgusNotebooks.map((notebook) => (
              <div
                key={notebook.id}
                className="notebook-item"
                onClick={() => handleMorgusNotebookClick(notebook)}
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
                  onClick={(e) => handleDeleteMorgusNotebook(notebook.id, e)}
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
  };

  // Render NotebookLM Tab
  const renderNotebookLMTab = () => (
    <div>
      <div className="notebooks-header">
        <h3>💭 NotebookLM</h3>
        <button className="create-notebook-btn" onClick={handleCreateNotebookLM}>
          + New
        </button>
      </div>

      {notebooklmNotebooks.length === 0 ? (
        <div className="notebooks-empty">
          <p>No NotebookLM notebooks yet!</p>
          <p className="empty-hint">
            Click [+] on messages to save them to NotebookLM
          </p>
          <button className="create-notebook-btn-large" onClick={handleCreateNotebookLM}>
            + Create Your First Notebook
          </button>
        </div>
      ) : (
        <div className="notebooks-list">
          {notebooklmNotebooks.map((notebook) => (
            <div
              key={notebook.id}
              className="notebook-item notebooklm-item"
              onClick={() => handleOpenNotebookLM(notebook.id)}
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
                  handleOpenNotebookLM(notebook.id);
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

  return (
    <div className="notebooks-panel">
      {renderTabs()}
      <div className="notebooks-content">
        {activeTab === 'morgus' ? renderMorgusTab() : renderNotebookLMTab()}
      </div>
    </div>
  );
};
