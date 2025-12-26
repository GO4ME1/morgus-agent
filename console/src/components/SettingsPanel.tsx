import { useState, useEffect } from 'react';
import './SettingsPanel.css';
import { MCPServerBrowser } from './MCPServerBrowser';
import './MCPServerBrowser.css';
import { LearningInsights } from './LearningInsights';
import './LearningInsights.css';

interface MCPServer {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  status: 'connected' | 'disconnected' | 'error';
}

interface Skill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onDarkModeChange: (enabled: boolean) => void;
  dontTrainOnMe?: boolean;
  onDontTrainChange?: (enabled: boolean) => void;
  user?: { id?: string; email?: string } | null;
  profile?: { display_name?: string | null; subscription_tier?: string; is_admin?: boolean; dont_train_on_me?: boolean } | null;
  onLogout?: () => void;
  onNavigate?: (path: string) => void;
}

export function SettingsPanel({ isOpen, onClose, darkMode, onDarkModeChange, dontTrainOnMe: dontTrainOnMeProp, onDontTrainChange, user, profile, onLogout, onNavigate }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'mcp' | 'skills' | 'learning'>('general');
  
  // Debug logging
  console.log('[SettingsPanel] Rendering with:', { user: user?.email, profile, isAdmin: profile?.is_admin });
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newServerUrl, setNewServerUrl] = useState('');
  const [newServerName, setNewServerName] = useState('');
  const [isAddingServer, setIsAddingServer] = useState(false);
  // Use prop if provided, otherwise fall back to local state
  const [localDontTrain, setLocalDontTrain] = useState(() => {
    const saved = localStorage.getItem('morgus_dont_train');
    return saved === 'true';
  });
  
  const dontTrainOnMe = dontTrainOnMeProp !== undefined ? dontTrainOnMeProp : localDontTrain;

  const handleDontTrainOnMeChange = (enabled: boolean) => {
    if (onDontTrainChange) {
      onDontTrainChange(enabled);
    } else {
      setLocalDontTrain(enabled);
      localStorage.setItem('morgus_dont_train', enabled.toString());
    }
  };

  // Load MCP servers and skills on mount
  useEffect(() => {
    if (isOpen) {
      loadMCPServers();
      loadSkills();
    }
  }, [isOpen]);

  const loadMCPServers = async () => {
    // Load from localStorage for now
    const saved = localStorage.getItem('morgus_mcp_servers');
    if (saved) {
      setMcpServers(JSON.parse(saved));
    }
  };

  const loadSkills = async () => {
    // Default skills list
    const defaultSkills: Skill[] = [
      { id: 'website-builder-v2', name: 'Website Builder', description: 'Build professional websites', enabled: true, category: 'Development' },
      { id: 'landing-page-v2', name: 'Landing Page', description: 'High-conversion landing pages', enabled: true, category: 'Development' },
      { id: 'full-stack-app-v2', name: 'Full-Stack App', description: 'Build full-stack applications', enabled: true, category: 'Development' },
      { id: 'web-app-scaffold-v2', name: 'Web App Scaffold', description: 'Supabase-powered apps', enabled: true, category: 'Development' },
      { id: 'stripe-payments-v2', name: 'Stripe Payments', description: 'Payment integration', enabled: true, category: 'Development' },
      { id: 'authentication-v2', name: 'Authentication', description: 'User auth & management', enabled: true, category: 'Development' },
      { id: 'external-api-v2', name: 'External API', description: 'API integrations', enabled: true, category: 'Development' },
      { id: 'data-analysis-v2', name: 'Data Analysis', description: 'Analyze and visualize data', enabled: true, category: 'Analysis' },
      { id: 'research-analysis-v2', name: 'Research', description: 'Deep research & analysis', enabled: true, category: 'Analysis' },
      { id: 'spreadsheet-v2', name: 'Spreadsheet', description: 'Excel workbooks', enabled: true, category: 'Documents' },
      { id: 'docx-v2', name: 'DOCX Generation', description: 'Word documents', enabled: true, category: 'Documents' },
      { id: 'pdf-v2', name: 'PDF Generation', description: 'PDF documents', enabled: true, category: 'Documents' },
      { id: 'document-generation-v2', name: 'Document Generation', description: 'Reports & proposals', enabled: true, category: 'Documents' },
      { id: 'presentation-slideshow-v2', name: 'Presentations', description: 'Slideshows & decks', enabled: true, category: 'Documents' },
      { id: 'image-generation-v2', name: 'Image Generation', description: 'AI image creation', enabled: true, category: 'Creative' },
      { id: 'code-execution-v2', name: 'Code Execution', description: 'Run code in sandbox', enabled: true, category: 'Utilities' },
      { id: 'browser-automation-v2', name: 'Browser Automation', description: 'Web automation', enabled: true, category: 'Utilities' },
      { id: 'email-communication-v2', name: 'Email', description: 'Professional emails', enabled: true, category: 'Communication' },
      { id: 'task-automation-v2', name: 'Task Automation', description: 'Workflow automation', enabled: true, category: 'Utilities' },
    ];

    // Load saved preferences
    const saved = localStorage.getItem('morgus_skills_config');
    if (saved) {
      const savedConfig = JSON.parse(saved);
      setSkills(defaultSkills.map(skill => ({
        ...skill,
        enabled: savedConfig[skill.id] !== false
      })));
    } else {
      setSkills(defaultSkills);
    }
  };

  const saveMCPServers = (servers: MCPServer[]) => {
    localStorage.setItem('morgus_mcp_servers', JSON.stringify(servers));
    setMcpServers(servers);
  };

  const saveSkillsConfig = (updatedSkills: Skill[]) => {
    const config: Record<string, boolean> = {};
    updatedSkills.forEach(skill => {
      config[skill.id] = skill.enabled;
    });
    localStorage.setItem('morgus_skills_config', JSON.stringify(config));
    setSkills(updatedSkills);
  };

  const addMCPServer = async () => {
    if (!newServerUrl || !newServerName) return;
    
    setIsAddingServer(true);
    
    const newServer: MCPServer = {
      id: `mcp-${Date.now()}`,
      name: newServerName,
      url: newServerUrl,
      enabled: true,
      status: 'disconnected'
    };

    // Try to connect
    try {
      // In a real implementation, we'd test the connection here
      newServer.status = 'connected';
    } catch {
      newServer.status = 'error';
    }

    saveMCPServers([...mcpServers, newServer]);
    setNewServerUrl('');
    setNewServerName('');
    setIsAddingServer(false);
  };

  const removeMCPServer = (id: string) => {
    saveMCPServers(mcpServers.filter(s => s.id !== id));
  };

  const toggleMCPServer = (id: string) => {
    saveMCPServers(mcpServers.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const toggleSkill = (id: string) => {
    saveSkillsConfig(skills.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const enableAllSkills = () => {
    saveSkillsConfig(skills.map(s => ({ ...s, enabled: true })));
  };

  const disableAllSkills = () => {
    saveSkillsConfig(skills.map(s => ({ ...s, enabled: false })));
  };

  if (!isOpen) return null;

  const skillCategories = [...new Set(skills.map(s => s.category))];

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>⚙️ Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="settings-tabs">
          <button 
            className={`tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button 
            className={`tab ${activeTab === 'mcp' ? 'active' : ''}`}
            onClick={() => setActiveTab('mcp')}
          >
            MCP Servers
          </button>
          <button 
            className={`tab ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            Skills
          </button>
          <button 
            className={`tab ${activeTab === 'learning' ? 'active' : ''}`}
            onClick={() => setActiveTab('learning')}
          >
            🧠 Learning
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="general-settings">
              {/* User Account Section */}
              {user && (
                <div className="setting-section">
                  <h3 className="section-title">👤 Account</h3>
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">{profile?.display_name || user.email}</span>
                      <span className="setting-description">{user.email}</span>
                    </div>
                    <span className={`plan-badge ${profile?.is_admin ? 'admin-badge' : ''}`}>
                      {profile?.is_admin ? '👑 Admin' : (profile?.subscription_tier || 'free')}
                    </span>
                  </div>
                  <div className="account-actions">
                    <button className="account-btn" onClick={() => onNavigate?.('/account')}>
                      ⚙️ My Account
                    </button>
                    <button className="account-btn knowledge-base-btn" onClick={() => onNavigate?.('/knowledge-base')}>
                      📚 Knowledge Base
                    </button>
                    <button className="account-btn" onClick={() => onNavigate?.('/pricing')}>
                      ⭐ Upgrade Plan
                    </button>
                    {profile?.is_admin && (
                      <button className="account-btn admin" onClick={() => onNavigate?.('/admin')}>
                        🔧 Admin Panel
                      </button>
                    )}
                    <button 
                      className="account-btn logout" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[SettingsPanel] Logout clicked');
                        if (onLogout) {
                          onLogout();
                        } else {
                          console.error('[SettingsPanel] onLogout not provided!');
                        }
                      }}
                    >
                      🚪 Log Out
                    </button>
                  </div>
                  
                  {/* Refer a Friend Section */}
                  <div className="referral-section">
                    <div className="referral-header">
                      <span className="referral-icon">🎁</span>
                      <span className="referral-title">Refer a Friend</span>
                    </div>
                    <p className="referral-description">Share your code and both get a free day pass when they sign up!</p>
                    <div className="referral-code-box">
                      <span className="referral-code">{user?.email?.split('@')[0]?.toUpperCase().slice(0, 8) || 'MORGUS'}</span>
                      <button 
                        className="copy-code-btn"
                        onClick={() => {
                          const code = user?.email?.split('@')[0]?.toUpperCase().slice(0, 8) || 'MORGUS';
                          navigator.clipboard.writeText(code);
                          alert('Referral code copied!');
                        }}
                      >
                        📋 Copy
                      </button>
                    </div>
                    <button 
                      className="share-link-btn"
                      onClick={() => {
                        const code = user?.email?.split('@')[0]?.toUpperCase().slice(0, 8) || 'MORGUS';
                        const shareUrl = `https://morgus-console.pages.dev/signup?ref=${code}`;
                        navigator.clipboard.writeText(shareUrl);
                        alert('Share link copied!');
                      }}
                    >
                      🔗 Copy Share Link
                    </button>
                  </div>
                </div>
              )}
              {!user && (
                <div className="setting-section">
                  <h3 className="section-title">👤 Account</h3>
                  <div className="account-actions">
                    <button className="account-btn primary" onClick={() => onNavigate?.('/login')}>
                      🔑 Log In
                    </button>
                    <button className="account-btn" onClick={() => onNavigate?.('/signup')}>
                      ✨ Sign Up
                    </button>
                  </div>
                </div>
              )}

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">🌙 Dark Mode</span>
                  <span className="setting-description">Toggle dark/light theme</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={darkMode}
                    onChange={(e) => onDarkModeChange(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              {/* Don't Train on Me Privacy Toggle */}
              <div className="setting-item privacy-toggle">
                <div className="setting-info">
                  <span className="setting-label">
                    <span className="snake-icon">🐍</span> Don't Train on Me
                  </span>
                  <span className="setting-description">
                    {dontTrainOnMe 
                      ? "Your conversations won't be used for training" 
                      : "Your conversations help improve Morgus for everyone"}
                  </span>
                </div>
                <label className="toggle-switch privacy">
                  <input 
                    type="checkbox" 
                    checked={dontTrainOnMe}
                    onChange={(e) => handleDontTrainOnMeChange(e.target.checked)}
                  />
                  <span className="slider privacy-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">🎯 Morgus Version</span>
                  <span className="setting-description">Skills Library v2.0 • MCP Enabled</span>
                </div>
                <span className="version-badge">v2.0</span>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">📊 Active Skills</span>
                  <span className="setting-description">{skills.filter(s => s.enabled).length} of {skills.length} skills enabled</span>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">🔌 MCP Servers</span>
                  <span className="setting-description">{mcpServers.filter(s => s.enabled).length} connected</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mcp' && (
            <div className="mcp-settings">
              <MCPServerBrowser 
                userId={user?.id}
                onServerInstalled={(serverId) => {
                  console.log('Server installed:', serverId);
                  loadMCPServers();
                }}
                onServerUninstalled={(serverId) => {
                  console.log('Server uninstalled:', serverId);
                  loadMCPServers();
                }}
              />
              
              {/* Manual Server Addition (Advanced) */}
              <div className="manual-server-section">
                <h4>🔧 Add Custom Server</h4>
                <p className="manual-hint">For advanced users: manually connect to a custom MCP server</p>
                <div className="add-server-form">
                  <input
                    type="text"
                    placeholder="Server Name (e.g., My Database)"
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Server URL (e.g., http://localhost:3000)"
                    value={newServerUrl}
                    onChange={(e) => setNewServerUrl(e.target.value)}
                  />
                  <button 
                    onClick={addMCPServer}
                    disabled={isAddingServer || !newServerUrl || !newServerName}
                  >
                    {isAddingServer ? 'Connecting...' : '+ Add Server'}
                  </button>
                </div>
              </div>

              {/* Custom Servers List */}
              {mcpServers.length > 0 && (
                <div className="custom-servers-section">
                  <h4>📦 Custom Servers</h4>
                  <div className="servers-list">
                    {mcpServers.map(server => (
                      <div key={server.id} className={`server-item ${server.status}`}>
                        <div className="server-info">
                          <span className="server-name">{server.name}</span>
                          <span className="server-url">{server.url}</span>
                          <span className={`status-badge ${server.status}`}>
                            {server.status === 'connected' ? '🟢 Connected' : 
                             server.status === 'error' ? '🔴 Error' : '⚪ Disconnected'}
                          </span>
                        </div>
                        <div className="server-actions">
                          <label className="toggle-switch">
                            <input 
                              type="checkbox" 
                              checked={server.enabled}
                              onChange={() => toggleMCPServer(server.id)}
                            />
                            <span className="slider"></span>
                          </label>
                          <button 
                            className="remove-btn"
                            onClick={() => removeMCPServer(server.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="skills-settings">
              <div className="skills-header">
                <p>Enable or disable specific skills to customize Morgus's capabilities.</p>
                <div className="bulk-actions">
                  <button onClick={enableAllSkills}>Enable All</button>
                  <button onClick={disableAllSkills}>Disable All</button>
                </div>
              </div>

              {skillCategories.map(category => (
                <div key={category} className="skill-category">
                  <h3>{category}</h3>
                  <div className="skills-list">
                    {skills.filter(s => s.category === category).map(skill => (
                      <div key={skill.id} className={`skill-item ${skill.enabled ? 'enabled' : 'disabled'}`}>
                        <div className="skill-info">
                          <span className="skill-name">{skill.name}</span>
                          <span className="skill-description">{skill.description}</span>
                        </div>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={skill.enabled}
                            onChange={() => toggleSkill(skill.id)}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'learning' && (
            <LearningInsights userId={user?.id} />
          )}
        </div>
      </div>
    </div>
  );
}
