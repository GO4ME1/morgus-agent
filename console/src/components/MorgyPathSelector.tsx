import React, { useState } from 'react';
import { CheckCircle, DollarSign, Download, Sparkles, ArrowRight, Info } from 'lucide-react';

interface MorgyPathSelectorProps {
  morgyId: string;
  morgyName: string;
  morgyAvatar?: string;
  onPathSelected: (paths: {
    use: boolean;
    sell: boolean;
    export: boolean;
    sellConfig?: SellConfig;
    exportConfig?: ExportConfig;
  }) => void;
}

interface SellConfig {
  pricingModel: 'free' | 'one-time' | 'monthly' | 'annual';
  price?: number;
  visibility: 'public' | 'unlisted' | 'private';
  license: {
    personalUse: boolean;
    commercialUse: boolean;
    resale: boolean;
    modification: boolean;
  };
}

interface ExportConfig {
  includeKnowledge: boolean;
  includeTemplates: boolean;
  shareWithTeam: boolean;
}

export const MorgyPathSelector: React.FC<MorgyPathSelectorProps> = ({
  morgyId: _morgyId,
  morgyName,
  morgyAvatar: _morgyAvatar,
  onPathSelected,
}) => {
  const [selectedPaths, setSelectedPaths] = useState({
    use: true, // Default to personal use
    sell: false,
    export: false,
  });

  const [sellConfig, setSellConfig] = useState<SellConfig>({
    pricingModel: 'one-time',
    price: 20,
    visibility: 'public',
    license: {
      personalUse: true,
      commercialUse: true,
      resale: false,
      modification: true,
    },
  });

  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    includeKnowledge: true,
    includeTemplates: true,
    shareWithTeam: false,
  });

  const togglePath = (path: 'use' | 'sell' | 'export') => {
    setSelectedPaths((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleComplete = () => {
    onPathSelected({
      ...selectedPaths,
      sellConfig: selectedPaths.sell ? sellConfig : undefined,
      exportConfig: selectedPaths.export ? exportConfig : undefined,
    });
  };

  // Calculate revenue estimate
  const calculateRevenue = () => {
    if (!sellConfig.price) return 0;
    
    const baseRevenue = sellConfig.pricingModel === 'monthly' 
      ? sellConfig.price * 20 // Assume 20 subscribers
      : sellConfig.pricingModel === 'annual'
      ? (sellConfig.price * 20) / 12 // Monthly equivalent
      : sellConfig.price * 5; // One-time, assume 5 sales/month
    
    return baseRevenue * 0.7; // 70% revenue share
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-400" />
            Choose Your Path
          </h1>
          <p className="text-gray-400">
            How do you want to use {morgyName}?
          </p>
        </div>

        {/* Path Options */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Path A: Use in Morgus */}
          <div
            onClick={() => togglePath('use')}
            className={`
              bg-gray-800 rounded-lg p-6 border-2 cursor-pointer transition-all
              ${selectedPaths.use ? 'border-green-500 bg-green-500/10' : 'border-gray-700 hover:border-gray-600'}
            `}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-green-600 rounded-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              {selectedPaths.use && (
                <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  Selected
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Use in Morgus</h3>
            <p className="text-sm text-gray-400 mb-4">
              Your personal AI employee. Available 24/7 for tasks and automation.
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Chat anytime
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Execute templates
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Run workflows
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Autonomous tasks
              </div>
            </div>
          </div>

          {/* Path B: Sell on Marketplace */}
          <div
            onClick={() => togglePath('sell')}
            className={`
              bg-gray-800 rounded-lg p-6 border-2 cursor-pointer transition-all
              ${selectedPaths.sell ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 hover:border-gray-600'}
            `}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-purple-600 rounded-lg">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              {selectedPaths.sell && (
                <div className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  Selected
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Sell on Marketplace</h3>
            <p className="text-sm text-gray-400 mb-4">
              List your Morgy for others to buy or license. Make passive income!
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                Set your price
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                70% revenue share
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                Monthly payouts
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                Creator dashboard
              </div>
            </div>
          </div>

          {/* Path C: Export via MCP */}
          <div
            onClick={() => togglePath('export')}
            className={`
              bg-gray-800 rounded-lg p-6 border-2 cursor-pointer transition-all
              ${selectedPaths.export ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'}
            `}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Download className="w-8 h-8 text-white" />
              </div>
              {selectedPaths.export && (
                <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  Selected
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Export via MCP</h3>
            <p className="text-sm text-gray-400 mb-4">
              Use your Morgy in Claude Desktop, Cursor, and other MCP apps.
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                Claude Desktop
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                Cursor IDE
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                Any MCP app
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                Portable
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Panels */}
        <div className="space-y-6">
          {/* Sell Configuration */}
          {selectedPaths.sell && (
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-purple-500">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-purple-400" />
                Marketplace Configuration
              </h3>

              <div className="grid grid-cols-2 gap-6">
                {/* Pricing */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pricing Model
                  </label>
                  <select
                    value={sellConfig.pricingModel}
                    onChange={(e) => setSellConfig({ ...sellConfig, pricingModel: e.target.value as any })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
                  >
                    <option value="free">Free (with attribution)</option>
                    <option value="one-time">One-time purchase</option>
                    <option value="monthly">Monthly subscription</option>
                    <option value="annual">Annual subscription</option>
                  </select>

                  {sellConfig.pricingModel !== 'free' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Price (USD)
                      </label>
                      <input
                        type="number"
                        value={sellConfig.price}
                        onChange={(e) => setSellConfig({ ...sellConfig, price: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
                        min="1"
                        max="500"
                      />
                    </div>
                  )}

                  {sellConfig.pricingModel !== 'free' && sellConfig.price && (
                    <div className="mt-4 bg-purple-500/20 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Estimated Monthly Revenue</div>
                      <div className="text-2xl font-bold text-white">
                        ${calculateRevenue().toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        After 70% revenue share
                      </div>
                    </div>
                  )}
                </div>

                {/* Visibility & License */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Visibility
                    </label>
                    <select
                      value={sellConfig.visibility}
                      onChange={(e) => setSellConfig({ ...sellConfig, visibility: e.target.value as any })}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
                    >
                      <option value="public">Public (anyone can find)</option>
                      <option value="unlisted">Unlisted (only via link)</option>
                      <option value="private">Private (invite only)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      License Permissions
                    </label>
                    <div className="space-y-2">
                      {[
                        { key: 'personalUse', label: 'Personal use' },
                        { key: 'commercialUse', label: 'Commercial use' },
                        { key: 'resale', label: 'Resale allowed' },
                        { key: 'modification', label: 'Modification allowed' },
                      ].map((perm) => (
                        <label key={perm.key} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sellConfig.license[perm.key as keyof typeof sellConfig.license]}
                            onChange={(e) => setSellConfig({
                              ...sellConfig,
                              license: { ...sellConfig.license, [perm.key]: e.target.checked },
                            })}
                            className="rounded"
                          />
                          {perm.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <strong className="text-yellow-500">Important:</strong> Buyers will receive your Morgy's knowledge, system prompt, and enabled templates. Make sure you're comfortable sharing this information.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Export Configuration */}
          {selectedPaths.export && (
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-blue-500">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Download className="w-6 h-6 text-blue-400" />
                MCP Export Configuration
              </h3>

              <div className="space-y-4">
                <label className="flex items-center gap-3 text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportConfig.includeKnowledge}
                    onChange={(e) => setExportConfig({ ...exportConfig, includeKnowledge: e.target.checked })}
                    className="rounded"
                  />
                  <div>
                    <div className="font-medium">Include Knowledge Base</div>
                    <div className="text-sm text-gray-400">Export all uploaded knowledge and embeddings</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportConfig.includeTemplates}
                    onChange={(e) => setExportConfig({ ...exportConfig, includeTemplates: e.target.checked })}
                    className="rounded"
                  />
                  <div>
                    <div className="font-medium">Include Templates & Workflows</div>
                    <div className="text-sm text-gray-400">Export enabled templates and workflows (limited functionality in external apps)</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportConfig.shareWithTeam}
                    onChange={(e) => setExportConfig({ ...exportConfig, shareWithTeam: e.target.checked })}
                    className="rounded"
                  />
                  <div>
                    <div className="font-medium">Generate Shareable Link</div>
                    <div className="text-sm text-gray-400">Create a link for team members to import this Morgy</div>
                  </div>
                </label>
              </div>

              <div className="mt-6 bg-blue-500/10 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-400 mb-2">Compatibility</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Claude Desktop
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Cursor IDE
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Knowledge base
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Personality
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <strong className="text-yellow-500">Note:</strong> Platform integrations (Reddit, Gmail, video creation) won't work in external MCP apps. Only chat and knowledge base will be functional.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary & Action */}
        <div className="mt-8 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Your Choices</h3>
          
          <div className="space-y-2 mb-6">
            {selectedPaths.use && (
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Use {morgyName} in Morgus for personal tasks</span>
              </div>
            )}
            {selectedPaths.sell && (
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle className="w-5 h-5 text-purple-400" />
                <span>
                  List on marketplace for {sellConfig.pricingModel === 'free' ? 'free' : `$${sellConfig.price}`}
                  {sellConfig.pricingModel === 'monthly' && '/month'}
                  {sellConfig.pricingModel === 'annual' && '/year'}
                </span>
              </div>
            )}
            {selectedPaths.export && (
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle className="w-5 h-5 text-blue-400" />
                <span>Export to Claude Desktop and other MCP apps</span>
              </div>
            )}
          </div>

          <button
            onClick={handleComplete}
            disabled={!selectedPaths.use && !selectedPaths.sell && !selectedPaths.export}
            className="w-full px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-semibold"
          >
            Complete Setup
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
