import React, { useState, useRef, useEffect } from 'react';
import { MorgyChat } from './MorgyChat';
import { MorgyCreator } from './MorgyCreator';
import { MorgyKnowledgeBase } from './MorgyKnowledgeBase';
import { MorgyMarket } from './MorgyMarket';
import './MorgyPen.css';
import './MorgyPenExpandable.css';

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

interface MorgyPenExpandableProps {
  isVisible: boolean;
  activeMorgys: string[];
  onActivateMorgy: (morgyId: string) => void;
  onDeactivateMorgy: (morgyId: string) => void;
  onMentionMorgy?: (handle: string, fullName: string) => void;
  onClose?: () => void;
}

type ViewMode = 'grid' | 'chat' | 'create' | 'knowledge' | 'market';
type PenSize = 'small' | 'medium' | 'large' | 'xlarge';

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
    color: '#39FF14',
    borderColor: '#39FF14',
    image: '/avatars/bill.png',
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
    color: '#FF69B4',
    borderColor: '#FF69B4',
    image: '/avatars/sally.png',
    specialty: 'Social media posting, video scripts, content calendars, engagement analysis',
    tools: ['generate_tiktok_reel', 'post_to_twitter', 'post_to_instagram']
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
    color: '#00FFFF',
    borderColor: '#00FFFF',
    image: '/avatars/professor.png',
    specialty: 'Deep research, analysis, complex problems, data synthesis',
    tools: ['generate_dynamic_view', 'create_educational_lesson']
  }
];

const PEN_WIDTHS = {
  small: 320,    // Default sidebar
  medium: 480,   // 1/3 screen
  large: 720,    // 1/2 screen
  xlarge: 1080   // 3/4 screen
};

export const MorgyPenExpandable: React.FC<MorgyPenExpandableProps> = ({ 
  isVisible, 
  activeMorgys, 
  onActivateMorgy,
  onDeactivateMorgy,
  onMentionMorgy,
  onClose
}) => {
  const [morgys] = useState<Morgy[]>(DEFAULT_MORGYS);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedMorgyId, setSelectedMorgyId] = useState<string | undefined>();
  const [hoveredMorgy, setHoveredMorgy] = useState<string | null>(null);
  const [penSize, setPenSize] = useState<PenSize>('small');
  const [isResizing, setIsResizing] = useState(false);
  const [customWidth, setCustomWidth] = useState<number | null>(null);
  const penRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (penRef.current) {
        const newWidth = Math.min(Math.max(e.clientX, 320), window.innerWidth * 0.9);
        setCustomWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

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
    if (!activeMorgys.includes(morgy.id)) {
      onActivateMorgy(morgy.id);
    }
  };

  const handleChatClick = (morgyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMorgyId(morgyId);
    setViewMode('chat');
    // Auto-expand when opening chat
    if (penSize === 'small') {
      setPenSize('large');
    }
  };

  const handleMorgyCreated = (morgyId: string) => {
    setSelectedMorgyId(morgyId);
    setViewMode('chat');
  };

  const cyclePenSize = () => {
    const sizes: PenSize[] = ['small', 'medium', 'large', 'xlarge'];
    const currentIndex = sizes.indexOf(penSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    setPenSize(sizes[nextIndex]);
    setCustomWidth(null);
  };

  const getWidth = () => {
    if (customWidth) return customWidth;
    return PEN_WIDTHS[penSize];
  };

  const getGridColumns = () => {
    const width = getWidth();
    if (width >= 1000) return 4;
    if (width >= 700) return 3;
    if (width >= 450) return 2;
    return 2;
  };

  return (
    <div 
      ref={penRef}
      className={`morgy-pen morgy-pen-expandable ${isResizing ? 'resizing' : ''}`}
      style={{ width: `${getWidth()}px` }}
    >
      {/* Resize Handle */}
      <div 
        className="morgy-resize-handle"
        onMouseDown={() => setIsResizing(true)}
        title="Drag to resize"
      >
        <div className="resize-handle-line"></div>
      </div>

      {/* Header */}
      <div className="morgy-pen-header">
        <span className="morgy-pen-icon">🐷</span>
        <span className="morgy-pen-title">Morgy Pen</span>
        
        {/* Size Toggle Button */}
        <button 
          onClick={cyclePenSize}
          className="morgy-size-toggle"
          title={`Resize (Current: ${penSize})`}
        >
          {penSize === 'small' && '⬜'}
          {penSize === 'medium' && '◫'}
          {penSize === 'large' && '⬛'}
          {penSize === 'xlarge' && '▣'}
        </button>

        {/* Back Button */}
        {viewMode !== 'grid' && (
          <button 
            onClick={() => setViewMode('grid')}
            className="morgy-back-btn"
            title="Back to Grid"
          >
            ←
          </button>
        )}
        
        <button className="morgy-pen-close" onClick={onClose || (() => {})} aria-label="Close">
          ×
        </button>
      </div>

      {/* Navigation Tabs (when in grid view) */}
      {viewMode === 'grid' && (
        <div className="morgy-tabs">
          <button 
            onClick={() => setViewMode('market')}
            className="morgy-tab"
          >
            🏪 Market
          </button>
          <button 
            onClick={() => setViewMode('create')}
            className="morgy-tab"
          >
            ✨ Create
          </button>
        </div>
      )}

      {/* How to Call Section (only in grid view) */}
      {viewMode === 'grid' && (
        <div className="morgy-how-to-call">
          <span className="how-to-icon">💡</span>
          <span className="how-to-text">Click @ to mention • 💬 to chat • ⚡ to activate</span>
        </div>
      )}

      {/* Content Area */}
      <div className="morgy-content">
        {/* Grid View - Default */}
        {viewMode === 'grid' && (
          <div 
            className="morgy-grid"
            style={{
              gridTemplateColumns: `repeat(${getGridColumns()}, 1fr)`
            }}
          >
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
                  {/* Avatar Image */}
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

                  {/* Specialty Tooltip */}
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
                      title={`Mention ${morgy.name}`}
                      onClick={(e) => handleMentionClick(morgy, e)}
                    >
                      <span>@</span>
                    </button>
                    <button 
                      className="morgy-action-btn chat" 
                      title={`Chat with ${morgy.name}`}
                      onClick={(e) => handleChatClick(morgy.id, e)}
                    >
                      <span>💬</span>
                    </button>
                    <button 
                      className="morgy-action-btn activate" 
                      title={isActive ? 'Deactivate' : 'Activate'}
                    >
                      <span>{isActive ? '✓' : '⚡'}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add Morgy Card */}
            <div className="morgy-card add-morgy-card" onClick={() => setViewMode('create')}>
              <div className="add-morgy-content">
                <span className="add-morgy-icon">+</span>
                <span className="add-morgy-text">Create Morgy</span>
              </div>
            </div>
          </div>
        )}

        {/* Chat View */}
        {viewMode === 'chat' && (
          <div className="morgy-view-container">
            <MorgyChat
              morgyId={selectedMorgyId}
              onMorgyChange={(id) => setSelectedMorgyId(id)}
            />
          </div>
        )}

        {/* Create View */}
        {viewMode === 'create' && (
          <div className="morgy-view-container">
            <MorgyCreator
              onMorgyCreated={handleMorgyCreated}
              onCancel={() => setViewMode('grid')}
            />
          </div>
        )}

        {/* Knowledge Base View */}
        {viewMode === 'knowledge' && (
          <div className="morgy-view-container">
            <MorgyKnowledgeBase
              morgyId={selectedMorgyId}
            />
          </div>
        )}

        {/* Market View */}
        {viewMode === 'market' && (
          <div className="morgy-view-container">
            <MorgyMarket
              onMorgyPurchased={(id) => {
                setSelectedMorgyId(id);
                setViewMode('chat');
              }}
            />
          </div>
        )}
      </div>

      {/* Footer (only in grid view) */}
      {viewMode === 'grid' && (
        <div className="morgy-pen-footer">
          <span className="sounder-label">Your Sounder</span>
          <span className="sounder-count">{activeMorgys.length} active</span>
          <span className="pen-size-indicator">{penSize}</span>
        </div>
      )}
    </div>
  );
};

export default MorgyPenExpandable;
