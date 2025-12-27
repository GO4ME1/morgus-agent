import React, { useState } from 'react';
import { Mail, MessageSquare, Video, Search, Zap, CheckCircle, Settings } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  platforms: string[];
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: number;
  category: string;
  platforms: string[];
}

interface Platform {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  required: boolean;
}

interface MorgyTemplateSelectorProps {
  morgyId: string;
  existingTemplates?: string[];
  existingWorkflows?: string[];
  existingPlatforms?: Record<string, boolean>;
  onUpdate: (data: {
    templates: string[];
    workflows: string[];
    platforms: Record<string, boolean>;
  }) => void;
}

export const MorgyTemplateSelector: React.FC<MorgyTemplateSelectorProps> = ({
  morgyId,
  existingTemplates = [],
  existingWorkflows = [],
  existingPlatforms = {},
  onUpdate,
}) => {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(existingTemplates);
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>(existingWorkflows);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<string, boolean>>(existingPlatforms);
  const [activeTab, setActiveTab] = useState<'templates' | 'workflows' | 'platforms'>('templates');

  // Available Templates
  const templates: Template[] = [
    {
      id: 'post_to_reddit',
      name: 'Post to Reddit',
      description: 'Create and post content to Reddit communities',
      icon: MessageSquare,
      category: 'social',
      platforms: ['reddit'],
    },
    {
      id: 'send_email',
      name: 'Send Email',
      description: 'Compose and send emails via Gmail',
      icon: Mail,
      category: 'communication',
      platforms: ['gmail'],
    },
    {
      id: 'create_tiktok_talking_head',
      name: 'TikTok Talking Head',
      description: 'Create AI-generated talking head videos',
      icon: Video,
      category: 'content',
      platforms: ['did'],
    },
    {
      id: 'create_tiktok_visual',
      name: 'TikTok Visual',
      description: 'Create AI-generated visual videos',
      icon: Video,
      category: 'content',
      platforms: ['luma'],
    },
    {
      id: 'search_youtube',
      name: 'Search YouTube',
      description: 'Search and analyze YouTube content',
      icon: Search,
      category: 'research',
      platforms: ['youtube'],
    },
  ];

  // Available Workflows
  const workflows: Workflow[] = [
    {
      id: 'bill_market_research',
      name: 'Market Research Campaign',
      description: 'Bill-style: Research market, analyze competitors, create strategy',
      steps: 5,
      category: 'business',
      platforms: ['youtube', 'reddit'],
    },
    {
      id: 'bill_product_launch',
      name: 'Product Launch Campaign',
      description: 'Bill-style: Plan launch, create content, execute promotion',
      steps: 6,
      category: 'business',
      platforms: ['reddit', 'gmail'],
    },
    {
      id: 'bill_competitor_analysis',
      name: 'Competitor Analysis',
      description: 'Bill-style: Research competitors, analyze strategies, report findings',
      steps: 4,
      category: 'business',
      platforms: ['youtube', 'reddit'],
    },
    {
      id: 'sally_tiktok_campaign',
      name: 'TikTok Content Campaign',
      description: 'Sally-style: Plan content, create videos, schedule posts',
      steps: 7,
      category: 'social',
      platforms: ['did', 'luma'],
    },
    {
      id: 'sally_engagement_boost',
      name: 'Engagement Boost Campaign',
      description: 'Sally-style: Analyze engagement, create content, interact with community',
      steps: 5,
      category: 'social',
      platforms: ['reddit'],
    },
    {
      id: 'sally_content_calendar',
      name: 'Content Calendar Creation',
      description: 'Sally-style: Plan content, create assets, schedule distribution',
      steps: 6,
      category: 'social',
      platforms: ['did', 'luma', 'reddit'],
    },
    {
      id: 'hogsworth_literature_review',
      name: 'Literature Review',
      description: 'Hogsworth-style: Search sources, analyze papers, synthesize findings',
      steps: 5,
      category: 'research',
      platforms: ['youtube'],
    },
    {
      id: 'hogsworth_trend_analysis',
      name: 'Trend Analysis Report',
      description: 'Hogsworth-style: Identify trends, collect data, generate report',
      steps: 6,
      category: 'research',
      platforms: ['youtube', 'reddit'],
    },
    {
      id: 'hogsworth_competitive_intelligence',
      name: 'Competitive Intelligence',
      description: 'Hogsworth-style: Monitor competitors, analyze strategies, provide insights',
      steps: 7,
      category: 'research',
      platforms: ['youtube', 'reddit'],
    },
  ];

  // Available Platforms
  const platforms: Platform[] = [
    { id: 'reddit', name: 'Reddit', icon: '🤖', connected: connectedPlatforms.reddit || false, required: false },
    { id: 'gmail', name: 'Gmail', icon: '📧', connected: connectedPlatforms.gmail || false, required: false },
    { id: 'youtube', name: 'YouTube', icon: '📺', connected: connectedPlatforms.youtube || false, required: false },
    { id: 'did', name: 'D-ID', icon: '🎭', connected: connectedPlatforms.did || false, required: false },
    { id: 'luma', name: 'Luma AI', icon: '🎬', connected: connectedPlatforms.luma || false, required: false },
  ];

  // Toggle Template
  const toggleTemplate = (templateId: string) => {
    const updated = selectedTemplates.includes(templateId)
      ? selectedTemplates.filter((id) => id !== templateId)
      : [...selectedTemplates, templateId];
    
    setSelectedTemplates(updated);
    onUpdate({
      templates: updated,
      workflows: selectedWorkflows,
      platforms: connectedPlatforms,
    });
  };

  // Toggle Workflow
  const toggleWorkflow = (workflowId: string) => {
    const updated = selectedWorkflows.includes(workflowId)
      ? selectedWorkflows.filter((id) => id !== workflowId)
      : [...selectedWorkflows, workflowId];
    
    setSelectedWorkflows(updated);
    onUpdate({
      templates: selectedTemplates,
      workflows: updated,
      platforms: connectedPlatforms,
    });
  };

  // Connect Platform
  const connectPlatform = async (platformId: string) => {
    // TODO: Implement OAuth flow
    const updated = { ...connectedPlatforms, [platformId]: true };
    setConnectedPlatforms(updated);
    onUpdate({
      templates: selectedTemplates,
      workflows: selectedWorkflows,
      platforms: updated,
    });
  };

  // Get required platforms
  const getRequiredPlatforms = () => {
    const required = new Set<string>();
    
    selectedTemplates.forEach((templateId) => {
      const template = templates.find((t) => t.id === templateId);
      template?.platforms.forEach((p) => required.add(p));
    });
    
    selectedWorkflows.forEach((workflowId) => {
      const workflow = workflows.find((w) => w.id === workflowId);
      workflow?.platforms.forEach((p) => required.add(p));
    });
    
    return Array.from(required);
  };

  const requiredPlatforms = getRequiredPlatforms();

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        {[
          { id: 'templates', label: 'Action Templates', count: selectedTemplates.length },
          { id: 'workflows', label: 'Workflows', count: selectedWorkflows.length },
          { id: 'platforms', label: 'Platforms', count: Object.values(connectedPlatforms).filter(Boolean).length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center gap-2 px-4 py-2 border-b-2 transition-colors
              ${activeTab === tab.id
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
              }
            `}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Action Templates</h3>
            <div className="text-sm text-gray-400">
              {selectedTemplates.length} of {templates.length} enabled
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {templates.map((template) => {
              const Icon = template.icon;
              const isSelected = selectedTemplates.includes(template.id);
              
              return (
                <div
                  key={template.id}
                  className={`
                    bg-gray-800 rounded-lg p-4 border-2 transition-all cursor-pointer
                    ${isSelected ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 hover:border-gray-600'}
                  `}
                  onClick={() => toggleTemplate(template.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-purple-600' : 'bg-gray-700'}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-medium">{template.name}</h4>
                          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded">
                            {template.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{template.description}</p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">Requires:</span>
                          {template.platforms.map((platform) => (
                            <span key={platform} className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded">
                              {platform}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle className="w-6 h-6 text-purple-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Multi-Step Workflows</h3>
            <div className="text-sm text-gray-400">
              {selectedWorkflows.length} of {workflows.length} enabled
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {workflows.map((workflow) => {
              const isSelected = selectedWorkflows.includes(workflow.id);
              
              return (
                <div
                  key={workflow.id}
                  className={`
                    bg-gray-800 rounded-lg p-4 border-2 transition-all cursor-pointer
                    ${isSelected ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 hover:border-gray-600'}
                  `}
                  onClick={() => toggleWorkflow(workflow.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-purple-600' : 'bg-gray-700'}`}>
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-medium">{workflow.name}</h4>
                          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded">
                            {workflow.category}
                          </span>
                          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded">
                            {workflow.steps} steps
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{workflow.description}</p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">Requires:</span>
                          {workflow.platforms.map((platform) => (
                            <span key={platform} className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded">
                              {platform}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle className="w-6 h-6 text-purple-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Platforms Tab */}
      {activeTab === 'platforms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Platform Connections</h3>
            <div className="text-sm text-gray-400">
              {Object.values(connectedPlatforms).filter(Boolean).length} of {platforms.length} connected
            </div>
          </div>

          {requiredPlatforms.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="text-yellow-500 text-xl">⚠️</span>
                <div>
                  <div className="text-yellow-500 font-medium">Required Platforms</div>
                  <div className="text-sm text-gray-400 mt-1">
                    Based on your selected templates and workflows, you need to connect:{' '}
                    {requiredPlatforms.map((p, i) => (
                      <span key={p}>
                        <span className="text-white font-medium">{p}</span>
                        {i < requiredPlatforms.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {platforms.map((platform) => {
              const isRequired = requiredPlatforms.includes(platform.id);
              
              return (
                <div
                  key={platform.id}
                  className={`
                    bg-gray-800 rounded-lg p-4 border-2
                    ${platform.connected ? 'border-green-500 bg-green-500/10' : 'border-gray-700'}
                    ${isRequired && !platform.connected ? 'border-yellow-500/50' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{platform.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-medium">{platform.name}</h4>
                          {isRequired && (
                            <span className="text-xs text-yellow-500 bg-yellow-500/20 px-2 py-0.5 rounded">
                              Required
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          {platform.connected ? (
                            <span className="text-green-400 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Connected
                            </span>
                          ) : (
                            <span className="text-gray-400">Not connected</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!platform.connected && (
                      <button
                        onClick={() => connectPlatform(platform.id)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">About Platform Connections</h4>
            <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
              <li>OAuth authentication keeps your credentials secure</li>
              <li>Tokens are automatically refreshed</li>
              <li>You can disconnect at any time</li>
              <li>All platforms use FREE tiers (no credit card required)</li>
            </ul>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Configuration Summary</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-400">Templates</div>
            <div className="text-2xl font-bold text-white">{selectedTemplates.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Workflows</div>
            <div className="text-2xl font-bold text-white">{selectedWorkflows.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Platforms</div>
            <div className="text-2xl font-bold text-white">
              {Object.values(connectedPlatforms).filter(Boolean).length}
            </div>
          </div>
        </div>

        {requiredPlatforms.some((p) => !connectedPlatforms[p]) && (
          <div className="mt-4 text-sm text-yellow-400">
            ⚠️ Connect required platforms to use selected templates and workflows
          </div>
        )}
      </div>
    </div>
  );
};
