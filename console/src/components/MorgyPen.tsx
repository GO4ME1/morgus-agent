import React, { useState } from 'react';
import './MorgyPen.css';

interface Morgy {
  id: string;
  name: string;
  title: string;
  level: number;
  xp: number;
  maxXp: number;
  color: string;
  borderColor: string;
  image: string;
  specialty: string;
}

interface MorgyPenProps {
  isVisible: boolean;
  activeMorgys: string[];
  onActivateMorgy: (morgyId: string) => void;
  onDeactivateMorgy: (morgyId: string) => void;
}

const DEFAULT_MORGYS: Morgy[] = [
  {
    id: 'bill',
    name: 'Bill',
    title: 'The Marketing Hog',
    level: 3,
    xp: 65,
    maxXp: 100,
    color: '#00ffff',
    borderColor: '#00ffff',
    image: '/morgys/bill.png',
    specialty: 'Growth, hooks, landing pages, CTAs, viral ideas'
  },
  {
    id: 'sally',
    name: 'Sally',
    title: 'The Promo Pig',
    level: 2,
    xp: 40,
    maxXp: 100,
    color: '#ff00ff',
    borderColor: '#ff00ff',
    image: '/morgys/sally.png',
    specialty: 'Campaigns, ads, referrals, promos, launch messaging'
  },
  {
    id: 'professor',
    name: 'Prof. Hogsworth',
    title: 'Research Expert',
    level: 5,
    xp: 85,
    maxXp: 100,
    color: '#00ffff',
    borderColor: '#00ffff',
    image: '/morgys/professor.png',
    specialty: 'Research, design, complex problems'
  }
];

const MorgyPen: React.FC<MorgyPenProps> = ({ 
  isVisible, 
  activeMorgys, 
  onActivateMorgy,
  onDeactivateMorgy 
}) => {
  const [morgys] = useState<Morgy[]>(DEFAULT_MORGYS);
  const [showAddModal, setShowAddModal] = useState(false);

  if (!isVisible) return null;

  const handleToggleMorgy = (morgyId: string) => {
    if (activeMorgys.includes(morgyId)) {
      onDeactivateMorgy(morgyId);
    } else {
      onActivateMorgy(morgyId);
    }
  };

  return (
    <div className="morgy-pen">
      {/* Header */}
      <div className="morgy-pen-header">
        <span className="morgy-pen-icon">🐷</span>
        <span className="morgy-pen-title">Morgy Pen</span>
        <span className="morgy-pen-menu">⋮</span>
      </div>

      {/* Grid of Morgys - 2x2 layout */}
      <div className="morgy-grid">
        {morgys.map((morgy) => {
          const isActive = activeMorgys.includes(morgy.id);
          return (
            <div
              key={morgy.id}
              className={`morgy-card ${isActive ? 'active' : ''}`}
              style={{ 
                '--morgy-color': morgy.color,
                '--morgy-border': morgy.borderColor 
              } as React.CSSProperties}
              onClick={() => handleToggleMorgy(morgy.id)}
            >
              {/* Avatar Image */}
              <div className="morgy-avatar">
                <img src={morgy.image} alt={morgy.name} />
              </div>

              {/* Name and Level Row */}
              <div className="morgy-name-row">
                <span className="morgy-name">{morgy.name}</span>
                <span className="morgy-level">Lvl {morgy.level}</span>
              </div>

              {/* XP Progress Bar */}
              <div className="morgy-xp-bar">
                <div 
                  className="morgy-xp-fill" 
                  style={{ 
                    width: `${(morgy.xp / morgy.maxXp) * 100}%`,
                    backgroundColor: morgy.color 
                  }} 
                />
              </div>

              {/* Action Buttons */}
              <div className="morgy-actions">
                <button className="morgy-action-btn activate" title="Activate">
                  <span>{morgy.id === 'bill' ? '↗' : '⚡'}</span>
                </button>
                <button className="morgy-action-btn video" title="Video">
                  <span>📹</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Add Morgy Card */}
        <div className="morgy-card add-morgy-card" onClick={() => setShowAddModal(true)}>
          <div className="add-morgy-content">
            <span className="add-morgy-icon">+</span>
            <span className="add-morgy-text">Add Morgy</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="morgy-pen-footer">
        <span className="sounder-label">Your Sounder</span>
        <span className="sounder-count">{activeMorgys.length} active</span>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="morgy-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="morgy-modal" onClick={(e) => e.stopPropagation()}>
            <h3>🐷 Create Custom Morgy</h3>
            <p>Design your own specialized Morgy agent!</p>
            <div className="modal-coming-soon">
              <span className="sparkle">✨</span>
              Coming Soon
              <span className="sparkle">✨</span>
            </div>
            <button onClick={() => setShowAddModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MorgyPen;
