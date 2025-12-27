/**
 * Creator Navigation Component
 * 
 * Quick access to creator economy features
 */

import { useNavigate, useLocation } from 'react-router-dom';
import './CreatorNav.css';

export function CreatorNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      path: '/create-morgy',
      icon: '🎨',
      label: 'Create Morgy',
      description: 'Build your custom AI agent'
    },
    {
      path: '/marketplace',
      icon: '🏪',
      label: 'Marketplace',
      description: 'Browse & sell Morgys'
    },
    {
      path: '/knowledge-base',
      icon: '📚',
      label: 'Knowledge',
      description: 'Manage your knowledge base'
    }
  ];

  return (
    <div className="creator-nav">
      {navItems.map((item) => (
        <button
          key={item.path}
          className={`creator-nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="creator-nav-icon">{item.icon}</span>
          <div className="creator-nav-content">
            <div className="creator-nav-label">{item.label}</div>
            <div className="creator-nav-description">{item.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
