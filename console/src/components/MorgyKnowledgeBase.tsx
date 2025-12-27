import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface MorgyKnowledge {
  id: string;
  morgy_id: string;
  content: string;
  source: string;
  source_type: 'text' | 'pdf' | 'docx' | 'website' | 'code' | 'audio' | 'video';
  metadata: Record<string, any>;
  created_at: string;
}

interface MorgyKnowledgeBaseProps {
  morgyId: string;
  morgyName: string;
}

export const MorgyKnowledgeBase: React.FC<MorgyKnowledgeBaseProps> = ({ morgyId, morgyName }) => {
  const [knowledge, setKnowledge] = useState<MorgyKnowledge[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'upload' | 'scrape'>('list');
  
  // Text input
  const [textContent, setTextContent] = useState('');
  const [textSource, setTextSource] = useState('');
  
  // Website scraping
  const [websiteUrl, setWebsiteUrl] = useState('');
  
  // File upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadKnowledge();
  }, [morgyId]);

  const loadKnowledge = async () => {
    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const response = await fetch(`/api/morgys/${morgyId}/knowledge`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load knowledge');
      
      const data = await response.json();
      setKnowledge(data);
    } catch (error) {
      console.error('Failed to load knowledge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim()) return;

    setUploading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const response = await fetch(`/api/morgys/${morgyId}/knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          content: textContent,
          source: textSource || 'Manual Entry',
          sourceType: 'text'
        })
      });

      if (!response.ok) throw new Error('Failed to add knowledge');
      
      setTextContent('');
      setTextSource('');
      await loadKnowledge();
      setActiveTab('list');
    } catch (error) {
      console.error('Failed to add knowledge:', error);
      alert('Failed to add knowledge');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`/api/morgys/${morgyId}/knowledge/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload file');
      
      setSelectedFile(null);
      await loadKnowledge();
      setActiveTab('list');
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleWebsiteScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl.trim()) return;

    setUploading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const response = await fetch(`/api/morgys/${morgyId}/knowledge/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ url: websiteUrl })
      });

      if (!response.ok) throw new Error('Failed to scrape website');
      
      setWebsiteUrl('');
      await loadKnowledge();
      setActiveTab('list');
    } catch (error) {
      console.error('Failed to scrape website:', error);
      alert('Failed to scrape website');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (knowledgeId: string) => {
    if (!confirm('Are you sure you want to delete this knowledge?')) return;

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const response = await fetch(`/api/morgys/knowledge/${knowledgeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete knowledge');
      
      await loadKnowledge();
    } catch (error) {
      console.error('Failed to delete knowledge:', error);
      alert('Failed to delete knowledge');
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'pdf': return '📄';
      case 'docx': return '📝';
      case 'website': return '🌐';
      case 'code': return '💻';
      case 'audio': return '🎵';
      case 'video': return '🎬';
      default: return '📋';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <h2 className="text-2xl font-bold">📚 {morgyName}'s Knowledge Base</h2>
          <p className="text-purple-100 mt-2">
            Train your Morgy with documents, websites, and custom knowledge
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'list'
                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            📋 Knowledge ({knowledge.length})
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'upload'
                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            ⬆️ Upload
          </button>
          <button
            onClick={() => setActiveTab('scrape')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'scrape'
                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            🌐 Scrape Website
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* List Tab */}
          {activeTab === 'list' && (
            <div>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  <p className="mt-4 text-gray-600">Loading knowledge...</p>
                </div>
              ) : knowledge.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No knowledge added yet</p>
                  <p className="text-gray-400 mt-2">Upload documents or add text to train your Morgy</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="mt-6 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Add Knowledge
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {knowledge.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{getSourceIcon(item.source_type)}</span>
                            <h3 className="font-semibold text-lg">{item.source}</h3>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {item.source_type}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-3">
                            {item.content.substring(0, 300)}...
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            Added {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="ml-4 text-red-600 hover:text-red-800 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-8">
              {/* Text Input */}
              <div>
                <h3 className="text-lg font-semibold mb-4">📝 Add Text Knowledge</h3>
                <form onSubmit={handleTextSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Source Name
                    </label>
                    <input
                      type="text"
                      value={textSource}
                      onChange={(e) => setTextSource(e.target.value)}
                      placeholder="e.g., Company Info, Product Details"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content
                    </label>
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Paste your text here..."
                      rows={8}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                  >
                    {uploading ? 'Adding...' : 'Add Text Knowledge'}
                  </button>
                </form>
              </div>

              {/* File Upload */}
              <div>
                <h3 className="text-lg font-semibold mb-4">📄 Upload File</h3>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select File (PDF, Word, Text)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                  >
                    {uploading ? 'Uploading...' : 'Upload File'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Scrape Tab */}
          {activeTab === 'scrape' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">🌐 Scrape Website</h3>
              <form onSubmit={handleWebsiteScrape} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                >
                  {uploading ? 'Scraping...' : 'Scrape Website'}
                </button>
              </form>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> This will extract text content from the webpage and add it to your Morgy's knowledge base.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
