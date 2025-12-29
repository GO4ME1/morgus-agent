import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './MCPServerBrowser.css';

interface MCPServer {
  id: string;
  name: string;
  display_name: string;
  description: string;
  long_description?: string;
  version: string;
  author?: string;
  author_url?: string;
  repository_url?: string;
  documentation_url?: string;
  icon_url?: string;
  category: string;
  tags: string[];
  install_config_template?: Record<string, unknown>;
  is_official: boolean;
  is_verified: boolean;
  is_featured: boolean;
  install_count: number;
  average_rating: number;
  review_count: number;
}

interface MCPServerInstall {
  id: string;
  server_id: string;
  is_enabled: boolean;
  config: Record<string, unknown>;
  health_status: string;
  last_health_check?: string;
  created_at: string;
}

interface MCPServerBrowserProps {
  userId?: string;
  onServerInstalled?: (serverId: string) => void;
  onServerUninstalled?: (serverId: string) => void;
}

export function MCPServerBrowser({ userId, onServerInstalled, onServerUninstalled }: MCPServerBrowserProps) {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [installedServers, setInstalledServers] = useState<MCPServerInstall[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null);
  const [viewMode, setViewMode] = useState<'browse' | 'installed'>('browse');

  useEffect(() => {
    loadServers();
    loadInstalledServers();
    loadCategories();
  }, [userId]);

  const loadServers = async () => {
    try {
      const { data, error } = await supabase
        .from('mcp_servers')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('install_count', { ascending: false });

      if (error) throw error;
      setServers(data || []);
    } catch {
      console.error('Error loading MCP servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInstalledServers = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('mcp_server_installs')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setInstalledServers(data || []);
    } catch {
      console.error('Error loading installed servers:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('mcp_server_categories')
        .select('name')
        .order('sort_order');

      if (error) throw error;
      setCategories(['all', ...(data?.map(c => c.name) || [])]);
    } catch {
      console.error('Error loading categories:', error);
      setCategories(['all', 'general', 'development', 'data', 'productivity']);
    }
  };

  const isServerInstalled = (serverId: string) => {
    return installedServers.some(s => s.server_id === serverId);
  };


  const installServer = async (server: MCPServer) => {
    if (!userId) {
      alert('Please log in to install MCP servers');
      return;
    }

    setInstalling(server.id);
    
    try {
      // Create install record
      const { error } = await supabase
        .from('mcp_server_installs')
        .insert({
          user_id: userId,
          server_id: server.id,
          is_enabled: true,
          config: server.install_config_template || {},
          health_status: 'pending'
        });

      if (error) throw error;

      // Increment install count
      await supabase.rpc('increment_mcp_install_count', { server_id: server.id });

      // Reload installed servers
      await loadInstalledServers();
      onServerInstalled?.(server.id);
      
    } catch {
      console.error('Error installing server:', error);
      alert('Failed to install server. Please try again.');
    } finally {
      setInstalling(null);
    }
  };

  const uninstallServer = async (serverId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('mcp_server_installs')
        .delete()
        .eq('user_id', userId)
        .eq('server_id', serverId);

      if (error) throw error;

      await loadInstalledServers();
      onServerUninstalled?.(serverId);
      
    } catch {
      console.error('Error uninstalling server:', error);
      alert('Failed to uninstall server. Please try again.');
    }
  };

  const toggleServerEnabled = async (serverId: string, enabled: boolean) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('mcp_server_installs')
        .update({ is_enabled: enabled })
        .eq('user_id', userId)
        .eq('server_id', serverId);

      if (error) throw error;
      await loadInstalledServers();
      
    } catch {
      console.error('Error toggling server:', error);
    }
  };

  const filteredServers = servers.filter(server => {
    const matchesCategory = selectedCategory === 'all' || server.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      server.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const installedServerDetails = servers.filter(s => isServerInstalled(s.id));

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= rating ? 'filled' : ''}`}>★</span>
      );
    }
    return stars;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'all': '🌐',
      'general': '🔧',
      'development': '💻',
      'data': '📊',
      'productivity': '📋',
      'communication': '💬',
      'ai': '🤖',
      'security': '🔒',
      'media': '🎨',
      'finance': '💰',
      'analytics': '📈'
    };
    return icons[category.toLowerCase()] || '📦';
  };

  if (loading) {
    return (
      <div className="mcp-browser-loading">
        <div className="loading-spinner"></div>
        <p>Loading MCP Server Registry...</p>
      </div>
    );
  }

  return (
    <div className="mcp-server-browser">
      {/* View Toggle */}
      <div className="browser-header">
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'browse' ? 'active' : ''}`}
            onClick={() => setViewMode('browse')}
          >
            🏪 Browse Registry
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'installed' ? 'active' : ''}`}
            onClick={() => setViewMode('installed')}
          >
            📦 My Servers ({installedServers.length})
          </button>
        </div>
      </div>

      {viewMode === 'browse' ? (
        <>
          {/* Search and Filter */}
          <div className="browser-controls">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search servers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="category-filter">
              {categories.map(category => (
                <button
                  key={category}
                  className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {getCategoryIcon(category)} {category === 'all' ? 'All' : category}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Servers */}
          {selectedCategory === 'all' && !searchQuery && (
            <div className="featured-section">
              <h3>⭐ Featured Servers</h3>
              <div className="featured-grid">
                {servers.filter(s => s.is_featured).slice(0, 3).map(server => (
                  <div key={server.id} className="featured-card" onClick={() => setSelectedServer(server)}>
                    <div className="featured-icon">
                      {server.icon_url ? (
                        <img src={server.icon_url} alt={server.display_name} />
                      ) : (
                        <span className="default-icon">{getCategoryIcon(server.category)}</span>
                      )}
                    </div>
                    <div className="featured-info">
                      <h4>{server.display_name}</h4>
                      <p>{server.description}</p>
                      <div className="featured-meta">
                        {server.is_official && <span className="badge official">Official</span>}
                        {server.is_verified && <span className="badge verified">✓ Verified</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Server Grid */}
          <div className="servers-grid">
            {filteredServers.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🔍</span>
                <p>No servers found matching your criteria</p>
              </div>
            ) : (
              filteredServers.map(server => (
                <div 
                  key={server.id} 
                  className={`server-card ${isServerInstalled(server.id) ? 'installed' : ''}`}
                  onClick={() => setSelectedServer(server)}
                >
                  <div className="server-header">
                    <div className="server-icon">
                      {server.icon_url ? (
                        <img src={server.icon_url} alt={server.display_name} />
                      ) : (
                        <span className="default-icon">{getCategoryIcon(server.category)}</span>
                      )}
                    </div>
                    <div className="server-title">
                      <h4>{server.display_name}</h4>
                      <span className="server-author">by {server.author || 'Unknown'}</span>
                    </div>
                  </div>
                  
                  <p className="server-description">{server.description}</p>
                  
                  <div className="server-meta">
                    <div className="server-rating">
                      {renderStars(Math.round(server.average_rating))}
                      <span className="rating-count">({server.review_count})</span>
                    </div>
                    <span className="install-count">📥 {server.install_count}</span>
                  </div>

                  <div className="server-badges">
                    {server.is_official && <span className="badge official">🏆 Official</span>}
                    {server.is_verified && <span className="badge verified">✓ Verified</span>}
                    <span className="badge category">{server.category}</span>
                  </div>

                  <div className="server-actions" onClick={(e) => e.stopPropagation()}>
                    {isServerInstalled(server.id) ? (
                      <button 
                        className="action-btn installed"
                        onClick={() => uninstallServer(server.id)}
                      >
                        ✓ Installed
                      </button>
                    ) : (
                      <button 
                        className="action-btn install"
                        onClick={() => installServer(server)}
                        disabled={installing === server.id}
                      >
                        {installing === server.id ? 'Installing...' : '+ Install'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* Installed Servers View */
        <div className="installed-servers">
          {installedServerDetails.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📦</span>
              <p>No servers installed yet</p>
              <button className="browse-btn" onClick={() => setViewMode('browse')}>
                Browse Registry
              </button>
            </div>
          ) : (
            <div className="installed-list">
              {installedServerDetails.map(server => {
                const install = installedServers.find(i => i.server_id === server.id);
                return (
                  <div key={server.id} className={`installed-item ${install?.is_enabled ? 'enabled' : 'disabled'}`}>
                    <div className="installed-icon">
                      {server.icon_url ? (
                        <img src={server.icon_url} alt={server.display_name} />
                      ) : (
                        <span className="default-icon">{getCategoryIcon(server.category)}</span>
                      )}
                    </div>
                    <div className="installed-info">
                      <h4>{server.display_name}</h4>
                      <p>{server.description}</p>
                      <div className="installed-meta">
                        <span className={`status ${install?.health_status}`}>
                          {install?.health_status === 'connected' ? '🟢' : install?.health_status === 'error' ? '🔴' : '🟡'} 
                          {install?.health_status || 'pending'}
                        </span>
                        <span className="version">v{server.version}</span>
                      </div>
                    </div>
                    <div className="installed-actions">
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={install?.is_enabled || false}
                          onChange={(e) => toggleServerEnabled(server.id, e.target.checked)}
                        />
                        <span className="slider"></span>
                      </label>
                      <button 
                        className="uninstall-btn"
                        onClick={() => uninstallServer(server.id)}
                        title="Uninstall"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Server Detail Modal */}
      {selectedServer && (
        <div className="server-modal-overlay" onClick={() => setSelectedServer(null)}>
          <div className="server-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedServer(null)}>×</button>
            
            <div className="modal-header">
              <div className="modal-icon">
                {selectedServer.icon_url ? (
                  <img src={selectedServer.icon_url} alt={selectedServer.display_name} />
                ) : (
                  <span className="default-icon large">{getCategoryIcon(selectedServer.category)}</span>
                )}
              </div>
              <div className="modal-title">
                <h2>{selectedServer.display_name}</h2>
                <span className="modal-author">by {selectedServer.author || 'Unknown'}</span>
                <div className="modal-badges">
                  {selectedServer.is_official && <span className="badge official">🏆 Official</span>}
                  {selectedServer.is_verified && <span className="badge verified">✓ Verified</span>}
                </div>
              </div>
            </div>

            <div className="modal-stats">
              <div className="stat">
                <span className="stat-value">{renderStars(Math.round(selectedServer.average_rating))}</span>
                <span className="stat-label">{selectedServer.review_count} reviews</span>
              </div>
              <div className="stat">
                <span className="stat-value">📥 {selectedServer.install_count}</span>
                <span className="stat-label">installs</span>
              </div>
              <div className="stat">
                <span className="stat-value">v{selectedServer.version}</span>
                <span className="stat-label">version</span>
              </div>
            </div>

            <div className="modal-description">
              <h3>Description</h3>
              <p>{selectedServer.long_description || selectedServer.description}</p>
            </div>

            {selectedServer.tags.length > 0 && (
              <div className="modal-tags">
                {selectedServer.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            )}

            <div className="modal-links">
              {selectedServer.documentation_url && (
                <a href={selectedServer.documentation_url} target="_blank" rel="noopener noreferrer">
                  📖 Documentation
                </a>
              )}
              {selectedServer.repository_url && (
                <a href={selectedServer.repository_url} target="_blank" rel="noopener noreferrer">
                  💻 Source Code
                </a>
              )}
              {selectedServer.author_url && (
                <a href={selectedServer.author_url} target="_blank" rel="noopener noreferrer">
                  👤 Author
                </a>
              )}
            </div>

            <div className="modal-actions">
              {isServerInstalled(selectedServer.id) ? (
                <>
                  <button className="modal-btn secondary" onClick={() => uninstallServer(selectedServer.id)}>
                    Uninstall
                  </button>
                  <button className="modal-btn primary installed">
                    ✓ Installed
                  </button>
                </>
              ) : (
                <button 
                  className="modal-btn primary"
                  onClick={() => installServer(selectedServer)}
                  disabled={installing === selectedServer.id}
                >
                  {installing === selectedServer.id ? 'Installing...' : '+ Install Server'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
