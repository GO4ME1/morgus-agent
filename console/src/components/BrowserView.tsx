import { useState } from 'react';
import './BrowserView.css';

interface BrowserViewProps {
  liveViewUrl: string;
  sessionId?: string;
}

export function BrowserView({ liveViewUrl, sessionId }: BrowserViewProps) {
  const [isClosed, setIsClosed] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = async () => {
    setIsClosing(true);
    
    // Try to close the session on the backend
    if (sessionId) {
      try {
        await fetch('https://morgus-deploy.fly.dev/close-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });
      } catch (error) {
        console.error('Failed to close session:', error);
      }
    }
    
    setIsClosed(true);
    setIsClosing(false);
  };

  if (isClosed) {
    return (
      <div className="browser-view-closed">
        🌐 Browser session closed
      </div>
    );
  }

  return (
    <div className="browser-view-container">
      <div className="browser-view-header">
        <div className="browser-view-title">
          🌐 Live Browser View
        </div>
        <div className="browser-view-controls">
          <a 
            href={liveViewUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="browser-view-btn"
            title="Open in new tab (full size)"
          >
            ↗
          </a>
          <button 
            className="browser-view-btn browser-view-close"
            onClick={handleClose}
            disabled={isClosing}
            title="Close browser session"
          >
            {isClosing ? '...' : '✕'}
          </button>
        </div>
      </div>
      
      <div className="browser-view-iframe-container">
        <iframe
          src={liveViewUrl}
          className="browser-view-iframe"
          title="Live Browser View"
          sandbox="allow-same-origin allow-scripts allow-forms allow-pointer-lock allow-popups"
          allow="clipboard-read; clipboard-write"
        />
        <div className="browser-view-footer">
          💡 <strong>Tip:</strong> Click "↗" to open full-size in new tab for easier interaction. 
          <span className="browser-view-takeover">Need to login or solve CAPTCHA? Open in new tab!</span>
        </div>
      </div>
    </div>
  );
}
