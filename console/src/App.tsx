import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import './App.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  attachments?: string[];
}

interface Task {
  id: string;
  description: string;
  status: string;
  created_at: string;
}

const API_URL = 'https://morgus-orchestrator.morgan-426.workers.dev';

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Hello! I\'m **Morgus**, your autonomous AI agent. I can help you with:\n\n• Research and information gathering\n• Planning complex projects\n• Writing and executing code\n• Deploying applications\n• And much more!\n\nWhat would you like to accomplish today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setTasks(data);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const downloadAsText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSend = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input || '[Files attached]',
      timestamp: new Date(),
      attachments: uploadedFiles.map(f => f.name),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input;
    const files = uploadedFiles;
    setInput('');
    setUploadedFiles([]);
    setIsLoading(true);

    // Add a placeholder for agent status updates
    const statusMessageId = (Date.now() + 1).toString();
    const statusMessage: Message = {
      id: statusMessageId,
      role: 'assistant',
      content: '🤖 Starting...',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, statusMessage]);

    try {
      // Upload files if any
      let fileUrls: string[] = [];
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        
        const uploadResponse = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          fileUrls = uploadData.urls || [];
        }
      }

      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          task_id: currentTaskId,
          stream: true,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          files: fileUrls,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\\n\\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              // Accumulate content instead of replacing
              if (data.content) {
                accumulatedContent = data.content;
              }
              
              // Update the status message
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === statusMessageId
                    ? {
                        ...msg,
                        content: accumulatedContent || msg.content,
                        isStreaming: data.type !== 'complete',
                      }
                    : msg
                )
              );
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

      setIsLoading(false);
      loadTasks();
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === statusMessageId
            ? {
                ...msg,
                content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                isStreaming: false,
              }
            : msg
        )
      );
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFeedback = async (messageId: string, feedbackType: 'positive' | 'negative' | 'glitch') => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      // Find the corresponding user message (the one before this assistant message)
      const messageIndex = messages.findIndex(m => m.id === messageId);
      const userMessage = messageIndex > 0 ? messages[messageIndex - 1] : null;

      await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: messageId,
          feedback_type: feedbackType,
          input: userMessage?.content || '',
          output: message.content,
          task_id: currentTaskId,
        }),
      });

      // Visual feedback
      const emoji = feedbackType === 'positive' ? '✅' : feedbackType === 'negative' ? '❌' : '🍅';
      alert(`${emoji} Feedback recorded! This will help improve Morgus.`);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    
    // If pasted content is large (>500 chars) or multi-line (>10 lines), create attachment
    const lineCount = pastedText.split('\n').length;
    const charCount = pastedText.length;
    
    if (charCount > 500 || lineCount > 10) {
      e.preventDefault();
      
      // Create a file from the pasted content
      const blob = new Blob([pastedText], { type: 'text/plain' });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const file = new File([blob], `pasted_content_${timestamp}.txt`, { type: 'text/plain' });
      
      setUploadedFiles(prev => [...prev, file]);
      setInput(prev => prev + (prev ? '\n' : '') + '[Content attached as file]');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <div className={`sidebar ${showSidebar ? 'show' : 'hide'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">M</div>
            <h1>Morgus</h1>
          </div>
          <button className="new-chat-button" onClick={() => {
            setMessages([{
              id: '1',
              role: 'assistant',
              content: '👋 Hello! I\'m **Morgus**, your autonomous AI agent. What would you like to accomplish today?',
              timestamp: new Date(),
            }]);
            setCurrentTaskId(null);
          }}>
            + New Chat
          </button>
        </div>

        <div className="task-list">
          <h3>Recent Tasks</h3>
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`task-item ${currentTaskId === task.id ? 'active' : ''}`}
              onClick={() => setCurrentTaskId(task.id)}
            >
              <div className="task-title">{task.description.substring(0, 50)}...</div>
              <div className="task-status">{task.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="chat-header">
          <button className="sidebar-toggle" onClick={() => setShowSidebar(!showSidebar)}>
            ☰
          </button>
          <h2>Morgus AI Agent</h2>
          <div className="status-indicator">
            <span className="status-dot online"></span>
            Online
          </div>
        </div>

        <div className="messages-container">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className="message-avatar">
                {message.role === 'assistant' ? '🤖' : '👤'}
              </div>
              <div className="message-content">
                <div className="message-text">
                  {message.content.split('\\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="attachments">
                      {message.attachments.map((file, i) => (
                        <div key={i} className="attachment-chip">📎 {file}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="message-actions">
                  <div className="message-time">{formatTime(message.timestamp)}</div>
                  {message.role === 'assistant' && !message.isStreaming && (
                    <div className="action-buttons">
                      <button 
                        className="icon-button feedback-button" 
                        onClick={() => handleFeedback(message.id, 'positive')}
                        title="Good response"
                      >
                        👍
                      </button>
                      <button 
                        className="icon-button feedback-button" 
                        onClick={() => handleFeedback(message.id, 'negative')}
                        title="Bad response"
                      >
                        👎
                      </button>
                      <button 
                        className="icon-button feedback-button" 
                        onClick={() => handleFeedback(message.id, 'glitch')}
                        title="Report glitch/bug"
                      >
                        🍅
                      </button>
                      <button 
                        className="icon-button" 
                        onClick={() => copyToClipboard(message.content)}
                        title="Copy to clipboard"
                      >
                        📋
                      </button>
                      <button 
                        className="icon-button" 
                        onClick={() => downloadAsText(message.content, `morgus-response-${message.id}.txt`)}
                        title="Download as text"
                      >
                        💾
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          {uploadedFiles.length > 0 && (
            <div className="uploaded-files">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="file-chip">
                  📎 {file.name}
                  <button onClick={() => removeFile(index)}>×</button>
                </div>
              ))}
            </div>
          )}
          <div className="input-wrapper">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              style={{ display: 'none' }}
            />
            <button
              className="attach-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Attach files"
            >
              📎
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              onPaste={handlePaste}
              placeholder="Message Morgus..."
              rows={1}
              disabled={isLoading}
            />
            <button
              className="send-button"
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
