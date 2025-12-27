/**
 * Quick Actions Panel
 * 
 * Fast access to common creator tasks
 */

import { useNavigate } from 'react-router-dom';
import './QuickActionsPanel.css';

interface QuickAction {
  id: string;
  icon: string;
  title: string;
  description: string;
  action: () => void;
  color: string;
}

export function QuickActionsPanel() {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      id: 'create',
      icon: '🎨',
      title: 'Create New Morgy',
      description: 'Build a custom AI agent from scratch',
      action: () => navigate('/create-morgy'),
      color: '#00d4aa'
    },
    {
      id: 'marketplace',
      icon: '🏪',
      title: 'Browse Marketplace',
      description: 'Discover and purchase Morgys',
      action: () => navigate('/marketplace'),
      color: '#00b4d8'
    },
    {
      id: 'knowledge',
      icon: '📚',
      title: 'Add Knowledge',
      description: 'Upload docs, scrape websites',
      action: () => navigate('/knowledge-base'),
      color: '#9b59b6'
    },
    {
      id: 'export',
      icon: '📤',
      title: 'Export to MCP',
      description: 'Use in Claude Desktop, Cursor',
      action: () => {
        // This would open the MCP export wizard
        alert('MCP Export coming soon! Navigate to a Morgy to export it.');
      },
      color: '#e74c3c'
    }
  ];

  return (
    <div className="quick-actions-panel">
      <h3>⚡ Quick Actions</h3>
      <div className="quick-actions-grid">
        {actions.map((action) => (
          <button
            key={action.id}
            className="quick-action-card"
            onClick={action.action}
            style={{
              '--action-color': action.color
            } as React.CSSProperties}
          >
            <div className="quick-action-icon">{action.icon}</div>
            <div className="quick-action-content">
              <div className="quick-action-title">{action.title}</div>
              <div className="quick-action-description">{action.description}</div>
            </div>
            <div className="quick-action-arrow">→</div>
          </button>
        ))}
      </div>
    </div>
  );
}
