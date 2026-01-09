import React, { useState } from 'react';
import './AddMorgyForm.css';
import { useAuth } from '../lib/auth';

interface AddMorgyFormProps {
  isVisible: boolean;
  onClose: () => void;
  onMorgyCreated: (morgy: any) => void;
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

const AddMorgyForm: React.FC<AddMorgyFormProps> = ({ isVisible, onClose, onMorgyCreated }) => {
  const { user, session } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
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
          mcpTools: []
        },
        knowledgeBase: {
          documents: [],
          urls: [],
          customData: formData.specialty
        },
        marketplace: {
          isPublic: formData.isPublic,
          licenseType: 'free',
          price: 0,
          isPremium: false
        }
      };

      const response = await fetch(`${API_URL}/api/morgys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create Morgy');
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
      setStep(1);
    } catch (err: any) {
      console.error('Error creating Morgy:', err);
      setError(err.message || 'Failed to create Morgy. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="add-morgy-modal-overlay" onClick={onClose}>
      <div className="add-morgy-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="add-morgy-header">
          <span className="add-morgy-icon">🐷</span>
          <h2>Create Custom Morgy</h2>
          <button className="add-morgy-randomize" onClick={handleRandomize} title="Randomize all">
            🎲
          </button>
          <button className="add-morgy-close" onClick={onClose}>×</button>
        </div>

        {/* Progress Steps */}
        <div className="add-morgy-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Basic Info</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Appearance</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Capabilities</div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="add-morgy-error">
            ⚠️ {error}
          </div>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="add-morgy-step-content">
            <div className="form-group">
              <label>Morgy Name *</label>
              <div className="input-with-button">
                <input
                  type="text"
                  placeholder="e.g., Cyber Bacon the Navigator"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  maxLength={50}
                />
                <button 
                  className="btn-random-small" 
                  onClick={() => handleInputChange('name', generateRandomName())}
                  title="Generate random name"
                >
                  🎲
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Category *</label>
              <div className="category-grid">
                {categories.map(cat => (
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
              <label>Specialty / Expertise *</label>
              <textarea
                placeholder="Describe what this Morgy specializes in... (e.g., 'Quantum computing, blockchain security, AI ethics')"
                value={formData.specialty}
                onChange={(e) => handleInputChange('specialty', e.target.value)}
                rows={3}
                maxLength={200}
              />
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                placeholder="Additional details about this Morgy's personality and approach..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={2}
                maxLength={300}
              />
            </div>
          </div>
        )}

        {/* Step 2: Appearance */}
        {step === 2 && (
          <div className="add-morgy-step-content">
            <div className="form-group">
              <label>Avatar</label>
              <div className="avatar-grid">
                {avatarOptions.map(emoji => (
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
              <label>Color Theme (Neon/Cyber)</label>
              <div className="color-grid">
                {colorOptions.map(color => (
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
                <option value="formal">Formal</option>
              </select>
            </div>

            <div className="form-group">
              <label>Response Length</label>
              <select value={formData.verbosity} onChange={(e) => handleInputChange('verbosity', e.target.value)}>
                <option value="concise">Concise</option>
                <option value="balanced">Balanced</option>
                <option value="detailed">Detailed</option>
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
          <div className="add-morgy-step-content">
            <div className="capabilities-section">
              <label className="capability-toggle">
                <input
                  type="checkbox"
                  checked={formData.webSearch}
                  onChange={(e) => handleInputChange('webSearch', e.target.checked)}
                />
                <span className="capability-icon">🔍</span>
                <div className="capability-info">
                  <div className="capability-name">Web Search</div>
                  <div className="capability-desc">Search the internet for information</div>
                </div>
              </label>

              <label className="capability-toggle">
                <input
                  type="checkbox"
                  checked={formData.codeExecution}
                  onChange={(e) => handleInputChange('codeExecution', e.target.checked)}
                />
                <span className="capability-icon">💻</span>
                <div className="capability-info">
                  <div className="capability-name">Code Execution</div>
                  <div className="capability-desc">Run and test code snippets</div>
                </div>
              </label>

              <label className="capability-toggle">
                <input
                  type="checkbox"
                  checked={formData.fileProcessing}
                  onChange={(e) => handleInputChange('fileProcessing', e.target.checked)}
                />
                <span className="capability-icon">📁</span>
                <div className="capability-info">
                  <div className="capability-name">File Processing</div>
                  <div className="capability-desc">Read and analyze documents</div>
                </div>
              </label>

              <label className="capability-toggle">
                <input
                  type="checkbox"
                  checked={formData.imageGeneration}
                  onChange={(e) => handleInputChange('imageGeneration', e.target.checked)}
                />
                <span className="capability-icon">🎨</span>
                <div className="capability-info">
                  <div className="capability-name">Image Generation</div>
                  <div className="capability-desc">Create images from descriptions</div>
                </div>
              </label>
            </div>

            <div className="form-group">
              <label className="capability-toggle">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                />
                <span className="capability-icon">🌐</span>
                <div className="capability-info">
                  <div className="capability-name">Make Public</div>
                  <div className="capability-desc">Share this Morgy in the marketplace</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="add-morgy-footer">
          {step > 1 && (
            <button className="btn-secondary" onClick={() => setStep(step - 1)} disabled={isSubmitting}>
              ← Back
            </button>
          )}
          <div className="footer-spacer"></div>
          {step < 3 ? (
            <button className="btn-primary" onClick={() => setStep(step + 1)}>
              Next →
            </button>
          ) : (
            <button 
              className="btn-primary" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : '✨ Create Morgy'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddMorgyForm;
