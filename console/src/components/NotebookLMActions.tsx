/**
 * NotebookLM Actions Component
 * 
 * + button (add to notebook) and thought cloud (pull from notebook) for chat messages
 */

import React, { useState } from 'react';
import './NotebookLMActions.css';

interface NotebookLMActionsProps {
  messageId: string;
  messageContent: string;
  currentNotebookId?: string;
  onAddToNotebook: (messageId: string, notebookId: string) => Promise<void>;
  onPullFromNotebook: (notebookId: string) => Promise<string>;
}

export const NotebookLMActions: React.FC<NotebookLMActionsProps> = ({
  messageId,
  messageContent: _messageContent,
  currentNotebookId,
  onAddToNotebook,
  onPullFromNotebook
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showPullMenu, setShowPullMenu] = useState(false);
  const [adding, setAdding] = useState(false);
  const [pulling, setPulling] = useState(false);

  const handleAddToNotebook = async () => {
    if (!currentNotebookId) {
      alert('Please select a notebook first');
      return;
    }

    try {
      setAdding(true);
      await onAddToNotebook(messageId, currentNotebookId);
      setShowAddMenu(false);
      
      // Show success feedback
      const btn = document.querySelector(`[data-message-id="${messageId}"] .btn-add-to-notebook`);
      if (btn) {
        btn.classList.add('success');
        setTimeout(() => btn.classList.remove('success'), 2000);
      }
    } catch (error) {
      console.error('Failed to add to notebook:', error);
      alert('Failed to add to notebook');
    } finally {
      setAdding(false);
    }
  };

  const handlePullFromNotebook = async () => {
    if (!currentNotebookId) {
      alert('Please select a notebook first');
      return;
    }

    try {
      setPulling(true);
      const response = await onPullFromNotebook(currentNotebookId);
      setShowPullMenu(false);
      
      // The response will be inserted into chat by the parent component
      console.log('Pulled from notebook:', response);
    } catch (error) {
      console.error('Failed to pull from notebook:', error);
      alert('Failed to pull from notebook');
    } finally {
      setPulling(false);
    }
  };

  return (
    <div className="notebooklm-actions" data-message-id={messageId}>
      {/* Add to Notebook Button */}
      <div className="action-button-wrapper">
        <button
          className="btn-add-to-notebook"
          onClick={() => setShowAddMenu(!showAddMenu)}
          title="Add to NotebookLM"
          disabled={adding}
        >
          {adding ? '⏳' : '+'}
        </button>
        
        {showAddMenu && (
          <div className="action-menu">
            <div className="menu-header">Add to Notebook</div>
            <div className="menu-content">
              <p>Add this message to your NotebookLM notebook?</p>
              {currentNotebookId ? (
                <div className="menu-actions">
                  <button onClick={() => setShowAddMenu(false)}>Cancel</button>
                  <button onClick={handleAddToNotebook} className="primary">
                    Add
                  </button>
                </div>
              ) : (
                <div className="menu-warning">
                  Please select a notebook from the sidebar first.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pull from Notebook Button (Thought Cloud) */}
      <div className="action-button-wrapper">
        <button
          className="btn-pull-from-notebook"
          onClick={() => setShowPullMenu(!showPullMenu)}
          title="Get insights from NotebookLM"
          disabled={pulling}
        >
          {pulling ? '⏳' : '💭'}
        </button>
        
        {showPullMenu && (
          <div className="action-menu">
            <div className="menu-header">Get Insights</div>
            <div className="menu-content">
              <p>Get AI-powered insights from your NotebookLM notebook?</p>
              {currentNotebookId ? (
                <div className="menu-actions">
                  <button onClick={() => setShowPullMenu(false)}>Cancel</button>
                  <button onClick={handlePullFromNotebook} className="primary">
                    Get Insights
                  </button>
                </div>
              ) : (
                <div className="menu-warning">
                  Please select a notebook from the sidebar first.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Simplified version for message input area
 */
export const NotebookLMInputActions: React.FC<{
  currentNotebookId?: string;
  onPullFromNotebook: (notebookId: string) => Promise<string>;
}> = ({ currentNotebookId, onPullFromNotebook }) => {
  const [pulling, setPulling] = useState(false);

  const handlePull = async () => {
    if (!currentNotebookId) {
      alert('Please select a notebook first');
      return;
    }

    try {
      setPulling(true);
      await onPullFromNotebook(currentNotebookId);
    } catch (error) {
      console.error('Failed to pull from notebook:', error);
      alert('Failed to pull from notebook');
    } finally {
      setPulling(false);
    }
  };

  return (
    <button
      className="btn-notebook-input-action"
      onClick={handlePull}
      disabled={pulling || !currentNotebookId}
      title="Get insights from NotebookLM"
    >
      {pulling ? '⏳' : '💭'}
    </button>
  );
};
