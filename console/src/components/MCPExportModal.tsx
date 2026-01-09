import React, { useState } from 'react';
import './MCPExportModal.css';

interface MCPExportModalProps {
  isVisible: boolean;
  onClose: () => void;
  morgy: {
    id: string;
    name: string;
    avatar: string;
  };
}

const MCPExportModal: React.FC<MCPExportModalProps> = ({ isVisible, onClose, morgy }) => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [includeKnowledge, setIncludeKnowledge] = useState(true);

  if (!isVisible) return null;

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://morgus-deploy.fly.dev';
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${API_URL}/api/mcp/config/${morgy.id}?includeKnowledge=${includeKnowledge}`, {
        headers: {
          'x-user-id': token || '',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate MCP config');
      }

      const configText = await response.text();
      setConfig(configText);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!config) return;

    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${morgy.name.toLowerCase().replace(/\s+/g, '-')}-mcp.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!config) return;
    navigator.clipboard.writeText(config);
    alert('Config copied to clipboard!');
  };

  return (
    <div className="mcp-export-overlay" onClick={onClose}>
      <div className="mcp-export-modal" onClick={(e) => e.stopPropagation()}>
        <button className="mcp-export-close" onClick={onClose}>×</button>

        <div className="mcp-export-header">
          <span className="mcp-export-icon">{morgy.avatar}</span>
          <h2>Export {morgy.name} as MCP Server</h2>
        </div>

        <p className="mcp-export-description">
          Make this Morgy portable! Export it as an MCP server to use in Claude Desktop, Cursor, or any MCP-compatible AI.
        </p>

        {!config && (
          <div className="mcp-export-options">
            <label className="mcp-export-checkbox">
              <input
                type="checkbox"
                checked={includeKnowledge}
                onChange={(e) => setIncludeKnowledge(e.target.checked)}
              />
              <span>Include knowledge base (recommended)</span>
            </label>
          </div>
        )}

        {error && (
          <div className="mcp-export-error">
            ⚠️ {error}
          </div>
        )}

        {config ? (
          <div className="mcp-export-result">
            <h3>✅ MCP Config Generated!</h3>
            
            <div className="mcp-export-config">
              <pre>{config}</pre>
            </div>

            <div className="mcp-export-actions">
              <button className="mcp-export-btn primary" onClick={handleDownload}>
                📥 Download Config
              </button>
              <button className="mcp-export-btn secondary" onClick={handleCopy}>
                📋 Copy to Clipboard
              </button>
            </div>

            <div className="mcp-export-instructions">
              <h4>📖 Installation Instructions</h4>
              <ol>
                <li>Download the config file above</li>
                <li>Open Claude Desktop settings</li>
                <li>Add the config to <code>claude_desktop_config.json</code></li>
                <li>Restart Claude Desktop</li>
                <li>Type <code>@{morgy.name}</code> to use your Morgy!</li>
              </ol>
              <p>
                <a href="https://docs.manus.im/mcp-export" target="_blank" rel="noopener noreferrer">
                  📚 Full Installation Guide →
                </a>
              </p>
            </div>
          </div>
        ) : (
          <button
            className="mcp-export-btn primary large"
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? '⏳ Generating...' : '🚀 Generate MCP Config'}
          </button>
        )}
      </div>
    </div>
  );
};

export default MCPExportModal;
