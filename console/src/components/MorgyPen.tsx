import React, { useState, useEffect } from 'react';
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
  quips: string[];
  isActive: boolean;
}

interface MorgyPenProps {
  isVisible: boolean;
  onActivateMorgy: (morgyId: string) => void;
  onDeactivateMorgy: (morgyId: string) => void;
  activeMorgys: string[];
}

// Default Morgys data with personality quips
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
    avatar: '/morgys/bill.svg',
    quips: [
      "Let's crush those CTAs! 🎯",
      "Time to go viral! 🚀",
      "Hook 'em and convert! 🎣",
      "Growth mode: ACTIVATED 📈",
      "Let's make it rain leads! 💰",
    ],
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
    avatar: '/morgys/sally.svg',
    quips: [
      "Campaign time! 💅",
      "Let's launch something amazing! 🚀",
      "Promo magic incoming! ✨",
      "Ready to spread the word! 📣",
      "Referrals are my jam! 🍯",
    ],
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
    avatar: '/morgys/professor.svg',
    quips: [
      "Fascinating! Let me analyze... 🧐",
      "The data reveals... 📊",
      "Elementary, my dear user! 🎩",
      "Research mode engaged! 🔬",
      "Let's dig deeper! 📚",
    ],
    isActive: false,
  },
];

// Animated SVG Pig component
const AnimatedPig: React.FC<{ color: string; isActive: boolean; isHovered: boolean }> = ({ color, isActive, isHovered }) => {
  const colors: Record<string, { body: string; accent: string }> = {
    green: { body: '#06ffa5', accent: '#00d9ff' },
    pink: { body: '#ff6b9d', accent: '#ff006e' },
    blue: { body: '#00f5ff', accent: '#0080ff' },
    purple: { body: '#8338ec', accent: '#ff006e' },
    orange: { body: '#ff6b35', accent: '#f7931e' },
  };

  const { body, accent } = colors[color] || colors.green;

  return (
    <svg 
      viewBox="0 0 100 100" 
      className={`morgy-svg ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
    >
      {/* Glow filter */}
      <defs>
        <filter id={`glow-${color}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id={`bodyGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={body} />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
      </defs>
      
      {/* Body */}
      <ellipse 
        cx="50" cy="55" rx="30" ry="25" 
        fill={`url(#bodyGrad-${color})`}
        filter={isActive ? `url(#glow-${color})` : ''}
        className="pig-body"
      />
      
      {/* Head */}
      <circle 
        cx="50" cy="35" r="22" 
        fill={`url(#bodyGrad-${color})`}
        filter={isActive ? `url(#glow-${color})` : ''}
        className="pig-head"
      />
      
      {/* Ears */}
      <ellipse cx="35" cy="18" rx="8" ry="10" fill={body} className="pig-ear left" />
      <ellipse cx="65" cy="18" rx="8" ry="10" fill={body} className="pig-ear right" />
      
      {/* Snout */}
      <ellipse cx="50" cy="42" rx="12" ry="8" fill="#ffb6c1" className="pig-snout" />
      <circle cx="46" cy="42" r="2" fill="#333" />
      <circle cx="54" cy="42" r="2" fill="#333" />
      
      {/* Eyes */}
      <circle cx="42" cy="32" r="5" fill="white" className="pig-eye left" />
      <circle cx="58" cy="32" r="5" fill="white" className="pig-eye right" />
      <circle cx="43" cy="32" r="2.5" fill="#333" className="pig-pupil left" />
      <circle cx="59" cy="32" r="2.5" fill="#333" className="pig-pupil right" />
      
      {/* Blush */}
      <ellipse cx="35" cy="38" rx="5" ry="3" fill="rgba(255,182,193,0.5)" />
      <ellipse cx="65" cy="38" rx="5" ry="3" fill="rgba(255,182,193,0.5)" />
      
      {/* Legs */}
      <rect x="30" y="72" width="8" height="12" rx="4" fill={accent} className="pig-leg" />
      <rect x="42" y="72" width="8" height="12" rx="4" fill={accent} className="pig-leg" />
      <rect x="50" y="72" width="8" height="12" rx="4" fill={accent} className="pig-leg" />
      <rect x="62" y="72" width="8" height="12" rx="4" fill={accent} className="pig-leg" />
      
      {/* Tail */}
      <path 
        d="M 80 55 Q 90 50 85 40 Q 80 30 90 35" 
        stroke={accent} 
        strokeWidth="3" 
        fill="none"
        className="pig-tail"
      />
    </svg>
  );
};

const MorgyPen: React.FC<MorgyPenProps> = ({
  isVisible,
  onActivateMorgy,
  onDeactivateMorgy,
  activeMorgys,
}) => {
  const [morgys] = useState<Morgy[]>(DEFAULT_MORGYS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [hoveredMorgy, setHoveredMorgy] = useState<string | null>(null);
  const [currentQuip, setCurrentQuip] = useState<{ id: string; text: string } | null>(null);
  const [activatingMorgy, setActivatingMorgy] = useState<string | null>(null);

  // Show random quip on hover
  useEffect(() => {
    if (hoveredMorgy) {
      const morgy = morgys.find(m => m.id === hoveredMorgy);
      if (morgy) {
        const randomQuip = morgy.quips[Math.floor(Math.random() * morgy.quips.length)];
        setCurrentQuip({ id: hoveredMorgy, text: randomQuip });
      }
    } else {
      setCurrentQuip(null);
    }
  }, [hoveredMorgy, morgys]);

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
    setActivatingMorgy(morgyId);
    
    setTimeout(() => {
      if (activeMorgys.includes(morgyId)) {
        onDeactivateMorgy(morgyId);
      } else {
        onActivateMorgy(morgyId);
      }
      setActivatingMorgy(null);
    }, 300);
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
          const isHovered = hoveredMorgy === morgy.id;
          const isActivating = activatingMorgy === morgy.id;
          
          return (
            <div
              key={morgy.id}
              className={`morgy-card ${getColorClass(morgy.color)} ${isActive ? 'active' : ''} ${isActivating ? 'activating' : ''}`}
              onClick={() => handleToggleMorgy(morgy.id)}
              onMouseEnter={() => setHoveredMorgy(morgy.id)}
              onMouseLeave={() => setHoveredMorgy(null)}
            >
              {/* Quip bubble */}
              {currentQuip?.id === morgy.id && (
                <div className="morgy-quip">
                  {currentQuip.text}
                </div>
              )}
              
              <div className="morgy-avatar">
                <AnimatedPig 
                  color={morgy.color} 
                  isActive={isActive}
                  isHovered={isHovered}
                />
              </div>
              
              <div className="morgy-info">
                <div className="morgy-name">{morgy.name}</div>
                <div className="morgy-level">Lvl {morgy.level}</div>
              </div>
              
              <div className="morgy-title-text">{morgy.title}</div>
              
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
              
              {isActive && (
                <div className="morgy-active-indicator">
                  <span className="pulse-dot"></span>
                  Active
                </div>
              )}
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
