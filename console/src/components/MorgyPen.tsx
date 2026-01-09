import React, { useState } from 'react';
import './MorgyPen.css';
import AddMorgyFormFixed from './AddMorgyFormFixed';
import MCPExportModal from './MCPExportModal';
import { useAuth } from '../lib/auth';

interface Morgy {
  id: string;
  name: string;
  title: string;
  fullName: string;
  handle: string;
  level: number;
  xp: number;
  maxXp: number;
  color: string;
  borderColor: string;
  image: string;
  specialty: string;
  tools?: string[];
}

interface MorgyPenProps {
  isVisible: boolean;
  activeMorgys: string[];
  onActivateMorgy: (morgyId: string) => void;
  onDeactivateMorgy: (morgyId: string) => void;
  onMentionMorgy?: (handle: string, fullName: string) => void;
  onClose?: () => void;
}

const DEFAULT_MORGYS: Morgy[] = [
  {
    id: 'bill',
    name: 'Bill',
    title: 'Marketing Hog',
    fullName: 'Bill the Marketing Hog',
    handle: '@billthemarketinghog',
    level: 3,
    xp: 65,
    maxXp: 100,
    color: '#00ffff',
    borderColor: '#00ffff',
    image: '/morgys/bill.png',
    specialty: 'Growth, hooks, landing pages, CTAs, viral ideas',
    tools: ['generate_marketing_video', 'generate_ad_copy']
  },
  {
    id: 'sally',
    name: 'Sally',
    title: 'Social Media Queen',
    fullName: 'Sally the Promo Pig',
    handle: '@sallythepromo',
    level: 2,
    xp: 40,
    maxXp: 100,
    color: '#ff00ff',
    borderColor: '#ff00ff',
    image: '/morgys/sally.png',
    specialty: 'Social media posting, video scripts, content calendars, engagement analysis',
    tools: ['generate_tiktok_reel', 'post_to_twitter', 'post_to_instagram', 'create_content_calendar', 'generate_video_script']
  },
  {
    id: 'professor',
    name: 'Prof. Hogsworth',
    title: 'Research Expert',
    fullName: 'Prof. Hogsworth the Research Expert',
    handle: '@profhogsworth',
    level: 5,
    xp: 85,
    maxXp: 100,
    color: '#00ffff',
    borderColor: '#00ffff',
    image: '/morgys/professor.png',
    specialty: 'Deep research, analysis, complex problems, data synthesis',
    tools: ['generate_dynamic_view', 'create_educational_lesson', 'generate_infographic', 'explain_simply']
  }
];

const MorgyPen: React.FC<MorgyPenProps> = ({ 
  isVisible, 
  activeMorgys, 
  onActivateMorgy,
  onDeactivateMorgy,
  onMentionMorgy,
  onClose
}) => {
  const { user } = useAuth();
  const [morgys, setMorgys] = useState<Morgy[]>(DEFAULT_MORGYS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [hoveredMorgy, setHoveredMorgy] = useState<string | null>(null);
  const [exportingMorgy, setExportingMorgy] = useState<Morgy | null>(null);

  if (!isVisible) return null;

  const handleToggleMorgy = (morgyId: string) => {
    if (activeMorgys.includes(morgyId)) {
      onDeactivateMorgy(morgyId);
    } else {
      onActivateMorgy(morgyId);
    }
  };

  const handleMentionClick = (morgy: Morgy, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMentionMorgy) {
      onMentionMorgy(morgy.handle, morgy.fullName);
    }
    // Also activate the morgy
    if (!activeMorgys.includes(morgy.id)) {
      onActivateMorgy(morgy.id);
    }
  };

  return (
    <div className="morgy-pen">
      {/* Header */}
      <div className="morgy-pen-header">
        <span className="morgy-pen-icon">🐷</span>
        <span className="morgy-pen-title">Morgy Pen</span>
        <button className="morgy-pen-close" onClick={onClose || (() => {})} aria-label="Close">
          ×
        </button>
      </div>

      {/* How to Call Section */}
      <div className="morgy-how-to-call">
        <span className="how-to-icon">💡</span>
        <span className="how-to-text">Click @ to mention a Morgy in chat</span>
      </div>

      {/* Grid of Morgys - 2x2 layout */}
      <div className="morgy-grid">
        {morgys.map((morgy) => {
          const isActive = activeMorgys.includes(morgy.id);
          const isHovered = hoveredMorgy === morgy.id;
          return (
            <div
              key={morgy.id}
              className={`morgy-card ${isActive ? 'active' : ''}`}
              style={{ 
                '--morgy-color': morgy.color,
                '--morgy-border': morgy.borderColor 
              } as React.CSSProperties}
              onClick={() => handleToggleMorgy(morgy.id)}
              onMouseEnter={() => setHoveredMorgy(morgy.id)}
              onMouseLeave={() => setHoveredMorgy(null)}
            >
              {/* Avatar Image - Bigger */}
              <div className="morgy-avatar">
                <img src={morgy.image} alt={morgy.name} />
              </div>

              {/* Full Name */}
              <div className="morgy-full-name">{morgy.fullName}</div>

              {/* Handle */}
              <div className="morgy-handle">{morgy.handle}</div>

              {/* Level Badge */}
              <div className="morgy-level-badge">
                <span className="level-text">Lvl {morgy.level}</span>
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

              {/* Specialty - shows on hover */}
              {isHovered && (
                <div className="morgy-specialty-tooltip">
                  <span className="specialty-label">Specialty:</span>
                  <span className="specialty-text">{morgy.specialty}</span>
                  {morgy.tools && morgy.tools.length > 0 && (
                    <>
                      <span className="specialty-label tools-label">Tools:</span>
                      <span className="specialty-tools">
                        {morgy.tools.slice(0, 3).map((tool) => (
                          <span key={tool} className="tool-badge">{tool.replace(/_/g, ' ')}</span>
                        ))}
                        {morgy.tools.length > 3 && <span className="tool-more">+{morgy.tools.length - 3} more</span>}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="morgy-actions">
                <button 
                  className="morgy-action-btn mention" 
                  title={`Mention ${morgy.name} in chat`}
                  onClick={(e) => handleMentionClick(morgy, e)}
                >
                  <span>@</span>
                </button>
                <button 
                  className="morgy-action-btn activate" 
                  title={isActive ? 'Deactivate' : 'Activate'}
                >
                  <span>{isActive ? '✓' : '⚡'}</span>
                </button>
                <button 
                  className="morgy-action-btn export" 
                  title="Export as MCP Server"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExportingMorgy(morgy);
                  }}
                >
                  <span>📦</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Add Morgy Card */}
        <div 
          className="morgy-card add-morgy-card" 
          onClick={() => {
            if (!user) {
              alert('🔒 Please sign in to create custom Morgys!\n\nFree users can use the default Morgys, but creating custom AI agents requires an account.');
              return;
            }
            setShowAddModal(true);
          }}
        >
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

      {/* Add Morgy Form */}
      <AddMorgyFormFixed
        isVisible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onMorgyCreated={(newMorgy) => {
          // Convert backend format to frontend format
          const morgyForDisplay: Morgy = {
            id: newMorgy.id,
            name: newMorgy.name.split(' ')[0], // First word as short name
            title: newMorgy.category.charAt(0).toUpperCase() + newMorgy.category.slice(1),
            fullName: newMorgy.name,
            handle: `@${newMorgy.name.toLowerCase().replace(/\s+/g, '')}`,
            level: 1,
            xp: 0,
            maxXp: 100,
            color: newMorgy.appearance.color,
            borderColor: newMorgy.appearance.color,
            image: newMorgy.appearance.avatar,
            specialty: newMorgy.personality.responseStyle || newMorgy.description,
            tools: []
          };
          setMorgys(prev => [...prev, morgyForDisplay]);
          setShowAddModal(false);
        }}
      />

      {/* MCP Export Modal */}
      {exportingMorgy && (
        <MCPExportModal
          isVisible={true}
          onClose={() => setExportingMorgy(null)}
          morgy={{
            id: exportingMorgy.id,
            name: exportingMorgy.fullName,
            avatar: exportingMorgy.image
          }}
        />
      )}
    </div>
  );
};

export default MorgyPen;
