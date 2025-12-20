import React, { useState } from 'react';
import './MorgyPen.css';

interface Morgy {
  id: string;
  name: string;
  title: string;
  description: string;
  color: 'green' | 'pink' | 'blue' | 'purple' | 'orange';
  level: number;
  xp: number;
  maxXp: number;
  avatar: string;
  isActive: boolean;
}

interface MorgyPenProps {
  isVisible: boolean;
  onActivateMorgy: (morgyId: string) => void;
  onDeactivateMorgy: (morgyId: string) => void;
  activeMorgys: string[];
}

// Default Morgys data
const DEFAULT_MORGYS: Morgy[] = [
  {
    id: 'bill',
    name: 'Bill',
    title: 'The Marketing Hog',
    description: 'Growth, hooks, landing pages, CTAs',
    color: 'green',
    level: 3,
    xp: 750,
    maxXp: 1000,
    avatar: '🐷',
    isActive: false,
  },
  {
    id: 'sally',
    name: 'Sally',
    title: 'The Promo Pig',
    description: 'Campaigns, ads, referrals, promos',
    color: 'pink',
    level: 2,
    xp: 450,
    maxXp: 750,
    avatar: '🐷',
    isActive: false,
  },
  {
    id: 'professor-hogsworth',
    name: 'Prof. Hogsworth',
    title: 'Research Expert',
    description: 'Research, design, complex problems',
    color: 'blue',
    level: 5,
    xp: 900,
    maxXp: 1500,
    avatar: '🐷',
    isActive: false,
  },
];

const MorgyPen: React.FC<MorgyPenProps> = ({
  isVisible,
  onActivateMorgy,
  onDeactivateMorgy,
  activeMorgys,
}) => {
  const [morgys] = useState<Morgy[]>(DEFAULT_MORGYS);
  const [showAddModal, setShowAddModal] = useState(false);

  if (!isVisible) return null;

  const getColorClass = (color: string) => {
    switch (color) {
      case 'green': return 'morgy-green';
      case 'pink': return 'morgy-pink';
      case 'blue': return 'morgy-blue';
      case 'purple': return 'morgy-purple';
      case 'orange': return 'morgy-orange';
      default: return 'morgy-green';
    }
  };

  const handleToggleMorgy = (morgyId: string) => {
    if (activeMorgys.includes(morgyId)) {
      onDeactivateMorgy(morgyId);
    } else {
      onActivateMorgy(morgyId);
    }
  };

  return (
    <div className="morgy-pen">
      <div className="morgy-pen-header">
        <span className="morgy-pen-icon">🐷</span>
        <span className="morgy-pen-title">Morgy Pen</span>
      </div>

      <div className="morgy-grid">
        {morgys.map((morgy) => {
          const isActive = activeMorgys.includes(morgy.id);
          return (
            <div
              key={morgy.id}
              className={`morgy-card ${getColorClass(morgy.color)} ${isActive ? 'active' : ''}`}
              onClick={() => handleToggleMorgy(morgy.id)}
            >
              <div className="morgy-avatar">
                {morgy.avatar}
              </div>
              <div className="morgy-info">
                <div className="morgy-name">{morgy.name}</div>
                <div className="morgy-level">Lvl {morgy.level}</div>
              </div>
              <div className="morgy-xp-bar">
                <div
                  className="morgy-xp-fill"
                  style={{ width: `${(morgy.xp / morgy.maxXp) * 100}%` }}
                />
              </div>
              <div className="morgy-actions">
                <button
                  className={`morgy-activate-btn ${isActive ? 'active' : ''}`}
                  title={isActive ? 'Deactivate' : 'Activate'}
                >
                  {isActive ? '✓' : '⚡'}
                </button>
              </div>
              {isActive && <div className="morgy-active-indicator">Active</div>}
            </div>
          );
        })}

        <div
          className="morgy-card add-morgy"
          onClick={() => setShowAddModal(true)}
        >
          <div className="add-morgy-icon">+</div>
          <div className="add-morgy-text">Add Morgy</div>
        </div>
      </div>

      <div className="morgy-pen-footer">
        <div className="sounder-info">
          <span className="sounder-label">Your Sounder</span>
          <span className="sounder-count">{activeMorgys.length} active</span>
        </div>
      </div>

      {showAddModal && (
        <div className="morgy-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="morgy-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create Custom Morgy</h3>
            <p>Custom Morgys coming soon! 🐷</p>
            <button onClick={() => setShowAddModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MorgyPen;
