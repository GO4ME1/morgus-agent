import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { supabase } from './lib/supabase';
import { ThoughtsPanel } from './components/ThoughtsPanel';
import { VoiceInput, speakText, stopSpeaking } from './components/VoiceInput';
import './App.css';

// Configure marked for inline rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

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
  const [currentThoughtId, setCurrentThoughtId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
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

  // Load messages when thought changes
  useEffect(() => {
    if (currentThoughtId) {
      loadThoughtMessages(currentThoughtId);
    }
  }, [currentThoughtId]);

  const loadThoughtMessages = async (thoughtId: string) => {
    try {
      const { data, error } = await supabase
        .from('thought_messages')
        .select('*')
        .eq('thought_id', thoughtId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const loadedMessages: Message[] = data.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }));
        
        // Keep the welcome message if no messages exist
        if (loadedMessages.length === 0) {
          setMessages([{
            id: '1',
            role: 'assistant',
            content: '👋 Hello! I\'m **Morgus**, your autonomous AI agent. I can help you with:\n\n• Research and information gathering\n• Planning complex projects\n• Writing and executing code\n• Deploying applications\n• And much more!\n\nWhat would you like to accomplish today?',
            timestamp: new Date(),
          }]);
        } else {
          setMessages(loadedMessages);
        }
      }
    } catch (error) {
      console.error('Failed to load thought messages:', error);
    }
  };

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

  const deleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent task selection when clicking delete
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (!error) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (currentTaskId === taskId) {
        setCurrentTaskId(null);
      }
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

  const saveMessageToThought = async (message: Message) => {
    if (!currentThoughtId) {
      alert('Please select a thought first!');
      return;
    }

    try {
      const { error } = await supabase
        .from('thought_messages')
        .insert({
          thought_id: currentThoughtId,
          role: message.role,
          content: message.content,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      alert('✅ Message saved to thought!');
    } catch (error) {
      console.error('Failed to save message:', error);
      alert('❌ Failed to save message');
    }
  };

  const rateMessage = async (messageId: string, rating: 'good' | 'bad' | 'glitch') => {
    try {
      // Save rating to database
      const { error } = await supabase
        .from('message_ratings')
        .insert({
          message_id: messageId,
          rating: rating,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Show feedback
      const emoji = rating === 'good' ? '👍' : rating === 'bad' ? '👎' : '🍅';
      const text = rating === 'good' ? 'Thanks for the feedback!' : rating === 'bad' ? 'Sorry! I\'ll try to improve.' : 'Glitch reported!';
      alert(`${emoji} ${text}`);
    } catch (error) {
      console.error('Failed to save rating:', error);
      // Don't show error to user for ratings
    }
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
          thought_id: currentThoughtId,
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              // Update the status message
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === statusMessageId
                    ? {
                        ...msg,
                        content: data.type === 'response' 
                          ? data.content // Response content replaces everything
                          : data.type === 'complete'
                          ? msg.content // Keep existing content on complete
                          : data.content || msg.content, // For status/tool messages, update normally
                        isStreaming: data.type !== 'complete',
                      }
                    : msg
                )
              );
              
              // Auto-speak if enabled and response is complete
              if (autoSpeak && data.type === 'response' && data.content) {
                speakText(data.content);
              }
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

        <ThoughtsPanel
          currentThoughtId={currentThoughtId}
          onThoughtChange={setCurrentThoughtId}
          onThoughtCreate={() => {
            // Will be handled by ThoughtsPanel internally
          }}
        />

        <div className="task-list">
          <h3>Recent Tasks</h3>
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`task-item ${currentTaskId === task.id ? 'active' : ''}`}
              onClick={() => setCurrentTaskId(task.id)}
            >
              <div className="task-info">
                <div className="task-title">{task.description.substring(0, 50)}...</div>
                <div className="task-status">{task.status}</div>
              </div>
              <button 
                className="delete-task-button"
                onClick={(e) => deleteTask(task.id, e)}
                title="Delete task"
              >
                🗑️
              </button>
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
                  <div dangerouslySetInnerHTML={{ __html: marked.parse(message.content) }} />
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
                      <button 
                        className="icon-button" 
                        onClick={() => saveMessageToThought(message)}
                        title="Save to thought"
                      >
                        💭
                      </button>
                      <button 
                        className="icon-button" 
                        onClick={() => {
                          // Quick add to current thought
                          if (currentThoughtId) {
                            saveMessageToThought(message);
                          } else {
                            alert('Please select a thought first!');
                          }
                        }}
                        title="Quick add to current thought"
                      >
                        ➕
                      </button>
                      <button 
                        className="icon-button" 
                        onClick={() => rateMessage(message.id, 'good')}
                        title="Good response"
                      >
                        👍
                      </button>
                      <button 
                        className="icon-button" 
                        onClick={() => rateMessage(message.id, 'bad')}
                        title="Bad response"
                      >
                        👎
                      </button>
                      <button 
                        className="icon-button" 
                        onClick={() => rateMessage(message.id, 'glitch')}
                        title="Report glitch"
                      >
                        🍅
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
              placeholder="Message Morgus..."
              rows={1}
              disabled={isLoading}
            />
            <VoiceInput
              onTranscript={(text) => setInput(text)}
              isListening={isListening}
              onListeningChange={setIsListening}
            />
            <button
              className="speaker-button"
              onClick={() => {
                const newValue = !autoSpeak;
                setAutoSpeak(newValue);
                if (!newValue) {
                  stopSpeaking(); // Stop any ongoing speech when disabling
                }
              }}
              title={autoSpeak ? 'Disable auto-speak' : 'Enable auto-speak'}
            >
              {autoSpeak ? '🔊' : '🔇'}
            </button>
            {isLoading ? (
              <button
                className="stop-button"
                onClick={() => window.location.reload()}
                title="Stop generation"
              >
                ⏹️
              </button>
            ) : (
              <button
                className="send-button"
                onClick={handleSend}
                disabled={!input.trim() && uploadedFiles.length === 0}
              >
                ➤
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
