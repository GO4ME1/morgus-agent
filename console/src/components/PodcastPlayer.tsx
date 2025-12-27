/**
 * Podcast Player Component
 * 
 * Displays podcast generation status and plays generated podcasts
 */

import React, { useState, useRef, useEffect } from 'react';
import './PodcastPlayer.css';

export interface PodcastPlayerProps {
  notebookId: string;
  notebookUrl: string;
  instructions: string;
  tips?: string[];
  estimatedTime?: number;
  onClose?: () => void;
}

export const PodcastPlayer: React.FC<PodcastPlayerProps> = ({
  notebookId,
  notebookUrl,
  instructions,
  tips,
  estimatedTime,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(notebookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenNotebook = () => {
    window.open(notebookUrl, '_blank');
  };

  const minutes = estimatedTime ? Math.round(estimatedTime / 60) : 3;

  return (
    <div className="podcast-player">
      <div className="podcast-header">
        <div className="podcast-icon">🎧</div>
        <div className="podcast-title">
          <h3>Podcast Generation Started!</h3>
          <p className="podcast-subtitle">Your conversation is ready for podcast generation</p>
        </div>
        {onClose && (
          <button className="podcast-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}
      </div>

      <div className="podcast-body">
        <div className="podcast-status">
          <div className="status-badge">
            <span className="status-dot pulsing"></span>
            <span>Ready to Generate</span>
          </div>
          <div className="estimated-time">
            ⏱️ Estimated: {minutes} minutes
          </div>
        </div>

        <div className="podcast-instructions">
          <h4>Next Steps:</h4>
          <ol>
            <li>Click "Open in NotebookLM" below</li>
            <li>Click "Generate Audio Overview" (top right)</li>
            <li>Wait {minutes} minutes for generation</li>
            <li>Download the MP3 when ready</li>
            <li>Enjoy your AI-generated podcast!</li>
          </ol>
        </div>

        {tips && tips.length > 0 && (
          <div className="podcast-tips">
            <h4>💡 Tips:</h4>
            <ul>
              {tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="podcast-actions">
          <button 
            className="btn-primary btn-large"
            onClick={handleOpenNotebook}
          >
            <span>↗</span>
            Open in NotebookLM
          </button>
          
          <button 
            className="btn-secondary"
            onClick={handleCopyUrl}
          >
            {copied ? '✓ Copied!' : '📋 Copy URL'}
          </button>
        </div>

        <div className="podcast-info">
          <h4>What you'll get:</h4>
          <div className="feature-grid">
            <div className="feature-item">
              <span className="feature-icon">🎙️</span>
              <span>2 AI hosts discussing your content</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⏱️</span>
              <span>5-15 minute podcast</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎧</span>
              <span>Natural conversation style</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📥</span>
              <span>Downloadable MP3</span>
            </div>
          </div>
        </div>

        <div className="podcast-coming-soon">
          <p>🚀 <strong>Coming soon:</strong> Automatic podcast generation right in Morgus chat!</p>
        </div>
      </div>
    </div>
  );
};

export default PodcastPlayer;
