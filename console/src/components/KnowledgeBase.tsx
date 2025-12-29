import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
// Document processing is now handled by the backend worker
import './KnowledgeBase.css';

interface KnowledgeDocument {
  id: string;
  title: string;
  source_type: 'upload' | 'url' | 'text';
  source_url?: string;
  file_type?: string;
  file_size?: number;
  chunk_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
}

interface KnowledgeBaseProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KnowledgeBase({ isOpen, onClose }: KnowledgeBaseProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'documents' | 'add'>('documents');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const WORKER_URL = 'https://morgus-document-processor.morgan-426.workers.dev';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger backend worker to process a document
  const triggerProcessing = async (documentId: string) => {
    try {
      await fetch(`${WORKER_URL}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: documentId }),
      });
    } catch {
      console.log('Worker trigger failed, will process on schedule:', err);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      loadDocuments();
    }
  }, [isOpen, user]);

  const loadDocuments = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('knowledge_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch {
      console.error('Error loading documents:', err);
      setError('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(null);

    let successCount = 0;
    let failCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingStatus(`Processing file ${i + 1}/${files.length}: ${file.name}`);

        // Create document record
        const { data: doc, error: docError } = await supabase
          .from('knowledge_documents')
          .insert({
            user_id: user.id,
            title: file.name,
            source_type: 'upload',
            file_type: file.type || getFileExtension(file.name),
            file_size: file.size,
            status: 'processing',
          })
          .select()
          .single();

        if (docError) {
          failCount++;
          continue;
        }

        // Store file content and trigger backend processing
        const reader = new FileReader();
        const content = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsText(file);
        });

        // Update document with content
        await supabase
          .from('knowledge_documents')
          .update({ content, status: 'pending' })
          .eq('id', doc.id);

        // Trigger backend worker to process
        triggerProcessing(doc.id);
        successCount++;

        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      if (successCount > 0) {
        setSuccess(`Uploaded ${successCount} file(s)! Processing in background...${failCount > 0 ? ` ${failCount} failed.` : ''}`);
      } else {
        setError('All files failed to process.');
      }

      loadDocuments();
      setActiveTab('documents');
    } catch {
      console.error('Error uploading files:', err);
      setError('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setProcessingStatus('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlAdd = async () => {
    if (!urlInput.trim() || !user) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('knowledge_documents')
        .insert({
          user_id: user.id,
          title: urlInput,
          source_type: 'url',
          source_url: urlInput,
          status: 'pending',
        });

      if (error) throw error;

      setSuccess('URL added successfully. Processing will begin shortly.');
      setUrlInput('');
      loadDocuments();
      setActiveTab('documents');
    } catch {
      console.error('Error adding URL:', err);
      setError('Failed to add URL. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextAdd = async () => {
    if (!textInput.trim() || !textTitle.trim() || !user) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setProcessingStatus('Creating document...');

    try {
      // Create document record
      const { data: doc, error: docError } = await supabase
        .from('knowledge_documents')
        .insert({
          user_id: user.id,
          title: textTitle,
          source_type: 'text',
          content: textInput,
          status: 'processing',
        })
        .select()
        .single();

      if (docError) throw docError;

      // Trigger backend worker to process
      triggerProcessing(doc.id);
      setSuccess('Text added! Processing in background...');

      setTextInput('');
      setTextTitle('');
      loadDocuments();
      setActiveTab('documents');
    } catch {
      console.error('Error adding text:', err);
      setError('Failed to add text. Please try again.');
    } finally {
      setIsUploading(false);
      setProcessingStatus('');
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      // Delete chunks first
      await supabase
        .from('knowledge_chunks')
        .delete()
        .eq('document_id', docId);

      // Delete document
      const { error } = await supabase
        .from('knowledge_documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;

      setSuccess('Document deleted successfully');
      loadDocuments();
    } catch {
      console.error('Error deleting document:', err);
      setError('Failed to delete document');
    }
  };

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || 'unknown';
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'upload': return '📄';
      case 'url': return '🌐';
      case 'text': return '📝';
      default: return '📁';
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="knowledge-base-overlay" onClick={onClose}>
      <div className="knowledge-base-modal" onClick={e => e.stopPropagation()}>
        <div className="kb-header">
          <div className="kb-title">
            <span className="kb-icon">📚</span>
            <h2>Knowledge Base</h2>
          </div>
          <button className="kb-close" onClick={onClose}>×</button>
        </div>

        <div className="kb-tabs">
          <button
            className={`kb-tab ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            📁 My Documents ({documents.length})
          </button>
          <button
            className={`kb-tab ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            ➕ Add Knowledge
          </button>
        </div>

        {error && (
          <div className="kb-alert error">
            <span>❌</span> {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {success && (
          <div className="kb-alert success">
            <span>✅</span> {success}
            <button onClick={() => setSuccess(null)}>×</button>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="kb-documents">
            <div className="kb-search">
              <input
                type="text"
                placeholder="🔍 Search documents..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {isLoading ? (
              <div className="kb-loading">
                <div className="kb-spinner"></div>
                <p>Loading documents...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="kb-empty">
                <span className="empty-icon">📭</span>
                <h3>No documents yet</h3>
                <p>Add documents, URLs, or text to build your knowledge base.</p>
                <button onClick={() => setActiveTab('add')}>
                  ➕ Add Your First Document
                </button>
              </div>
            ) : (
              <div className="kb-document-list">
                {filteredDocuments.map(doc => (
                  <div key={doc.id} className={`kb-document-card ${doc.status}`}>
                    <div className="doc-icon">{getSourceIcon(doc.source_type)}</div>
                    <div className="doc-info">
                      <h4>{doc.title}</h4>
                      <div className="doc-meta">
                        <span className="doc-type">{doc.source_type}</span>
                        {doc.file_size && (
                          <span className="doc-size">{formatFileSize(doc.file_size)}</span>
                        )}
                        <span className="doc-chunks">
                          {doc.chunk_count || 0} chunks
                        </span>
                        <span className={`doc-status ${doc.status}`}>
                          {getStatusIcon(doc.status)} {doc.status}
                        </span>
                      </div>
                      {doc.error_message && (
                        <p className="doc-error">{doc.error_message}</p>
                      )}
                    </div>
                    <button
                      className="doc-delete"
                      onClick={() => handleDelete(doc.id)}
                      title="Delete document"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div className="kb-add">
            <div className="add-section">
              <h3>📄 Upload Files</h3>
              <p>Upload PDF, Word, TXT, MD, or CSV files</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.md,.csv,.json"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                className="upload-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>Uploading... {uploadProgress}%</>
                ) : (
                  <>📤 Choose Files</>
                )}
              </button>
              {isUploading && (
                <div className="upload-progress">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>

            <div className="add-divider">
              <span>or</span>
            </div>

            <div className="add-section">
              <h3>🌐 Add URL</h3>
              <p>Add a webpage or article URL to extract content</p>
              <div className="url-input-group">
                <input
                  type="url"
                  placeholder="https://example.com/article"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                />
                <button
                  onClick={handleUrlAdd}
                  disabled={!urlInput.trim() || isUploading}
                >
                  Add
                </button>
              </div>
            </div>

            <div className="add-divider">
              <span>or</span>
            </div>

            <div className="add-section">
              <h3>📝 Add Text</h3>
              <p>Paste text content directly</p>
              <input
                type="text"
                placeholder="Title for this content"
                value={textTitle}
                onChange={e => setTextTitle(e.target.value)}
                className="text-title-input"
              />
              <textarea
                placeholder="Paste your text content here..."
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                rows={6}
              />
              <button
                onClick={handleTextAdd}
                disabled={!textInput.trim() || !textTitle.trim() || isUploading}
                className="add-text-button"
              >
                ➕ Add Text
              </button>
            </div>
          </div>
        )}

        {/* Processing Status */}
        {processingStatus && (
          <div className="kb-processing-status">
            <div className="processing-spinner"></div>
            <span>{processingStatus}</span>
          </div>
        )}

        {/* Backend Processing Info */}
        <div className="kb-processing-info">
          <div className="processing-info-header">
            <span>⚡ Automatic Processing</span>
            <span className="processing-status-badge">✅ Enabled</span>
          </div>
          <p className="processing-info-hint">
            Documents are automatically processed in the background. No API key required!
          </p>
        </div>

        <div className="kb-footer">
          <div className="kb-stats">
            <span>📊 {documents.length} documents</span>
            <span>📦 {documents.reduce((sum, d) => sum + (d.chunk_count || 0), 0)} total chunks</span>
            <span className={`kb-ready ${documents.filter(d => d.status === 'completed').length > 0 ? 'active' : ''}`}>
              🔍 {documents.filter(d => d.status === 'completed').length} ready for search
            </span>
          </div>
          <p className="kb-hint">
            💡 Documents are automatically chunked and embedded for semantic search during Deep Research.
          </p>
        </div>
      </div>
    </div>
  );
}
