import React, { useState } from 'react';
import { Sparkles, Brain, Palette, TestTube, Rocket } from 'lucide-react';

interface MorgyCreatorWizardProps {
  onComplete: (morgyData: CustomMorgyData) => void;
  onCancel: () => void;
}

interface CustomMorgyData {
  // Step 1: Basic Info
  category: 'business' | 'social' | 'research' | 'custom';
  name: string;
  description: string;
  
  // Step 2: Personality
  personality: {
    energy: number; // 1-10
    formality: number; // 1-10 (casual → professional)
    humor: number; // 1-10 (serious → playful)
    verbosity: number; // 1-10 (concise → detailed)
    emojiUsage: number; // 1-10 (none → lots)
  };
  systemPrompt: string;
  
  // Step 3: Avatar
  avatar: {
    baseColor: string;
    characterType: string;
    accessories: string[];
    clothing: string;
    vibe: string;
    imageUrl?: string;
  };
  
  // Step 4: Knowledge (handled separately)
  knowledgeIds: string[];
  
  // Step 5: Templates & Workflows (handled separately)
  enabledTemplates: string[];
  enabledWorkflows: string[];
  platformConnections: Record<string, boolean>;
}

export const MorgyCreatorWizard: React.FC<MorgyCreatorWizardProps> = ({
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [morgyData, setMorgyData] = useState<Partial<CustomMorgyData>>({
    category: 'custom',
    personality: {
      energy: 5,
      formality: 5,
      humor: 5,
      verbosity: 5,
      emojiUsage: 5,
    },
    avatar: {
      baseColor: '#8B5CF6',
      characterType: 'business',
      accessories: [],
      clothing: 'suit',
      vibe: 'professional',
    },
    knowledgeIds: [],
    enabledTemplates: [],
    enabledWorkflows: [],
    platformConnections: {},
  });

  const steps = [
    { id: 1, title: 'Basic Info', icon: Sparkles },
    { id: 2, title: 'Personality', icon: Brain },
    { id: 3, title: 'Avatar', icon: Palette },
    { id: 4, title: 'Knowledge', icon: Brain },
    { id: 5, title: 'Templates', icon: TestTube },
  ];

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete(morgyData as CustomMorgyData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Rocket className="w-8 h-8 text-purple-400" />
            Create Your Custom Morgy
          </h1>
          <p className="text-gray-400">
            Build your personal AI employee in 5 easy steps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex-1 relative">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      ${isActive ? 'bg-purple-600 text-white' : ''}
                      ${isCompleted ? 'bg-green-600 text-white' : ''}
                      ${!isActive && !isCompleted ? 'bg-gray-700 text-gray-400' : ''}
                    `}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-400 mt-2">{step.title}</span>
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`
                      absolute top-6 left-1/2 w-full h-0.5
                      ${isCompleted ? 'bg-green-600' : 'bg-gray-700'}
                    `}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8">
          {currentStep === 1 && <Step1BasicInfo morgyData={morgyData} setMorgyData={setMorgyData} />}
          {currentStep === 2 && <Step2Personality morgyData={morgyData} setMorgyData={setMorgyData} />}
          {currentStep === 3 && <Step3Avatar morgyData={morgyData} setMorgyData={setMorgyData} />}
          {currentStep === 4 && <Step4Knowledge morgyData={morgyData} setMorgyData={setMorgyData} />}
          {currentStep === 5 && <Step5Templates morgyData={morgyData} setMorgyData={setMorgyData} />}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={currentStep === 1 ? onCancel : prevStep}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>
          
          <button
            onClick={currentStep === 5 ? handleComplete : nextStep}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
          >
            {currentStep === 5 ? 'Create Morgy' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Step 1: Basic Info
const Step1BasicInfo: React.FC<{
  morgyData: Partial<CustomMorgyData>;
  setMorgyData: (data: Partial<CustomMorgyData>) => void;
}> = ({ morgyData, setMorgyData }) => {
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const categories = [
    { id: 'business', name: 'Business', desc: 'Marketing, sales, strategy (Bill-style)', color: 'green' },
    { id: 'social', name: 'Social Media', desc: 'Content creation, engagement (Sally-style)', color: 'pink' },
    { id: 'research', name: 'Research', desc: 'Analysis, reports, insights (Hogsworth-style)', color: 'blue' },
    { id: 'custom', name: 'Custom', desc: 'Start from scratch, build your own', color: 'purple' },
  ];

  const generateNames = async () => {
    setIsGenerating(true);
    // TODO: Call pig name generator API
    setTimeout(() => {
      setGeneratedNames([
        'Professor Snoutsworth',
        'Captain Hamhock',
        'Baroness Truffles',
      ]);
      setIsGenerating(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Basic Information</h2>
      
      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Choose a Category
        </label>
        <div className="grid grid-cols-2 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setMorgyData({ ...morgyData, category: cat.id as 'business' | 'social' | 'research' | 'custom' })}
              className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${morgyData.category === cat.id
                  ? `border-${cat.color}-500 bg-${cat.color}-500/20`
                  : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                }
              `}
            >
              <div className="font-semibold text-white">{cat.name}</div>
              <div className="text-sm text-gray-400">{cat.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Name Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Choose a Name
        </label>
        
        <button
          onClick={generateNames}
          disabled={isGenerating}
          className="mb-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : '✨ Generate Clever Pig Names'}
        </button>

        {generatedNames.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {generatedNames.map((name) => (
              <button
                key={name}
                onClick={() => setMorgyData({ ...morgyData, name })}
                className={`
                  p-3 rounded-lg border-2 text-center
                  ${morgyData.name === name
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                  }
                `}
              >
                <span className="text-white font-medium">{name}</span>
              </button>
            ))}
          </div>
        )}

        <input
          type="text"
          value={morgyData.name || ''}
          onChange={(e) => setMorgyData({ ...morgyData, name: e.target.value })}
          placeholder="Or enter a custom name..."
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description (What does this Morgy do?)
        </label>
        <textarea
          value={morgyData.description || ''}
          onChange={(e) => setMorgyData({ ...morgyData, description: e.target.value })}
          placeholder="e.g., Expert marketing strategist who helps with social media campaigns and content creation"
          rows={3}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
        />
      </div>
    </div>
  );
};

// Step 2: Personality
const Step2Personality: React.FC<{
  morgyData: Partial<CustomMorgyData>;
  setMorgyData: (data: Partial<CustomMorgyData>) => void;
}> = ({ morgyData, setMorgyData }) => {
  const updatePersonality = (key: string, value: number) => {
    setMorgyData({
      ...morgyData,
      personality: {
        ...morgyData.personality!,
        [key]: value,
      },
    });
  };

  const traits = [
    { key: 'energy', label: 'Energy Level', low: 'Calm', high: 'Energetic' },
    { key: 'formality', label: 'Formality', low: 'Casual', high: 'Professional' },
    { key: 'humor', label: 'Humor', low: 'Serious', high: 'Playful' },
    { key: 'verbosity', label: 'Verbosity', low: 'Concise', high: 'Detailed' },
    { key: 'emojiUsage', label: 'Emoji Usage', low: 'None', high: 'Lots' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Personality Traits</h2>
      
      {traits.map((trait) => (
        <div key={trait.key}>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {trait.label}
          </label>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 w-20">{trait.low}</span>
            <input
              type="range"
              min="1"
              max="10"
              value={morgyData.personality?.[trait.key as keyof typeof morgyData.personality] || 5}
              onChange={(e) => updatePersonality(trait.key, parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-gray-400 w-20 text-right">{trait.high}</span>
            <span className="text-white font-bold w-8 text-center">
              {morgyData.personality?.[trait.key as keyof typeof morgyData.personality] || 5}
            </span>
          </div>
        </div>
      ))}

      {/* System Prompt */}
      <div className="mt-8">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          System Prompt (Advanced)
        </label>
        <textarea
          value={morgyData.systemPrompt || ''}
          onChange={(e) => setMorgyData({ ...morgyData, systemPrompt: e.target.value })}
          placeholder="You are a helpful AI assistant..."
          rows={6}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none font-mono text-sm"
        />
        <p className="text-xs text-gray-400 mt-2">
          Leave blank to auto-generate based on personality traits
        </p>
      </div>

      {/* Preview */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Preview Response</h3>
        <div className="text-white text-sm">
          {/* TODO: Generate preview based on personality */}
          <p>Hi there! I'm {morgyData.name || 'your Morgy'}. How can I help you today?</p>
        </div>
      </div>
    </div>
  );
};

// Step 3: Avatar
const Step3Avatar: React.FC<{
  morgyData: Partial<CustomMorgyData>;
  setMorgyData: (data: Partial<CustomMorgyData>) => void;
}> = ({ morgyData, setMorgyData }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const colors = [
    '#8B5CF6', '#EC4899', '#10B981', '#3B82F6', '#F59E0B',
    '#EF4444', '#14B8A6', '#8B5CF6', '#F97316', '#6366F1',
  ];

  const characterTypes = ['business', 'creative', 'tech', 'academic', 'casual'];
  const accessories = ['glasses', 'hat', 'headphones', 'bowtie', 'monocle'];
  const clothing = ['suit', 'hoodie', 'lab coat', 't-shirt', 'robot body'];
  const vibes = ['professional', 'energetic', 'chill', 'quirky', 'serious'];

  const generateAvatar = async () => {
    setIsGenerating(true);
    // TODO: Call DALL-E 3 API
    setTimeout(() => {
      setMorgyData({
        ...morgyData,
        avatar: {
          ...morgyData.avatar!,
          imageUrl: 'https://via.placeholder.com/400x400?text=Generated+Avatar',
        },
      });
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Customize Avatar</h2>
      
      <div className="grid grid-cols-2 gap-8">
        {/* Left: Customization */}
        <div className="space-y-4">
          {/* Base Color */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Base Color
            </label>
            <div className="grid grid-cols-5 gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setMorgyData({
                    ...morgyData,
                    avatar: { ...morgyData.avatar!, baseColor: color },
                  })}
                  className={`
                    w-12 h-12 rounded-lg border-2
                    ${morgyData.avatar?.baseColor === color ? 'border-white' : 'border-gray-600'}
                  `}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Character Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Character Type
            </label>
            <select
              value={morgyData.avatar?.characterType || 'business'}
              onChange={(e) => setMorgyData({
                ...morgyData,
                avatar: { ...morgyData.avatar!, characterType: e.target.value },
              })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
            >
              {characterTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Accessories */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Accessories
            </label>
            <div className="flex flex-wrap gap-2">
              {accessories.map((acc) => (
                <button
                  key={acc}
                  onClick={() => {
                    const current = morgyData.avatar?.accessories || [];
                    const updated = current.includes(acc)
                      ? current.filter((a) => a !== acc)
                      : [...current, acc];
                    setMorgyData({
                      ...morgyData,
                      avatar: { ...morgyData.avatar!, accessories: updated },
                    });
                  }}
                  className={`
                    px-3 py-1 rounded-lg text-sm
                    ${morgyData.avatar?.accessories?.includes(acc)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                    }
                  `}
                >
                  {acc}
                </button>
              ))}
            </div>
          </div>

          {/* Clothing */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Clothing
            </label>
            <select
              value={morgyData.avatar?.clothing || 'suit'}
              onChange={(e) => setMorgyData({
                ...morgyData,
                avatar: { ...morgyData.avatar!, clothing: e.target.value },
              })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
            >
              {clothing.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          {/* Vibe */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Vibe
            </label>
            <select
              value={morgyData.avatar?.vibe || 'professional'}
              onChange={(e) => setMorgyData({
                ...morgyData,
                avatar: { ...morgyData.avatar!, vibe: e.target.value },
              })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
            >
              {vibes.map((vibe) => (
                <option key={vibe} value={vibe}>{vibe}</option>
              ))}
            </select>
          </div>

          <button
            onClick={generateAvatar}
            disabled={isGenerating}
            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : '✨ Generate Avatar'}
          </button>
        </div>

        {/* Right: Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Preview
          </label>
          <div className="bg-gray-700 rounded-lg p-8 flex items-center justify-center aspect-square">
            {morgyData.avatar?.imageUrl ? (
              <img
                src={morgyData.avatar.imageUrl}
                alt="Avatar"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-center text-gray-400">
                <Palette className="w-16 h-16 mx-auto mb-4" />
                <p>Customize and generate your avatar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 4: Knowledge (Placeholder - will be detailed component)
const Step4Knowledge: React.FC<{
  morgyData: Partial<CustomMorgyData>;
  setMorgyData: (data: Partial<CustomMorgyData>) => void;
}> = ({ morgyData: _morgyData, setMorgyData: _setMorgyData }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Stuff with Knowledge</h2>
      <p className="text-gray-400">
        Knowledge stuffing interface coming next! This will allow you to:
      </p>
      <ul className="list-disc list-inside text-gray-400 space-y-2">
        <li>Upload documents (PDF, Word, text)</li>
        <li>Add website URLs (auto-scrape)</li>
        <li>Paste text content</li>
        <li>Connect data sources (Google Drive, Notion)</li>
        <li>Test knowledge retrieval</li>
      </ul>
    </div>
  );
};

// Step 5: Templates (Placeholder - will be detailed component)
const Step5Templates: React.FC<{
  morgyData: Partial<CustomMorgyData>;
  setMorgyData: (data: Partial<CustomMorgyData>) => void;
}> = ({ morgyData: _morgyData, setMorgyData: _setMorgyData }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Enable Templates & Workflows</h2>
      <p className="text-gray-400">
        Template selection interface coming next! This will allow you to:
      </p>
      <ul className="list-disc list-inside text-gray-400 space-y-2">
        <li>Enable/disable action templates</li>
        <li>Choose workflows</li>
        <li>Connect platforms (Reddit, Gmail, etc.)</li>
        <li>Set permissions and constraints</li>
      </ul>
    </div>
  );
};
