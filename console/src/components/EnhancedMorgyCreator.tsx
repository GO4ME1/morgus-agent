import React, { useState } from 'react';
import { 
  Sparkles, Brain, Palette, Database, Zap, DollarSign, Eye, Save, 
  Rocket, MessageSquare, Upload, Check, X,
  ChevronRight, ChevronLeft, Store
} from 'lucide-react';
import { useAuth } from '../lib/auth';

interface EnhancedMorgyData {
  // Basic Info
  name: string;
  description: string;
  category: 'business' | 'social' | 'research' | 'technical' | 'creative' | 'custom';
  tags: string[];
  
  // AI Configuration
  aiConfig: {
    primaryModel: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    fallbackModels: string[];
  };
  
  // Personality
  personality: {
    tone: 'professional' | 'casual' | 'friendly' | 'formal' | 'humorous';
    verbosity: 'concise' | 'balanced' | 'detailed';
    emojiUsage: 'none' | 'minimal' | 'moderate' | 'frequent';
    responseStyle: string;
  };
  
  // Appearance
  appearance: {
    avatar: string;
    color: string;
    icon: string;
  };
  
  // Capabilities
  capabilities: {
    webSearch: boolean;
    codeExecution: boolean;
    fileProcessing: boolean;
    imageGeneration: boolean;
    voiceInteraction: boolean;
    mcpTools: string[];
  };
  
  // Knowledge Base
  knowledgeBase: {
    documents: string[];
    urls: string[];
    customData: string;
  };
  
  // Marketplace
  marketplace: {
    isPublic: boolean;
    price: number;
    isPremium: boolean;
    licenseType: 'free' | 'paid' | 'subscription';
  };
}

interface EnhancedMorgyCreatorProps {
  onComplete: (morgyData: EnhancedMorgyData) => void;
  onCancel: () => void;
  editMode?: boolean;
  existingMorgy?: Partial<EnhancedMorgyData>;
}

export const EnhancedMorgyCreator: React.FC<EnhancedMorgyCreatorProps> = ({
  onComplete,
  onCancel,
  editMode = false,
  existingMorgy,
}) => {
  const { user: _user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [morgyData, setMorgyData] = useState<Partial<EnhancedMorgyData>>(existingMorgy || {
    name: '',
    description: '',
    category: 'custom',
    tags: [],
    aiConfig: {
      primaryModel: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: '',
      fallbackModels: ['gpt-3.5-turbo'],
    },
    personality: {
      tone: 'professional',
      verbosity: 'balanced',
      emojiUsage: 'minimal',
      responseStyle: '',
    },
    appearance: {
      avatar: '🐷',
      color: '#8B5CF6',
      icon: 'pig',
    },
    capabilities: {
      webSearch: true,
      codeExecution: false,
      fileProcessing: true,
      imageGeneration: false,
      voiceInteraction: false,
      mcpTools: [],
    },
    knowledgeBase: {
      documents: [],
      urls: [],
      customData: '',
    },
    marketplace: {
      isPublic: false,
      price: 0,
      isPremium: false,
      licenseType: 'free',
    },
  });

  const steps = [
    { id: 1, title: 'Basic Info', icon: Sparkles, desc: 'Name, category, and description' },
    { id: 2, title: 'AI Config', icon: Brain, desc: 'Model selection and parameters' },
    { id: 3, title: 'Personality', icon: MessageSquare, desc: 'Tone, style, and behavior' },
    { id: 4, title: 'Appearance', icon: Palette, desc: 'Avatar, colors, and branding' },
    { id: 5, title: 'Capabilities', icon: Zap, desc: 'Tools and features' },
    { id: 6, title: 'Knowledge', icon: Database, desc: 'Training data and context' },
    { id: 7, title: 'Marketplace', icon: Store, desc: 'Pricing and distribution' },
  ];

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Save to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      onComplete(morgyData as EnhancedMorgyData);
    } catch (error) {
      console.error('Failed to save Morgy:', error);
      alert('Failed to save Morgy');
    } finally {
      setSaving(false);
    }
  };

  const updateMorgyData = (updates: Partial<EnhancedMorgyData>) => {
    setMorgyData({ ...morgyData, ...updates });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-2">
              <Rocket className="w-8 h-8 text-purple-400" />
              {editMode ? 'Edit Morgy' : 'Create Your Morgy'}
            </h1>
            <p className="text-gray-400">
              {editMode ? 'Update your AI agent' : 'Build a custom AI agent in 7 steps'}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Hide' : 'Preview'}
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Progress */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 sticky top-4">
              <h3 className="text-lg font-bold text-white mb-4">Progress</h3>
              <div className="space-y-3">
                {steps.map((step) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStep(step.id)}
                      className={`
                        w-full text-left p-3 rounded-lg transition-all
                        ${isActive ? 'bg-purple-600 text-white' : ''}
                        ${isCompleted ? 'bg-green-600/20 text-green-400' : ''}
                        ${!isActive && !isCompleted ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : ''}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center
                          ${isActive ? 'bg-purple-700' : ''}
                          ${isCompleted ? 'bg-green-600' : ''}
                          ${!isActive && !isCompleted ? 'bg-gray-600' : ''}
                        `}>
                          {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{step.title}</div>
                          <div className="text-xs opacity-75">{step.desc}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="text-sm text-gray-400 mb-2">Completion</div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${(currentStep / steps.length) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {currentStep} of {steps.length} steps
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6 md:p-8 border border-gray-700 min-h-[600px]">
              {currentStep === 1 && <Step1BasicInfo morgyData={morgyData} updateMorgyData={updateMorgyData} />}
              {currentStep === 2 && <Step2AIConfig morgyData={morgyData} updateMorgyData={updateMorgyData} />}
              {currentStep === 3 && <Step3Personality morgyData={morgyData} updateMorgyData={updateMorgyData} />}
              {currentStep === 4 && <Step4Appearance morgyData={morgyData} updateMorgyData={updateMorgyData} />}
              {currentStep === 5 && <Step5Capabilities morgyData={morgyData} updateMorgyData={updateMorgyData} />}
              {currentStep === 6 && <Step6Knowledge morgyData={morgyData} updateMorgyData={updateMorgyData} />}
              {currentStep === 7 && <Step7Marketplace morgyData={morgyData} updateMorgyData={updateMorgyData} />}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              
              {currentStep === steps.length ? (
                <button
                  onClick={handleSave}
                  disabled={saving || !morgyData.name}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-all"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editMode ? 'Update Morgy' : 'Create Morgy'}
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Morgy Preview</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <MorgyPreview morgyData={morgyData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Step Components
const Step1BasicInfo: React.FC<{
  morgyData: Partial<EnhancedMorgyData>;
  updateMorgyData: (updates: Partial<EnhancedMorgyData>) => void;
}> = ({ morgyData, updateMorgyData }) => {
  const categories: { id: EnhancedMorgyData['category']; name: string; icon: string; desc: string }[] = [
    { id: 'business', name: 'Business', icon: '💼', desc: 'Marketing, sales, strategy' },
    { id: 'social', name: 'Social Media', icon: '📱', desc: 'Content, engagement, growth' },
    { id: 'research', name: 'Research', icon: '🔬', desc: 'Analysis, reports, insights' },
    { id: 'technical', name: 'Technical', icon: '💻', desc: 'Coding, debugging, DevOps' },
    { id: 'creative', name: 'Creative', icon: '🎨', desc: 'Design, writing, ideation' },
    { id: 'custom', name: 'Custom', icon: '⚡', desc: 'Build from scratch' },
  ];

  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    if (tagInput && !morgyData.tags?.includes(tagInput)) {
      updateMorgyData({ tags: [...(morgyData.tags || []), tagInput] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    updateMorgyData({ tags: morgyData.tags?.filter(t => t !== tag) || [] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Basic Information</h2>
        <p className="text-gray-400">Give your Morgy a name and purpose</p>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Morgy Name *
        </label>
        <input
          type="text"
          value={morgyData.name || ''}
          onChange={(e) => updateMorgyData({ name: e.target.value })}
          placeholder="e.g., Marketing Maven, Code Wizard, Research Pro..."
          className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Category
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateMorgyData({ category: cat.id })}
              className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${morgyData.category === cat.id
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                }
              `}
            >
              <div className="text-2xl mb-1">{cat.icon}</div>
              <div className="font-medium text-white text-sm">{cat.name}</div>
              <div className="text-xs text-gray-400">{cat.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={morgyData.description || ''}
          onChange={(e) => updateMorgyData({ description: e.target.value })}
          placeholder="Describe what this Morgy does and how it can help users..."
          rows={4}
          className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Tags (for discoverability)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
            placeholder="Add tags..."
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
          />
          <button
            onClick={addTag}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {morgyData.tags?.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm flex items-center gap-2"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const Step2AIConfig: React.FC<{
  morgyData: Partial<EnhancedMorgyData>;
  updateMorgyData: (updates: Partial<EnhancedMorgyData>) => void;
}> = ({ morgyData, updateMorgyData }) => {
  const models = [
    { id: 'gpt-4', name: 'GPT-4', desc: 'Most capable, best for complex tasks', cost: '$$$$' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', desc: 'Fast and efficient', cost: '$' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'Google\'s latest, very fast', cost: '$$' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', desc: 'Excellent reasoning', cost: '$$$' },
    { id: 'mixtral-8x7b', name: 'Mixtral 8x7B', desc: 'Open source, good quality', cost: '$' },
  ];

  const updateAIConfig = (updates: Partial<EnhancedMorgyData['aiConfig']>) => {
    updateMorgyData({
      aiConfig: { ...morgyData.aiConfig, ...updates } as EnhancedMorgyData['aiConfig'],
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">AI Configuration</h2>
        <p className="text-gray-400">Choose the AI model and parameters</p>
      </div>

      {/* Primary Model */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Primary AI Model
        </label>
        <div className="space-y-2">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => updateAIConfig({ primaryModel: model.id })}
              className={`
                w-full p-4 rounded-lg border-2 text-left transition-all
                ${morgyData.aiConfig?.primaryModel === model.id
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">{model.name}</div>
                  <div className="text-sm text-gray-400">{model.desc}</div>
                </div>
                <div className="text-sm text-gray-400">{model.cost}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Temperature */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Temperature: {morgyData.aiConfig?.temperature || 0.7}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={morgyData.aiConfig?.temperature || 0.7}
          onChange={(e) => updateAIConfig({ temperature: parseFloat(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Precise</span>
          <span>Balanced</span>
          <span>Creative</span>
        </div>
      </div>

      {/* Max Tokens */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Max Response Length
        </label>
        <select
          value={morgyData.aiConfig?.maxTokens || 2000}
          onChange={(e) => updateAIConfig({ maxTokens: parseInt(e.target.value) })}
          className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
        >
          <option value="500">Short (500 tokens)</option>
          <option value="1000">Medium (1000 tokens)</option>
          <option value="2000">Long (2000 tokens)</option>
          <option value="4000">Very Long (4000 tokens)</option>
        </select>
      </div>

      {/* System Prompt */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          System Prompt (Instructions for the AI)
        </label>
        <textarea
          value={morgyData.aiConfig?.systemPrompt || ''}
          onChange={(e) => updateAIConfig({ systemPrompt: e.target.value })}
          placeholder="You are a helpful assistant that specializes in..."
          rows={6}
          className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none font-mono text-sm"
        />
      </div>
    </div>
  );
};

const Step3Personality: React.FC<{
  morgyData: Partial<EnhancedMorgyData>;
  updateMorgyData: (updates: Partial<EnhancedMorgyData>) => void;
}> = ({ morgyData, updateMorgyData }) => {
  const updatePersonality = (updates: Partial<EnhancedMorgyData['personality']>) => {
    updateMorgyData({
      personality: { ...morgyData.personality, ...updates } as EnhancedMorgyData['personality'],
    });
  };

  const tones: { id: EnhancedMorgyData['personality']['tone']; name: string; desc: string }[] = [
    { id: 'professional', name: 'Professional', desc: 'Business-like and formal' },
    { id: 'casual', name: 'Casual', desc: 'Relaxed and conversational' },
    { id: 'friendly', name: 'Friendly', desc: 'Warm and approachable' },
    { id: 'formal', name: 'Formal', desc: 'Academic and precise' },
    { id: 'humorous', name: 'Humorous', desc: 'Witty and entertaining' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Personality</h2>
        <p className="text-gray-400">Define how your Morgy communicates</p>
      </div>

      {/* Tone */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Communication Tone
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tones.map((tone) => (
            <button
              key={tone.id}
              onClick={() => updatePersonality({ tone: tone.id })}
              className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${morgyData.personality?.tone === tone.id
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                }
              `}
            >
              <div className="font-medium text-white text-sm">{tone.name}</div>
              <div className="text-xs text-gray-400">{tone.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Verbosity */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Response Length
        </label>
        <div className="grid grid-cols-3 gap-3">
          {['concise', 'balanced', 'detailed'].map((level) => (
            <button
              key={level}
              onClick={() => updatePersonality({ verbosity: level as EnhancedMorgyData['personality']['verbosity'] })}
              className={`
                p-4 rounded-lg border-2 text-center transition-all
                ${morgyData.personality?.verbosity === level
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                }
              `}
            >
              <div className="font-medium text-white text-sm capitalize">{level}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Emoji Usage */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Emoji Usage
        </label>
        <div className="grid grid-cols-4 gap-3">
          {['none', 'minimal', 'moderate', 'frequent'].map((level) => (
            <button
              key={level}
              onClick={() => updatePersonality({ emojiUsage: level as EnhancedMorgyData['personality']['emojiUsage'] })}
              className={`
                p-4 rounded-lg border-2 text-center transition-all
                ${morgyData.personality?.emojiUsage === level
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                }
              `}
            >
              <div className="font-medium text-white text-sm capitalize">{level}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Response Style */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Custom Response Style (Optional)
        </label>
        <textarea
          value={morgyData.personality?.responseStyle || ''}
          onChange={(e) => updatePersonality({ responseStyle: e.target.value })}
          placeholder="e.g., Always start with a greeting, use bullet points, include examples..."
          rows={4}
          className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
        />
      </div>
    </div>
  );
};

const Step4Appearance: React.FC<{
  morgyData: Partial<EnhancedMorgyData>;
  updateMorgyData: (updates: Partial<EnhancedMorgyData>) => void;
}> = ({ morgyData, updateMorgyData }) => {
  const updateAppearance = (updates: Partial<EnhancedMorgyData['appearance']>) => {
    updateMorgyData({
      appearance: { ...morgyData.appearance, ...updates } as EnhancedMorgyData['appearance'],
    });
  };

  const avatars = ['🐷', '🤖', '👨‍💼', '👩‍💼', '🧙', '🦸', '🐉', '🦄', '🌟', '💎', '🔮', '⚡'];
  const colors = [
    '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', 
    '#6366F1', '#8B5CF6', '#D946EF', '#F43F5E', '#EF4444'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Appearance</h2>
        <p className="text-gray-400">Customize how your Morgy looks</p>
      </div>

      {/* Avatar */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Avatar
        </label>
        <div className="grid grid-cols-6 md:grid-cols-12 gap-3">
          {avatars.map((avatar) => (
            <button
              key={avatar}
              onClick={() => updateAppearance({ avatar })}
              className={`
                p-4 rounded-lg border-2 text-center text-3xl transition-all
                ${morgyData.appearance?.avatar === avatar
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                }
              `}
            >
              {avatar}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Primary Color
        </label>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => updateAppearance({ color })}
              className={`
                w-full aspect-square rounded-lg border-2 transition-all
                ${morgyData.appearance?.color === color
                  ? 'border-white scale-110'
                  : 'border-gray-600 hover:border-gray-500'
                }
              `}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-700 rounded-lg p-6">
        <div className="text-sm font-medium text-gray-300 mb-4">Preview</div>
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
            style={{ backgroundColor: morgyData.appearance?.color || '#8B5CF6' }}
          >
            {morgyData.appearance?.avatar || '🐷'}
          </div>
          <div>
            <div className="text-white font-bold">{morgyData.name || 'Your Morgy'}</div>
            <div className="text-sm text-gray-400">{morgyData.description || 'No description yet'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Step5Capabilities: React.FC<{
  morgyData: Partial<EnhancedMorgyData>;
  updateMorgyData: (updates: Partial<EnhancedMorgyData>) => void;
}> = ({ morgyData, updateMorgyData }) => {
  const updateCapabilities = (updates: Partial<EnhancedMorgyData['capabilities']>) => {
    updateMorgyData({
      capabilities: { ...morgyData.capabilities, ...updates } as EnhancedMorgyData['capabilities'],
    });
  };

  const capabilities = [
    { id: 'webSearch', name: 'Web Search', desc: 'Search the internet for information', icon: '🔍' },
    { id: 'codeExecution', name: 'Code Execution', desc: 'Run Python, JavaScript, and more', icon: '💻' },
    { id: 'fileProcessing', name: 'File Processing', desc: 'Handle PDFs, images, documents', icon: '📁' },
    { id: 'imageGeneration', name: 'Image Generation', desc: 'Create images with AI', icon: '🎨' },
    { id: 'voiceInteraction', name: 'Voice Interaction', desc: 'Speech-to-text and text-to-speech', icon: '🎤' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Capabilities</h2>
        <p className="text-gray-400">Enable tools and features for your Morgy</p>
      </div>

      <div className="space-y-3">
        {capabilities.map((cap) => (
          <button
            key={cap.id}
            onClick={() => updateCapabilities({ [cap.id]: !morgyData.capabilities?.[cap.id as keyof typeof morgyData.capabilities] })}
            className={`
              w-full p-4 rounded-lg border-2 text-left transition-all
              ${morgyData.capabilities?.[cap.id as keyof typeof morgyData.capabilities]
                ? 'border-purple-500 bg-purple-500/20'
                : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
              }
            `}
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">{cap.icon}</div>
              <div className="flex-1">
                <div className="font-medium text-white">{cap.name}</div>
                <div className="text-sm text-gray-400">{cap.desc}</div>
              </div>
              <div className={`
                w-12 h-6 rounded-full transition-all
                ${morgyData.capabilities?.[cap.id as keyof typeof morgyData.capabilities]
                  ? 'bg-purple-600'
                  : 'bg-gray-600'
                }
              `}>
                <div className={`
                  w-5 h-5 bg-white rounded-full transition-all mt-0.5
                  ${morgyData.capabilities?.[cap.id as keyof typeof morgyData.capabilities]
                    ? 'ml-6'
                    : 'ml-0.5'
                  }
                `} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const Step6Knowledge: React.FC<{
  morgyData: Partial<EnhancedMorgyData>;
  updateMorgyData: (updates: Partial<EnhancedMorgyData>) => void;
}> = ({ morgyData, updateMorgyData }) => {
  const updateKnowledgeBase = (updates: Partial<EnhancedMorgyData['knowledgeBase']>) => {
    updateMorgyData({
      knowledgeBase: { ...morgyData.knowledgeBase, ...updates } as EnhancedMorgyData['knowledgeBase'],
    });
  };

  const [urlInput, setUrlInput] = useState('');

  const addUrl = () => {
    if (urlInput && !morgyData.knowledgeBase?.urls?.includes(urlInput)) {
      updateKnowledgeBase({ urls: [...(morgyData.knowledgeBase?.urls || []), urlInput] });
      setUrlInput('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Knowledge Base</h2>
        <p className="text-gray-400">Add training data and context for your Morgy</p>
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Upload Documents
        </label>
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors cursor-pointer">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <div className="text-white mb-1">Drop files here or click to upload</div>
          <div className="text-sm text-gray-400">PDF, TXT, DOCX, MD supported</div>
        </div>
      </div>

      {/* URLs */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Add URLs
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addUrl()}
            placeholder="https://example.com/documentation"
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
          />
          <button
            onClick={addUrl}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
          >
            Add
          </button>
        </div>
        {morgyData.knowledgeBase?.urls && morgyData.knowledgeBase.urls.length > 0 && (
          <div className="space-y-2">
            {morgyData.knowledgeBase.urls.map((url, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-700 rounded-lg">
                <span className="flex-1 text-sm text-white truncate">{url}</span>
                <button
                  onClick={() => updateKnowledgeBase({ 
                    urls: morgyData.knowledgeBase?.urls?.filter((_, i) => i !== index) 
                  })}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Data */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Custom Training Data
        </label>
        <textarea
          value={morgyData.knowledgeBase?.customData || ''}
          onChange={(e) => updateKnowledgeBase({ customData: e.target.value })}
          placeholder="Paste any text, FAQs, guidelines, or information you want your Morgy to know..."
          rows={8}
          className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none font-mono text-sm"
        />
      </div>
    </div>
  );
};

const Step7Marketplace: React.FC<{
  morgyData: Partial<EnhancedMorgyData>;
  updateMorgyData: (updates: Partial<EnhancedMorgyData>) => void;
}> = ({ morgyData, updateMorgyData }) => {
  const updateMarketplace = (updates: Partial<EnhancedMorgyData['marketplace']>) => {
    updateMorgyData({
      marketplace: { ...morgyData.marketplace, ...updates } as EnhancedMorgyData['marketplace'],
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Marketplace Settings</h2>
        <p className="text-gray-400">List your Morgy on the marketplace and earn revenue</p>
      </div>

      {/* Public Toggle */}
      <div className="bg-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-white mb-1">List on Marketplace</div>
            <div className="text-sm text-gray-400">Make this Morgy available for others to use</div>
          </div>
          <button
            onClick={() => updateMarketplace({ isPublic: !morgyData.marketplace?.isPublic })}
            className={`
              w-16 h-8 rounded-full transition-all
              ${morgyData.marketplace?.isPublic ? 'bg-purple-600' : 'bg-gray-600'}
            `}
          >
            <div className={`
              w-7 h-7 bg-white rounded-full transition-all mt-0.5
              ${morgyData.marketplace?.isPublic ? 'ml-8' : 'ml-0.5'}
            `} />
          </button>
        </div>
      </div>

      {morgyData.marketplace?.isPublic && (
        <>
          {/* License Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              License Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['free', 'paid', 'subscription'].map((type) => (
                <button
                  key={type}
                  onClick={() => updateMarketplace({ licenseType: type as EnhancedMorgyData['marketplace']['licenseType'] })}
                  className={`
                    p-4 rounded-lg border-2 text-center transition-all
                    ${morgyData.marketplace?.licenseType === type
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                    }
                  `}
                >
                  <div className="font-medium text-white text-sm capitalize">{type}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          {morgyData.marketplace?.licenseType !== 'free' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Price (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={morgyData.marketplace?.price || 0}
                  onChange={(e) => updateMarketplace({ price: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {morgyData.marketplace?.licenseType === 'subscription' 
                  ? 'Per month' 
                  : 'One-time purchase'
                }
              </div>
            </div>
          )}

          {/* Premium Badge */}
          <div className="bg-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-white mb-1 flex items-center gap-2">
                  Premium Badge
                  <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">PRO</span>
                </div>
                <div className="text-sm text-gray-400">Highlight your Morgy in marketplace</div>
              </div>
              <button
                onClick={() => updateMarketplace({ isPremium: !morgyData.marketplace?.isPremium })}
                className={`
                  w-16 h-8 rounded-full transition-all
                  ${morgyData.marketplace?.isPremium ? 'bg-purple-600' : 'bg-gray-600'}
                `}
              >
                <div className={`
                  w-7 h-7 bg-white rounded-full transition-all mt-0.5
                  ${morgyData.marketplace?.isPremium ? 'ml-8' : 'ml-0.5'}
                `} />
              </button>
            </div>
          </div>

          {/* Revenue Estimate */}
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg p-6 border border-purple-500/30">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className="w-6 h-6 text-purple-400" />
              <div className="font-medium text-white">Estimated Revenue</div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              ${((morgyData.marketplace?.price || 0) * 0.7).toFixed(2)}
              <span className="text-sm text-gray-400 font-normal ml-2">per sale (70% revenue share)</span>
            </div>
            <div className="text-sm text-gray-400">
              You keep 70%, we take 30% for platform costs
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const MorgyPreview: React.FC<{ morgyData: Partial<EnhancedMorgyData> }> = ({ morgyData }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
          style={{ backgroundColor: morgyData.appearance?.color || '#8B5CF6' }}
        >
          {morgyData.appearance?.avatar || '🐷'}
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-white">{morgyData.name || 'Unnamed Morgy'}</h3>
          <p className="text-gray-400">{morgyData.description || 'No description'}</p>
          <div className="flex gap-2 mt-2">
            {morgyData.tags?.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Category</div>
          <div className="text-white font-medium capitalize">{morgyData.category || 'Custom'}</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">AI Model</div>
          <div className="text-white font-medium">{morgyData.aiConfig?.primaryModel || 'GPT-4'}</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Tone</div>
          <div className="text-white font-medium capitalize">{morgyData.personality?.tone || 'Professional'}</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Price</div>
          <div className="text-white font-medium">
            {morgyData.marketplace?.isPublic 
              ? morgyData.marketplace?.licenseType === 'free' 
                ? 'Free' 
                : `$${morgyData.marketplace?.price || 0}`
              : 'Private'
            }
          </div>
        </div>
      </div>

      {/* Capabilities */}
      <div>
        <div className="text-sm font-medium text-gray-300 mb-2">Enabled Capabilities</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(morgyData.capabilities || {}).filter(([_, enabled]) => enabled).map(([cap]) => (
            <span key={cap} className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
              ✓ {cap.replace(/([A-Z])/g, ' $1').trim()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
