import React, { useState } from 'react';

interface AvatarConfig {
  baseColor: string;
  accentColor: string;
  characterType: 'business' | 'creative' | 'technical' | 'academic' | 'casual';
  glasses?: 'sunglasses' | 'round' | 'monocle' | 'none';
  headwear?: 'none' | 'hat' | 'cap' | 'headphones';
  clothing?: 'suit' | 'hoodie' | 'tshirt' | 'jacket' | 'robot-body';
  personality: 'energetic' | 'professional' | 'friendly' | 'serious' | 'playful';
}

interface AvatarCustomizerProps {
  category?: string;
  onGenerate: (config: AvatarConfig) => void;
  generating?: boolean;
}

export const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({
  category,
  onGenerate,
  generating = false
}) => {
  const [usePreset, setUsePreset] = useState(true);
  const [config, setConfig] = useState<AvatarConfig>({
    baseColor: 'neon green',
    accentColor: 'hot pink',
    characterType: 'business',
    glasses: 'sunglasses',
    headwear: 'none',
    clothing: 'robot-body',
    personality: 'energetic'
  });

  // Preset configurations based on category
  const presets: Record<string, AvatarConfig> = {
    business: {
      baseColor: 'navy blue',
      accentColor: 'gold',
      characterType: 'business',
      glasses: 'round',
      headwear: 'none',
      clothing: 'suit',
      personality: 'professional'
    },
    marketing: {
      baseColor: 'hot pink',
      accentColor: 'purple',
      characterType: 'creative',
      glasses: 'sunglasses',
      headwear: 'none',
      clothing: 'hoodie',
      personality: 'energetic'
    },
    development: {
      baseColor: 'neon green',
      accentColor: 'cyan',
      characterType: 'technical',
      glasses: 'round',
      headwear: 'headphones',
      clothing: 'robot-body',
      personality: 'serious'
    },
    design: {
      baseColor: 'vibrant purple',
      accentColor: 'pink',
      characterType: 'creative',
      glasses: 'round',
      headwear: 'none',
      clothing: 'tshirt',
      personality: 'playful'
    },
    research: {
      baseColor: 'cyan',
      accentColor: 'blue',
      characterType: 'academic',
      glasses: 'monocle',
      headwear: 'none',
      clothing: 'suit',
      personality: 'serious'
    },
    writing: {
      baseColor: 'warm orange',
      accentColor: 'yellow',
      characterType: 'creative',
      glasses: 'round',
      headwear: 'none',
      clothing: 'jacket',
      personality: 'friendly'
    },
    education: {
      baseColor: 'royal blue',
      accentColor: 'gold',
      characterType: 'academic',
      glasses: 'round',
      headwear: 'none',
      clothing: 'suit',
      personality: 'friendly'
    }
  };

  // Color options
  const colorOptions = [
    { name: 'Neon Green', value: 'neon green', hex: '#39FF14' },
    { name: 'Hot Pink', value: 'hot pink', hex: '#FF69B4' },
    { name: 'Cyan', value: 'cyan', hex: '#00FFFF' },
    { name: 'Purple', value: 'vibrant purple', hex: '#9D00FF' },
    { name: 'Electric Blue', value: 'electric blue', hex: '#7DF9FF' },
    { name: 'Orange', value: 'neon orange', hex: '#FFA500' },
    { name: 'Magenta', value: 'magenta', hex: '#FF00FF' },
    { name: 'Lime', value: 'lime green', hex: '#32CD32' },
    { name: 'Gold', value: 'gold', hex: '#FFD700' },
    { name: 'Red', value: 'crimson red', hex: '#DC143C' }
  ];

  const handlePresetSelect = (presetCategory: string) => {
    const presetConfig = presets[presetCategory];
    if (presetConfig) {
      setConfig(presetConfig);
    }
  };

  const handleGenerate = () => {
    const finalConfig = usePreset && category ? (presets[category] || config) : config;
    onGenerate(finalConfig);
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
        <button
          onClick={() => setUsePreset(true)}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            usePreset
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          🎨 Use Preset
        </button>
        <button
          onClick={() => setUsePreset(false)}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            !usePreset
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          ⚙️ Customize
        </button>
      </div>

      {/* Preset Mode */}
      {usePreset && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose a preset based on your Morgy's role:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.keys(presets).map((presetKey) => {
                const preset = presets[presetKey];
                const isSelected = category === presetKey;
                return (
                  <button
                    key={presetKey}
                    onClick={() => handlePresetSelect(presetKey)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">
                      {presetKey === 'business' && '💼'}
                      {presetKey === 'marketing' && '📢'}
                      {presetKey === 'development' && '💻'}
                      {presetKey === 'design' && '🎨'}
                      {presetKey === 'research' && '🔬'}
                      {presetKey === 'writing' && '✍️'}
                      {presetKey === 'education' && '🎓'}
                    </div>
                    <div className="text-sm font-medium capitalize">{presetKey}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {preset.baseColor}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {category && presets[category] && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Preview:</strong> Your Morgy will be a {presets[category].baseColor} cyberpunk pig 
                with {presets[category].accentColor} accents, wearing {presets[category].clothing} 
                and {presets[category].glasses !== 'none' ? `${presets[category].glasses}` : 'no glasses'}.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom Mode */}
      {!usePreset && (
        <div className="space-y-6">
          {/* Colors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Base Color
            </label>
            <div className="grid grid-cols-5 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setConfig({ ...config, baseColor: color.value })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    config.baseColor === color.value
                      ? 'border-purple-600 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  <div className="w-full h-8"></div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Accent Color
            </label>
            <div className="grid grid-cols-5 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setConfig({ ...config, accentColor: color.value })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    config.accentColor === color.value
                      ? 'border-purple-600 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  <div className="w-full h-8"></div>
                </button>
              ))}
            </div>
          </div>

          {/* Character Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Character Type
            </label>
            <select
              value={config.characterType}
              onChange={(e) => setConfig({ ...config, characterType: e.target.value as unknown })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600"
            >
              <option value="business">💼 Business</option>
              <option value="creative">🎨 Creative</option>
              <option value="technical">💻 Technical</option>
              <option value="academic">🎓 Academic</option>
              <option value="casual">😊 Casual</option>
            </select>
          </div>

          {/* Accessories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Glasses
              </label>
              <select
                value={config.glasses}
                onChange={(e) => setConfig({ ...config, glasses: e.target.value as unknown })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600"
              >
                <option value="none">None</option>
                <option value="sunglasses">😎 Sunglasses</option>
                <option value="round">👓 Round</option>
                <option value="monocle">🧐 Monocle</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Headwear
              </label>
              <select
                value={config.headwear}
                onChange={(e) => setConfig({ ...config, headwear: e.target.value as unknown })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600"
              >
                <option value="none">None</option>
                <option value="hat">🎩 Hat</option>
                <option value="cap">🧢 Cap</option>
                <option value="headphones">🎧 Headphones</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clothing
              </label>
              <select
                value={config.clothing}
                onChange={(e) => setConfig({ ...config, clothing: e.target.value as unknown })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600"
              >
                <option value="suit">👔 Suit</option>
                <option value="hoodie">🧥 Hoodie</option>
                <option value="tshirt">👕 T-Shirt</option>
                <option value="jacket">🧥 Jacket</option>
                <option value="robot-body">🤖 Robot Body</option>
              </select>
            </div>
          </div>

          {/* Personality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Personality
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { value: 'energetic', emoji: '⚡', label: 'Energetic' },
                { value: 'professional', emoji: '💼', label: 'Professional' },
                { value: 'friendly', emoji: '😊', label: 'Friendly' },
                { value: 'serious', emoji: '🧐', label: 'Serious' },
                { value: 'playful', emoji: '🎉', label: 'Playful' }
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => setConfig({ ...config, personality: p.value as unknown })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    config.personality === p.value
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{p.emoji}</div>
                  <div className="text-xs font-medium">{p.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-semibold text-lg"
      >
        {generating ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Generating Avatar...
          </span>
        ) : (
          '✨ Generate Avatar'
        )}
      </button>

      {/* Info */}
      <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p className="font-medium mb-2">🎨 About Avatar Generation:</p>
        <ul className="space-y-1 text-xs">
          <li>• Avatars are generated in the style of Bill, Sally, and Professor Hogsworth</li>
          <li>• Each avatar is unique and matches your Morgy's personality</li>
          <li>• Generation takes 10-15 seconds</li>
          <li>• You can regenerate if you don't like the result</li>
        </ul>
      </div>
    </div>
  );
};
