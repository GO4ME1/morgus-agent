import { useState } from 'react';
import { Download, Copy, Check, Terminal, FileCode, Share2, Info } from 'lucide-react';
import { exportToMCP } from '../lib/api-client';

interface MCPExportWizardProps {
  morgyId: string;
  morgyName: string;
  onComplete?: () => void;
}

interface ExportPackage {
  configJson: string;
  instructions: string;
  macInstaller: string;
  packageJson: string;
  serverCode: string;
  shareUrl?: string;
}

export const MCPExportWizard: React.FC<MCPExportWizardProps> = ({
  morgyId,
  morgyName,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [options, setOptions] = useState({
    includeKnowledge: true,
    includeTemplates: true,
    shareWithTeam: false,
  });
  const [exportPackage, setExportPackage] = useState<ExportPackage | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const steps = [
    { id: 1, title: 'Configure Export' },
    { id: 2, title: 'Generate Files' },
    { id: 3, title: 'Install in Claude' },
    { id: 4, title: 'Test & Share' },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportToMCP(morgyId, {
        includeKnowledge: options.includeKnowledge,
        includeTemplates: options.includeTemplates,
        shareWithTeam: options.shareWithTeam,
      });
      
      setExportPackage(data);
      setCurrentStep(2);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = (text: string, item: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(item);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getConfigDirectory = () => {
    const platform = navigator.platform.toLowerCase();
    if (platform.includes('mac')) {
      return '~/Library/Application Support/Claude/';
    } else if (platform.includes('win')) {
      return '%APPDATA%\\Claude\\';
    } else {
      return '~/.config/Claude/';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Export {morgyName} to MCP</h1>
          <p className="text-gray-400">
            Use your Morgy in Claude Desktop, Cursor, and other MCP-compatible apps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex-1 relative">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold
                    ${currentStep >= step.id ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'}
                  `}
                >
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <span className="text-xs text-gray-400 mt-2 text-center">{step.title}</span>
              </div>
              
              {index < steps.length - 1 && (
                <div
                  className={`
                    absolute top-5 left-1/2 w-full h-0.5
                    ${currentStep > step.id ? 'bg-purple-600' : 'bg-gray-700'}
                  `}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-gray-800 rounded-lg p-8">
          {/* Step 1: Configure Export */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">Configure Export Options</h2>

              <div className="space-y-4">
                <label className="flex items-start gap-3 text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeKnowledge}
                    onChange={(e) => setOptions({ ...options, includeKnowledge: e.target.checked })}
                    className="mt-1 rounded"
                  />
                  <div>
                    <div className="font-medium text-white">Include Knowledge Base</div>
                    <div className="text-sm text-gray-400">
                      Export all uploaded knowledge and embeddings. Your Morgy will have access to all its knowledge in external apps.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeTemplates}
                    onChange={(e) => setOptions({ ...options, includeTemplates: e.target.checked })}
                    className="mt-1 rounded"
                  />
                  <div>
                    <div className="font-medium text-white">Include Templates & Workflows</div>
                    <div className="text-sm text-gray-400">
                      Export enabled templates and workflows. Note: Platform integrations (Reddit, video creation) won't work in external apps.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.shareWithTeam}
                    onChange={(e) => setOptions({ ...options, shareWithTeam: e.target.checked })}
                    className="mt-1 rounded"
                  />
                  <div>
                    <div className="font-medium text-white">Generate Shareable Link</div>
                    <div className="text-sm text-gray-400">
                      Create a link for team members to import this Morgy into their Claude Desktop.
                    </div>
                  </div>
                </label>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <strong className="text-blue-400">Compatibility Note:</strong> When exported to Claude Desktop or other MCP apps, only chat and knowledge base features will work. Platform integrations (Reddit posting, video creation, etc.) require the full Morgus environment.
                  </div>
                </div>
              </div>

              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50 font-semibold"
              >
                {isExporting ? 'Generating Export...' : 'Generate MCP Export'}
              </button>
            </div>
          )}

          {/* Step 2: Download Files */}
          {currentStep === 2 && exportPackage && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">Download Export Files</h2>

              <div className="space-y-4">
                {/* Config JSON */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-5 h-5 text-purple-400" />
                      <span className="font-medium text-white">claude_desktop_config.json</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(exportPackage.configJson, 'config')}
                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 flex items-center gap-1 text-sm"
                      >
                        {copiedItem === 'config' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedItem === 'config' ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={() => downloadFile(exportPackage.configJson, `${morgyName.toLowerCase().replace(/\s+/g, '-')}-mcp.json`)}
                        className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-500 flex items-center gap-1 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Main configuration file for Claude Desktop
                  </p>
                </div>

                {/* macOS Installer */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-green-400" />
                      <span className="font-medium text-white">install-macos.sh</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(exportPackage.macInstaller, 'installer')}
                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 flex items-center gap-1 text-sm"
                      >
                        {copiedItem === 'installer' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedItem === 'installer' ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={() => downloadFile(exportPackage.macInstaller, 'install-macos.sh')}
                        className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-500 flex items-center gap-1 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    One-click installer for macOS (run with: bash install-macos.sh)
                  </p>
                </div>

                {/* Instructions */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-5 h-5 text-blue-400" />
                      <span className="font-medium text-white">INSTRUCTIONS.md</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(exportPackage.instructions, 'instructions')}
                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 flex items-center gap-1 text-sm"
                      >
                        {copiedItem === 'instructions' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedItem === 'instructions' ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={() => downloadFile(exportPackage.instructions, 'INSTRUCTIONS.md')}
                        className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-500 flex items-center gap-1 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Step-by-step installation instructions
                  </p>
                </div>

                {/* Share URL */}
                {exportPackage.shareUrl && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-pink-400" />
                        <span className="font-medium text-white">Shareable Link</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(exportPackage.shareUrl!, 'share')}
                        className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-500 flex items-center gap-1 text-sm"
                      >
                        {copiedItem === 'share' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedItem === 'share' ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 break-all">
                      {exportPackage.shareUrl}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setCurrentStep(3)}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 font-semibold"
              >
                Next: Install in Claude Desktop
              </button>
            </div>
          )}

          {/* Step 3: Installation Instructions */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">Install in Claude Desktop</h2>

              <div className="bg-gray-700 rounded-lg p-6 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      1
                    </div>
                    <h3 className="font-semibold text-white">Locate Claude Config Directory</h3>
                  </div>
                  <div className="ml-8 text-gray-300">
                    <p className="mb-2">Open your terminal and navigate to:</p>
                    <code className="bg-gray-800 px-3 py-2 rounded block text-sm text-purple-400">
                      {getConfigDirectory()}
                    </code>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      2
                    </div>
                    <h3 className="font-semibold text-white">Edit Configuration File</h3>
                  </div>
                  <div className="ml-8 text-gray-300">
                    <p className="mb-2">Open (or create) <code className="text-purple-400">claude_desktop_config.json</code></p>
                    <p className="text-sm text-gray-400">
                      Merge the downloaded config file contents into the <code className="text-purple-400">mcpServers</code> section
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      3
                    </div>
                    <h3 className="font-semibold text-white">Restart Claude Desktop</h3>
                  </div>
                  <div className="ml-8 text-gray-300">
                    <p>Completely quit and reopen Claude Desktop to load the new MCP server</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <strong className="text-green-400">Quick Install (macOS):</strong> Run the downloaded <code className="text-purple-400">install-macos.sh</code> script to automatically configure Claude Desktop.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep(4)}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 font-semibold"
              >
                Next: Test Your Morgy
              </button>
            </div>
          )}

          {/* Step 4: Test & Complete */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">Test Your Morgy</h2>

              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="font-semibold text-white mb-4">In Claude Desktop, try:</h3>
                
                <div className="space-y-3">
                  <div className="bg-gray-800 rounded p-3">
                    <code className="text-purple-400">@{morgyName} help</code>
                    <p className="text-xs text-gray-400 mt-1">See available commands</p>
                  </div>

                  <div className="bg-gray-800 rounded p-3">
                    <code className="text-purple-400">@{morgyName} What can you help me with?</code>
                    <p className="text-xs text-gray-400 mt-1">Chat with your Morgy</p>
                  </div>

                  {options.includeKnowledge && (
                    <div className="bg-gray-800 rounded p-3">
                      <code className="text-purple-400">@{morgyName} Search your knowledge for...</code>
                      <p className="text-xs text-gray-400 mt-1">Test knowledge base</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-6">
                <h3 className="font-semibold text-white mb-2">🎉 Export Complete!</h3>
                <p className="text-gray-300 mb-4">
                  Your Morgy is now portable and can be used in Claude Desktop, Cursor, and any MCP-compatible application!
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={onComplete}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 font-semibold"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                  >
                    Download Files Again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
