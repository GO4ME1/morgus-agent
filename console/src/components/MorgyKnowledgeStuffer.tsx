import React, { useState, useCallback } from 'react';
import { Upload, Link, FileText, Database, Trash2, Eye, TestTube, CheckCircle } from 'lucide-react';

interface KnowledgeItem {
  id: string;
  type: 'file' | 'website' | 'text' | 'datasource';
  title: string;
  content?: string;
  url?: string;
  size?: number;
  chunks?: number;
  createdAt: Date;
}

interface MorgyKnowledgeStufferProps {
  morgyId: string;
  existingKnowledge?: KnowledgeItem[];
  onKnowledgeUpdate: (knowledge: KnowledgeItem[]) => void;
}

export const MorgyKnowledgeStuffer: React.FC<MorgyKnowledgeStufferProps> = ({
  morgyId,
  existingKnowledge = [],
  onKnowledgeUpdate,
}) => {
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>(existingKnowledge);
  const [activeTab, setActiveTab] = useState<'upload' | 'website' | 'text' | 'datasource'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState<unknown[]>([]);

  // File Upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    setIsUploading(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('morgyId', morgyId);

      try {
        const response = await fetch('/api/knowledge/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        
        const newItem: KnowledgeItem = {
          id: result.id,
          type: 'file',
          title: file.name,
          size: file.size,
          chunks: result.chunks,
          createdAt: new Date(),
        };

        setKnowledge((prev) => [...prev, newItem]);
      } catch {
        console.error('Upload failed:', error);
      }
    }

    setIsUploading(false);
    onKnowledgeUpdate(knowledge);
  }, [morgyId, knowledge, onKnowledgeUpdate]);

  // Website Scraper
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);

  const handleWebsiteScrape = async () => {
    if (!websiteUrl) return;
    
    setIsScraping(true);

    try {
      const response = await fetch('/api/knowledge/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl, morgyId }),
      });

      const result = await response.json();
      
      const newItem: KnowledgeItem = {
        id: result.id,
        type: 'website',
        title: result.title,
        url: websiteUrl,
        size: result.size,
        chunks: result.chunks,
        createdAt: new Date(),
      };

      setKnowledge((prev) => [...prev, newItem]);
      setWebsiteUrl('');
    } catch {
      console.error('Scrape failed:', error);
    } finally {
      setIsScraping(false);
    }

    onKnowledgeUpdate(knowledge);
  };

  // Text Input
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [isSavingText, setIsSavingText] = useState(false);

  const handleTextSave = async () => {
    if (!textTitle || !textContent) return;
    
    setIsSavingText(true);

    try {
      const response = await fetch('/api/knowledge/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: textTitle, content: textContent, morgyId }),
      });

      const result = await response.json();
      
      const newItem: KnowledgeItem = {
        id: result.id,
        type: 'text',
        title: textTitle,
        content: textContent,
        size: textContent.length,
        chunks: result.chunks,
        createdAt: new Date(),
      };

      setKnowledge((prev) => [...prev, newItem]);
      setTextTitle('');
      setTextContent('');
    } catch {
      console.error('Save failed:', error);
    } finally {
      setIsSavingText(false);
    }

    onKnowledgeUpdate(knowledge);
  };

  // Delete Knowledge
  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/knowledge/${id}`, {
        method: 'DELETE',
      });

      setKnowledge((prev) => prev.filter((item) => item.id !== id));
      onKnowledgeUpdate(knowledge.filter((item) => item.id !== id));
    } catch {
      console.error('Delete failed:', error);
    }
  };

  // Test Knowledge Retrieval
  const handleTestKnowledge = async () => {
    if (!testQuery) return;

    try {
      const response = await fetch('/api/knowledge/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testQuery, morgyId }),
      });

      const results = await response.json();
      setTestResults(results);
    } catch {
      console.error('Test failed:', error);
    }
  };

  // Calculate Stats
  const totalItems = knowledge.length;
  const totalSize = knowledge.reduce((sum, item) => sum + (item.size || 0), 0);
  const totalChunks = knowledge.reduce((sum, item) => sum + (item.chunks || 0), 0);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        {[
          { id: 'upload', label: 'Upload Files', icon: Upload },
          { id: 'website', label: 'Scrape Website', icon: Link },
          { id: 'text', label: 'Paste Text', icon: FileText },
          { id: 'datasource', label: 'Data Sources', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as unknown)}
              className={`
                flex items-center gap-2 px-4 py-2 border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-gray-800 rounded-lg p-6">
        {/* Upload Files Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Upload Documents</h3>
            <p className="text-sm text-gray-400">
              Supports PDF, Word, TXT, and Markdown files
            </p>
            
            <div
              className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center hover:border-purple-500 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-white mb-2">
                {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-sm text-gray-400">
                PDF, DOCX, TXT, MD up to 10MB each
              </p>
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.md"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Scrape Website Tab */}
        {activeTab === 'website' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Scrape Website</h3>
            <p className="text-sm text-gray-400">
              Enter a URL to automatically extract and index the content
            </p>
            
            <div className="flex gap-2">
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
              />
              <button
                onClick={handleWebsiteScrape}
                disabled={isScraping || !websiteUrl}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
              >
                {isScraping ? 'Scraping...' : 'Scrape'}
              </button>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">How it works:</h4>
              <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                <li>Extracts main text content from the page</li>
                <li>Removes ads, navigation, and clutter</li>
                <li>Generates embeddings for semantic search</li>
                <li>Takes 10-30 seconds depending on page size</li>
              </ul>
            </div>
          </div>
        )}

        {/* Paste Text Tab */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Paste Text</h3>
            <p className="text-sm text-gray-400">
              Add text content directly. Markdown is supported.
            </p>
            
            <input
              type="text"
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
              placeholder="Title (e.g., 'Company Brand Guidelines')"
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            />

            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste your content here..."
              rows={12}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none font-mono text-sm"
            />

            <button
              onClick={handleTextSave}
              disabled={isSavingText || !textTitle || !textContent}
              className="w-full px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
            >
              {isSavingText ? 'Saving...' : 'Save Text'}
            </button>
          </div>
        )}

        {/* Data Sources Tab */}
        {activeTab === 'datasource' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Connect Data Sources</h3>
            <p className="text-sm text-gray-400 mb-4">
              Coming soon! Connect external data sources to keep your Morgy's knowledge up to date.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Google Drive', icon: '📁', status: 'coming-soon' },
                { name: 'Notion', icon: '📝', status: 'coming-soon' },
                { name: 'Dropbox', icon: '📦', status: 'coming-soon' },
                { name: 'GitHub', icon: '💻', status: 'coming-soon' },
              ].map((source) => (
                <div
                  key={source.name}
                  className="bg-gray-700/50 rounded-lg p-4 text-center opacity-50"
                >
                  <div className="text-3xl mb-2">{source.icon}</div>
                  <div className="text-white font-medium">{source.name}</div>
                  <div className="text-xs text-gray-400 mt-1">Coming Soon</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Knowledge List */}
      {knowledge.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Knowledge Base</h3>
          
          <div className="space-y-2">
            {knowledge.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-gray-700/50 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  {item.type === 'file' && <FileText className="w-5 h-5 text-blue-400" />}
                  {item.type === 'website' && <Link className="w-5 h-5 text-green-400" />}
                  {item.type === 'text' && <FileText className="w-5 h-5 text-purple-400" />}
                  
                  <div>
                    <div className="text-white font-medium">{item.title}</div>
                    <div className="text-xs text-gray-400">
                      {item.type === 'website' && item.url}
                      {item.size && ` • ${(item.size / 1024).toFixed(1)} KB`}
                      {item.chunks && ` • ${item.chunks} chunks`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="p-2 text-gray-400 hover:text-white"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-gray-400 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Total Items</div>
          <div className="text-2xl font-bold text-white">{totalItems}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Total Size</div>
          <div className="text-2xl font-bold text-white">
            {(totalSize / 1024 / 1024).toFixed(1)} MB
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Embeddings</div>
          <div className="text-2xl font-bold text-white">{totalChunks}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">RAG Enabled</div>
          <div className="text-2xl font-bold text-green-400 flex items-center gap-2">
            <CheckCircle className="w-6 h-6" />
            Yes
          </div>
        </div>
      </div>

      {/* Test Knowledge */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TestTube className="w-5 h-5 text-purple-400" />
          Test Knowledge Retrieval
        </h3>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="Ask a question to test knowledge retrieval..."
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            onKeyPress={(e) => e.key === 'Enter' && handleTestKnowledge()}
          />
          <button
            onClick={handleTestKnowledge}
            disabled={!testQuery}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
          >
            Test
          </button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-gray-400 mb-2">
              Found {testResults.length} relevant chunks:
            </div>
            {testResults.map((result, index) => (
              <div key={index} className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">
                  Score: {(result.score * 100).toFixed(1)}% • {result.source}
                </div>
                <div className="text-sm text-white">{result.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
