import React, { useState, useEffect } from 'react';
import './AddMorgyForm.css';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface AddMorgyFormProps {
  isVisible: boolean;
  onClose: () => void;
  onMorgyCreated: (morgy: any) => void;
}

interface MCPServer {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
  icon_url?: string;
}

interface KnowledgeItem {
  type: 'file' | 'url' | 'text';
  title: string;
  content?: string;
  url?: string;
}

// Random Name Generators
const CYBER_PREFIXES = ['Cyber', 'Neon', 'Quantum', 'Stellar', 'Cosmic', 'Plasma', 'Nova', 'Photon', 'Electron', 'Nebula', 'Astro', 'Galactic', 'Void', 'Hyper', 'Ultra'];
const PIG_NAMES = ['Porky', 'Bacon', 'Hamlet', 'Wilbur', 'Babe', 'Piglet', 'Truffle', 'Snout', 'Oink', 'Squealer', 'Hog', 'Boar', 'Swine', 'Razorback'];
const TITLES = ['the Navigator', 'the Hacker', 'the Analyst', 'the Strategist', 'the Visionary', 'the Engineer', 'the Architect', 'the Maverick', 'the Pioneer', 'the Sage', 'the Oracle', 'the Prodigy', 'the Genius', 'the Master'];

const generateRandomName = () => {
  const prefix = CYBER_PREFIXES[Math.floor(Math.random() * CYBER_PREFIXES.length)];
  const name = PIG_NAMES[Math.floor(Math.random() * PIG_NAMES.length)];
  const title = TITLES[Math.floor(Math.random() * TITLES.length)];
  return `${prefix} ${name} ${title}`;
};

const AddMorgyFormEnhanced: React.FC<AddMorgyFormProps> = ({ isVisible, onClose, onMorgyCreated }) => {
  const { user, session } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // MCP Servers
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [selectedMcpServers, setSelectedMcpServers] = useState<string[]>([]);
  
  // Knowledge Base
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [newText, setNewText] = useState('');
  const [newTextTitle, setNewTextTitle] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom',
    specialty: '',
    avatar: '🐷',
    color: '#00FFFF',
    tone: 'professional',
    verbosity: 'balanced',
    emojiUsage: 'minimal',
    webSearch: true,
    codeExecution: false,
    fileProcessing: true,
    imageGeneration: false,
    isPublic: false
  });

  const categories = [
    { value: 'business', label: '💼 Business', desc: 'Marketing, sales, strategy' },
    { value: 'social', label: '📱 Social Media', desc: 'Content creation, engagement' },
    { value: 'research', label: '🔬 Research', desc: 'Analysis, data synthesis' },
    { value: 'technical', label: '⚙️ Technical', desc: 'Coding, debugging, architecture' },
    { value: 'creative', label: '🎨 Creative', desc: 'Writing, design, ideation' },
    { value: 'custom', label: '✨ Custom', desc: 'Your unique specialty' }
  ];

  // Expanded space/cyber pig avatars
  const avatarOptions = [
    '🐷', '🐖', '🐗', '🐽', // Classic pigs
    '🦄', '🦊', '🐺', '🦁', '🐯', '🐻', '🐼', // Animals
    '🤖', '👾', '🛸', '🚀', '⚡', '💫', '✨', '🌟', // Cyber/Space
    '🔮', '💎', '🎮', '🎯', '🎲', '🧬', '⚛️', '🔬' // Tech/Sci-fi
  ];

  // Neon/Cyber color palette
  const colorOptions = [
    '#00FFFF', // Cyan
    '#FF00FF', // Magenta
    '#00FF00', // Lime
    '#FF0080', // Hot Pink
    '#0080FF', // Electric Blue
    '#FF4500', // Neon Orange
    '#FFFF00', // Yellow
    '#FF1493', // Deep Pink
    '#00FF88', // Mint
    '#8B00FF', // Violet
    '#FF6600', // Tangerine
    '#00FFAA', // Aqua
    '#FF0066', // Rose
    '#66FF00', // Chartreuse
    '#FF00AA', // Fuchsia
    '#00AAFF'  // Sky Blue
  ];

  // Sample MCP Servers (fallback when database is empty)
  const SAMPLE_MCP_SERVERS: MCPServer[] = [
    {
      id: 'sample-web-search',
      name: 'web-search',
      display_name: 'Web Search',
      description: 'Search the web and fetch webpage content using Tavily AI',
      category: 'search',
      icon_url: undefined
    },
    {
      id: 'sample-stripe',
      name: 'stripe',
      display_name: 'Stripe Payments',
      description: 'Process payments, manage subscriptions, and handle billing',
      category: 'payments',
      icon_url: undefined
    },
    {
      id: 'sample-google-sheets',
      name: 'google-sheets',
      display_name: 'Google Sheets',
      description: 'Read and write data to Google Sheets spreadsheets',
      category: 'productivity',
      icon_url: undefined
    },
    {
      id: 'sample-github',
      name: 'github',
      display_name: 'GitHub',
      description: 'Interact with GitHub repositories, issues, and pull requests',
      category: 'development',
      icon_url: undefined
    },
    {
      id: 'sample-twitter',
      name: 'twitter',
      display_name: 'Twitter/X',
      description: 'Post tweets, read timelines, and manage social media presence',
      category: 'social',
      icon_url: undefined
    },
    {
      id: 'sample-email',
      name: 'email',
      display_name: 'Email',
      description: 'Send and receive emails, manage inbox and contacts',
      category: 'communication',
      icon_url: undefined
    }
  ];

  // Load MCP servers
  useEffect(() => {
    if (step === 5) {
      loadMCPServers();
    }
  }, [step]);

  const loadMCPServers = async () => {
    try {
      const { data, error } = await supabase
        .from('mcp_servers')
        .select('id, name, display_name, description, category, icon_url')
        .eq('is_active', true)
        .order('install_count', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // If database is empty, use sample MCP servers
      if (!data || data.length === 0) {
        setMcpServers(SAMPLE_MCP_SERVERS);
      } else {
        setMcpServers(data);
      }
    } catch (error) {
      console.error('Error loading MCP servers:', error);
      // Fallback to sample servers on error
      setMcpServers(SAMPLE_MCP_SERVERS);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleRandomize = () => {
    const randomName = generateRandomName();
    const randomAvatar = avatarOptions[Math.floor(Math.random() * avatarOptions.length)];
    const randomColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];
    const randomTone = ['professional', 'friendly', 'casual', 'enthusiastic'][Math.floor(Math.random() * 4)];
    const randomVerbosity = ['concise', 'balanced', 'detailed'][Math.floor(Math.random() * 3)];
    const randomEmoji = ['none', 'minimal', 'moderate', 'frequent'][Math.floor(Math.random() * 4)];
    
    setFormData(prev => ({
      ...prev,
      name: randomName,
      avatar: randomAvatar,
      color: randomColor,
      tone: randomTone,
      verbosity: randomVerbosity,
      emojiUsage: randomEmoji
    }));
  };

  const handleAddUrl = () => {
    if (!newUrl) return;
    setKnowledgeItems(prev => [...prev, { type: 'url', title: newUrl, url: newUrl }]);
    setNewUrl('');
  };

  const handleAddText = () => {
    if (!newText || !newTextTitle) return;
    setKnowledgeItems(prev => [...prev, { type: 'text', title: newTextTitle, content: newText }]);
    setNewText('');
    setNewTextTitle('');
  };

  const handleRemoveKnowledge = (index: number) => {
    setKnowledgeItems(prev => prev.filter((_, i) => i !== index));
  };

  const toggleMcpServer = (serverId: string) => {
    setSelectedMcpServers(prev => 
      prev.includes(serverId) 
        ? prev.filter(id => id !== serverId)
        : [...prev, serverId]
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || formData.name.length < 3) {
      setError('Name must be at least 3 characters');
      return;
    }

    if (!formData.specialty || formData.specialty.length < 10) {
      setError('Please describe the specialty (at least 10 characters)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const API_URL = 'https://morgus-deploy.fly.dev';
      
      // Get auth token from session
      const token = session?.access_token || '';
      const userId = user?.id || 'anonymous';
      
      const payload = {
        creator_id: userId,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        tags: [formData.category, formData.specialty.split(' ')[0]],
        aiConfig: {
          primaryModel: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          systemPrompt: `You are ${formData.name}, a specialized AI agent. Your specialty is: ${formData.specialty}. ${formData.description}`,
          fallbackModels: ['gpt-3.5-turbo']
        },
        personality: {
          tone: formData.tone,
          verbosity: formData.verbosity,
          emojiUsage: formData.emojiUsage,
          responseStyle: formData.specialty
        },
        appearance: {
          avatar: formData.avatar,
          color: formData.color,
          icon: 'custom'
        },
        capabilities: {
          webSearch: formData.webSearch,
          codeExecution: formData.codeExecution,
          fileProcessing: formData.fileProcessing,
          imageGeneration: formData.imageGeneration,
          voiceInteraction: false,
          mcpTools: selectedMcpServers
        },
        knowledgeBase: {
          documents: knowledgeItems.filter(k => k.type === 'file'),
          urls: knowledgeItems.filter(k => k.type === 'url').map(k => k.url),
          customData: knowledgeItems.filter(k => k.type === 'text').map(k => ({ title: k.title, content: k.content }))
        },
        marketplace: {
          isPublic: formData.isPublic,
          licenseType: 'free',
          price: 0,
          isPremium: false
        },
        is_starter: false
      };

      console.log('Creating Morgy with payload:', payload);
      
      const response = await fetch(`${API_URL}/api/morgys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok || !data.success) {
        const errorMsg = data.error || data.message || `Server error: ${response.status}`;
        console.error('Failed to create Morgy:', errorMsg);
        throw new Error(errorMsg);
      }

      // Success!
      onMorgyCreated(data.morgy);
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'custom',
        specialty: '',
        avatar: '🐷',
        color: '#00FFFF',
        tone: 'professional',
        verbosity: 'balanced',
        emojiUsage: 'minimal',
        webSearch: true,
        codeExecution: false,
        fileProcessing: true,
        imageGeneration: false,
        isPublic: false
      });
      setKnowledgeItems([]);
      setSelectedMcpServers([]);
      setStep(1);
      
    } catch (err: any) {
      console.error('Error creating Morgy:', err);
      const errorMessage = err.message || 'Failed to create Morgy. Please try again.';
      setError(errorMessage);
      
      // Show more helpful error messages
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setError('Authentication error. Please sign in again.');
      } else if (errorMessage.includes('400')) {
        setError('Invalid data. Please check all fields.');
      } else if (errorMessage.includes('500')) {
        setError('Server error. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  const totalSteps = 5;

  return (
    <div className="add-morgy-overlay">
      <div className="add-morgy-modal">
        {/* Header */}
        <div className="add-morgy-header">
          <span className="add-morgy-icon">🐷</span>
          <h2>Create Custom Morgy</h2>
          <button className="randomize-all-btn" onClick={handleRandomize} title="Randomize Everything">
            🎲
          </button>
          <button className="add-morgy-close" onClick={onClose}>×</button>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`step ${s === step ? 'active' : ''} ${s < step ? 'completed' : ''}`}>
              <div className="step-number">{s}</div>
              <div className="step-label">
                {s === 1 && 'Basic Info'}
                {s === 2 && 'Appearance'}
                {s === 3 && 'Capabilities'}
                {s === 4 && 'Knowledge'}
                {s === 5 && 'MCP Tools'}
              </div>
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {/* Step Content */}
        <div className="add-morgy-content">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="form-step">
              <div className="form-group">
                <label>Name *</label>
                <div className="input-with-button">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Quantum Bacon the Navigator"
                    maxLength={50}
                  />
                  <button 
                    className="randomize-btn" 
                    onClick={() => handleInputChange('name', generateRandomName())}
                    title="Generate random name"
                  >
                    🎲
                  </button>
                </div>
                <span className="char-count">{formData.name.length}/50</span>
              </div>

              <div className="form-group">
                <label>Category *</label>
                <div className="category-grid">
                  {categories.map((cat) => (
                    <div
                      key={cat.value}
                      className={`category-option ${formData.category === cat.value ? 'selected' : ''}`}
                      onClick={() => handleInputChange('category', cat.value)}
                    >
                      <div className="category-label">{cat.label}</div>
                      <div className="category-desc">{cat.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Specialty *</label>
                <textarea
                  value={formData.specialty}
                  onChange={(e) => handleInputChange('specialty', e.target.value)}
                  placeholder="What is this Morgy's unique expertise? (e.g., 'Creating viral TikTok hooks and engagement strategies')"
                  maxLength={200}
                  rows={3}
                />
                <span className="char-count">{formData.specialty.length}/200</span>
              </div>

              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Additional context about this Morgy's capabilities..."
                  maxLength={500}
                  rows={3}
                />
                <span className="char-count">{formData.description.length}/500</span>
              </div>
            </div>
          )}

          {/* Step 2: Appearance */}
          {step === 2 && (
            <div className="form-step">
              <div className="form-group">
                <label>Avatar</label>
                <div className="avatar-grid">
                  {avatarOptions.map((emoji) => (
                    <div
                      key={emoji}
                      className={`avatar-option ${formData.avatar === emoji ? 'selected' : ''}`}
                      onClick={() => handleInputChange('avatar', emoji)}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Color Theme</label>
                <div className="color-grid">
                  {colorOptions.map((color) => (
                    <div
                      key={color}
                      className={`color-option ${formData.color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleInputChange('color', color)}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Personality Tone</label>
                <select value={formData.tone} onChange={(e) => handleInputChange('tone', e.target.value)}>
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="casual">Casual</option>
                  <option value="enthusiastic">Enthusiastic</option>
                  <option value="academic">Academic</option>
                  <option value="humorous">Humorous</option>
                </select>
              </div>

              <div className="form-group">
                <label>Response Length</label>
                <select value={formData.verbosity} onChange={(e) => handleInputChange('verbosity', e.target.value)}>
                  <option value="concise">Concise (brief answers)</option>
                  <option value="balanced">Balanced (moderate detail)</option>
                  <option value="detailed">Detailed (comprehensive)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Emoji Usage</label>
                <select value={formData.emojiUsage} onChange={(e) => handleInputChange('emojiUsage', e.target.value)}>
                  <option value="none">None</option>
                  <option value="minimal">Minimal</option>
                  <option value="moderate">Moderate</option>
                  <option value="frequent">Frequent</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Capabilities */}
          {step === 3 && (
            <div className="form-step">
              <div className="capabilities-list">
                <div 
                  className={`capability-item ${formData.webSearch ? 'enabled' : ''}`}
                  onClick={() => handleInputChange('webSearch', !formData.webSearch)}
                >
                  <div className="capability-checkbox">
                    <input type="checkbox" checked={formData.webSearch} readOnly />
                  </div>
                  <div className="capability-icon">🔍</div>
                  <div className="capability-info">
                    <div className="capability-name">Web Search</div>
                    <div className="capability-desc">Search the internet for information</div>
                  </div>
                </div>

                <div 
                  className={`capability-item ${formData.codeExecution ? 'enabled' : ''}`}
                  onClick={() => handleInputChange('codeExecution', !formData.codeExecution)}
                >
                  <div className="capability-checkbox">
                    <input type="checkbox" checked={formData.codeExecution} readOnly />
                  </div>
                  <div className="capability-icon">💻</div>
                  <div className="capability-info">
                    <div className="capability-name">Code Execution</div>
                    <div className="capability-desc">Run and test code snippets</div>
                  </div>
                </div>

                <div 
                  className={`capability-item ${formData.fileProcessing ? 'enabled' : ''}`}
                  onClick={() => handleInputChange('fileProcessing', !formData.fileProcessing)}
                >
                  <div className="capability-checkbox">
                    <input type="checkbox" checked={formData.fileProcessing} readOnly />
                  </div>
                  <div className="capability-icon">📁</div>
                  <div className="capability-info">
                    <div className="capability-name">File Processing</div>
                    <div className="capability-desc">Read and analyze documents</div>
                  </div>
                </div>

                <div 
                  className={`capability-item ${formData.imageGeneration ? 'enabled' : ''}`}
                  onClick={() => handleInputChange('imageGeneration', !formData.imageGeneration)}
                >
                  <div className="capability-checkbox">
                    <input type="checkbox" checked={formData.imageGeneration} readOnly />
                  </div>
                  <div className="capability-icon">🎨</div>
                  <div className="capability-info">
                    <div className="capability-name">Image Generation</div>
                    <div className="capability-desc">Create images from descriptions</div>
                  </div>
                </div>

                <div 
                  className={`capability-item ${formData.isPublic ? 'enabled' : ''}`}
                  onClick={() => handleInputChange('isPublic', !formData.isPublic)}
                >
                  <div className="capability-checkbox">
                    <input type="checkbox" checked={formData.isPublic} readOnly />
                  </div>
                  <div className="capability-icon">🌐</div>
                  <div className="capability-info">
                    <div className="capability-name">Make Public</div>
                    <div className="capability-desc">Share in Morgy marketplace</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Knowledge Base */}
          {step === 4 && (
            <div className="form-step">
              <p className="step-description">
                Give your Morgy specialized knowledge by adding URLs, documents, or custom text.
              </p>

              {/* Add URL */}
              <div className="knowledge-section">
                <h4>📎 Add Website/URL</h4>
                <div className="input-with-button">
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://example.com/docs"
                  />
                  <button onClick={handleAddUrl} disabled={!newUrl}>Add</button>
                </div>
              </div>

              {/* Add Custom Text */}
              <div className="knowledge-section">
                <h4>📝 Add Custom Text</h4>
                <input
                  type="text"
                  value={newTextTitle}
                  onChange={(e) => setNewTextTitle(e.target.value)}
                  placeholder="Title"
                  style={{ marginBottom: '8px' }}
                />
                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Paste your custom knowledge here..."
                  rows={4}
                />
                <button onClick={handleAddText} disabled={!newText || !newTextTitle}>Add Text</button>
              </div>

              {/* Knowledge Items List */}
              {knowledgeItems.length > 0 && (
                <div className="knowledge-items">
                  <h4>Added Knowledge ({knowledgeItems.length})</h4>
                  {knowledgeItems.map((item, index) => (
                    <div key={index} className="knowledge-item">
                      <span className="knowledge-type">
                        {item.type === 'url' && '🔗'}
                        {item.type === 'text' && '📝'}
                        {item.type === 'file' && '📄'}
                      </span>
                      <span className="knowledge-title">{item.title}</span>
                      <button 
                        className="remove-knowledge-btn" 
                        onClick={() => handleRemoveKnowledge(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {knowledgeItems.length === 0 && (
                <div className="empty-state">
                  <p>No knowledge added yet. Add URLs or text to give your Morgy specialized expertise!</p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: MCP Tools */}
          {step === 5 && (
            <div className="form-step">
              <p className="step-description">
                Connect your Morgy to MCP servers to give it access to specialized tools and APIs.
              </p>

              {mcpServers.length > 0 ? (
                <div className="mcp-servers-list">
                  {mcpServers.map((server) => (
                    <div
                      key={server.id}
                      className={`mcp-server-item ${selectedMcpServers.includes(server.id) ? 'selected' : ''}`}
                      onClick={() => toggleMcpServer(server.id)}
                    >
                      <div className="mcp-checkbox">
                        <input type="checkbox" checked={selectedMcpServers.includes(server.id)} readOnly />
                      </div>
                      {server.icon_url && (
                        <img src={server.icon_url} alt={server.display_name} className="mcp-icon" />
                      )}
                      <div className="mcp-info">
                        <div className="mcp-name">{server.display_name}</div>
                        <div className="mcp-desc">{server.description}</div>
                        <div className="mcp-category">{server.category}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>Loading MCP servers...</p>
                </div>
              )}

              {selectedMcpServers.length > 0 && (
                <div className="selected-count">
                  ✓ {selectedMcpServers.length} MCP server{selectedMcpServers.length > 1 ? 's' : ''} selected
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="add-morgy-footer">
          {step > 1 && (
            <button className="btn-secondary" onClick={() => setStep(step - 1)} disabled={isSubmitting}>
              ← Back
            </button>
          )}
          
          <div className="step-info">
            Step {step} of {totalSteps}
          </div>

          {step < totalSteps ? (
            <button className="btn-primary" onClick={() => setStep(step + 1)}>
              Next →
            </button>
          ) : (
            <button 
              className="btn-primary create-btn" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? '⏳ Creating...' : '✨ Create Morgy'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddMorgyFormEnhanced;
