import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useParams } from 'react-router-dom';

interface MorgyFormData {
  name: string;
  description: string;
  systemPrompt: string;
  personalityTraits: string[];
  expertiseAreas: string[];
  category: string;
  tags: string[];
  isPublic: boolean;
  skillsConfig: {
    execution_mode: 'fast' | 'quality' | 'agent' | 'dppm' | 'auto';
    allow_tools: boolean;
    max_cost_per_message: number;
  };
}

export const MorgyCreator: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<MorgyFormData>({
    name: '',
    description: '',
    systemPrompt: '',
    personalityTraits: [],
    expertiseAreas: [],
    category: 'business',
    tags: [],
    isPublic: false,
    skillsConfig: {
      execution_mode: 'auto',
      allow_tools: true,
      max_cost_per_message: 0.01
    }
  });

  const [newTrait, setNewTrait] = useState('');
  const [newExpertise, setNewExpertise] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (isEditing) {
      loadMorgy();
    }
  }, [id]);

  const loadMorgy = async () => {
    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const response = await fetch(`/api/morgys/${id}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load Morgy');
      
      const morgy = await response.json();
      setFormData({
        name: morgy.name,
        description: morgy.description || '',
        systemPrompt: morgy.system_prompt,
        personalityTraits: morgy.personality_traits || [],
        expertiseAreas: morgy.expertise_areas || [],
        category: morgy.category || 'business',
        tags: morgy.tags || [],
        isPublic: morgy.is_public || false,
        skillsConfig: morgy.skills_config || {
          execution_mode: 'auto',
          allow_tools: true,
          max_cost_per_message: 0.01
        }
      });
    } catch (error) {
      console.error('Failed to load Morgy:', error);
      alert('Failed to load Morgy');
      navigate('/morgys');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const url = isEditing ? `/api/morgys/${id}` : '/api/morgys';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} Morgy`);
      
      const morgy = await response.json();
      navigate(`/morgys/${morgy.id}`);
    } catch (error) {
      console.error('Failed to save Morgy:', error);
      alert(`Failed to ${isEditing ? 'update' : 'create'} Morgy`);
    } finally {
      setSaving(false);
    }
  };

  const addTrait = () => {
    if (newTrait.trim() && !formData.personalityTraits.includes(newTrait.trim())) {
      setFormData({
        ...formData,
        personalityTraits: [...formData.personalityTraits, newTrait.trim()]
      });
      setNewTrait('');
    }
  };

  const removeTrait = (trait: string) => {
    setFormData({
      ...formData,
      personalityTraits: formData.personalityTraits.filter(t => t !== trait)
    });
  };

  const addExpertise = () => {
    if (newExpertise.trim() && !formData.expertiseAreas.includes(newExpertise.trim())) {
      setFormData({
        ...formData,
        expertiseAreas: [...formData.expertiseAreas, newExpertise.trim()]
      });
      setNewExpertise('');
    }
  };

  const removeExpertise = (expertise: string) => {
    setFormData({
      ...formData,
      expertiseAreas: formData.expertiseAreas.filter(e => e !== expertise)
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading Morgy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <h2 className="text-2xl font-bold">
            {isEditing ? '✏️ Edit Morgy' : '✨ Create New Morgy'}
          </h2>
          <p className="text-purple-100 mt-2">
            {isEditing ? 'Update your Morgy\'s configuration' : 'Design your custom AI employee'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Marketing Maven, Code Wizard"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of what this Morgy does..."
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="business">💼 Business</option>
                <option value="marketing">📢 Marketing</option>
                <option value="development">💻 Development</option>
                <option value="design">🎨 Design</option>
                <option value="writing">✍️ Writing</option>
                <option value="research">🔬 Research</option>
                <option value="education">🎓 Education</option>
                <option value="other">🔧 Other</option>
              </select>
            </div>
          </div>

          {/* System Prompt */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Personality & Behavior</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Prompt *
              </label>
              <textarea
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                placeholder="You are a helpful assistant that..."
                rows={8}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 This defines how your Morgy behaves and responds. Be specific about personality, tone, and expertise.
              </p>
            </div>
          </div>

          {/* Personality Traits */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Personality Traits</h3>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newTrait}
                onChange={(e) => setNewTrait(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTrait())}
                placeholder="e.g., enthusiastic, analytical, creative"
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addTrait}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.personalityTraits.map((trait) => (
                <span
                  key={trait}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                >
                  {trait}
                  <button
                    type="button"
                    onClick={() => removeTrait(trait)}
                    className="text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Expertise Areas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Expertise Areas</h3>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newExpertise}
                onChange={(e) => setNewExpertise(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                placeholder="e.g., SEO, Python, Content Strategy"
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addExpertise}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.expertiseAreas.map((expertise) => (
                <span
                  key={expertise}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {expertise}
                  <button
                    type="button"
                    onClick={() => removeExpertise(expertise)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="e.g., marketing, social-media, automation"
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Advanced Settings</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Execution Mode
              </label>
              <select
                value={formData.skillsConfig.execution_mode}
                onChange={(e) => setFormData({
                  ...formData,
                  skillsConfig: {
                    ...formData.skillsConfig,
                    execution_mode: e.target.value as any
                  }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="auto">🤖 Auto (Smart routing)</option>
                <option value="fast">⚡ Fast (Free, 1-2s)</option>
                <option value="quality">✨ Quality (MOE, best answers)</option>
                <option value="agent">🔧 Agent (Tools + reasoning)</option>
                <option value="dppm">🧠 DPPM (Complex tasks)</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allow_tools"
                checked={formData.skillsConfig.allow_tools}
                onChange={(e) => setFormData({
                  ...formData,
                  skillsConfig: {
                    ...formData.skillsConfig,
                    allow_tools: e.target.checked
                  }
                })}
                className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-600"
              />
              <label htmlFor="allow_tools" className="text-sm font-medium text-gray-700">
                Allow tool use (search, code execution, etc.)
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_public"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-600"
              />
              <label htmlFor="is_public" className="text-sm font-medium text-gray-700">
                Make this Morgy public (others can discover and use it)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/morgys')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : (isEditing ? 'Update Morgy' : 'Create Morgy')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
