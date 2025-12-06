import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { supabase } from './lib/supabase';
import { ThoughtsPanel } from './components/ThoughtsPanel';
import { VoiceInput, speakText, stopSpeaking } from './components/VoiceInput';
import { MOEHeader } from './components/MOEHeader';
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
  moeMetadata?: {
    winner: {
      model: string;
      latency: number;
      tokens: number;
      cost: number;
    };
    allModels: Array<{
      model: string;
      latency: number;
      tokens: number;
      cost: number;
      score: number;
    }>;
    nashExplanation: string;
    totalLatency: number;
    totalCost: number;
  };
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
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
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

  // Poll audio playing state
  useEffect(() => {
    const interval = setInterval(() => {
      const playing = (window as any).__isAudioPlaying || false;
      setIsAudioPlaying(playing);
    }, 100);
    return () => clearInterval(interval);
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
    const filesToUpload = [...uploadedFiles]; // Create a copy before clearing
    setInput('');
    setUploadedFiles([]); // Clear UI state
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
      if (filesToUpload.length > 0) {
        const formData = new FormData();
        filesToUpload.forEach(file => formData.append('files', file));
        
        const uploadResponse = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          fileUrls = uploadData.urls || [];
          console.log('[FRONTEND] Upload response:', { fileCount: fileUrls.length, urlLengths: fileUrls.map(u => u.length) });
        } else {
          console.error('[FRONTEND] Upload failed:', uploadResponse.status, await uploadResponse.text());
        }
      }

      console.log('[FRONTEND] Sending to MOE with', fileUrls.length, 'files');
      
      // Use MOE endpoint for model competition
      const response = await fetch(`${API_URL}/moe-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput || (fileUrls.length > 0 ? 'Please analyze these files' : ''),
          task_id: currentTaskId,
          thought_id: currentThoughtId,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          files: fileUrls,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // MOE returns JSON response with competition results
      const data = await response.json();
      
      // Update message with MOE response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === statusMessageId
            ? {
                ...msg,
                content: data.message,
                moeMetadata: data.moeMetadata, // Store MOE competition data
                isStreaming: false,
              }
            : msg
        )
      );
      
      // Auto-speak if enabled
      if (autoSpeak && data.message) {
        setTimeout(() => {
          speakText(data.message);
        }, 100);
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
                {/* MOE Competition Header (if available) */}
                {message.moeMetadata && (
                  <MOEHeader metadata={message.moeMetadata} />
                )}
                <div className="message-text">
                  <div dangerouslySetInnerHTML={{ __html: marked.parse(message.content) }} />
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="attachments">
                      {message.attachments.map((file, i) => (
                        <div key={i} className="attachment-chip">📎 {file}</div>
                      ))}
                    </div>
                  )}
                  {/* Image download buttons */}
                  {message.role === 'assistant' && message.content.includes('![') && (
                    <div className="image-download-buttons">
                      {(() => {
                        const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
                        const matches = [...message.content.matchAll(imageRegex)];
                        return matches.map((match, i) => (
                          <a
                            key={i}
                            href={match[2]}
                            download={`morgus-image-${Date.now()}-${i}.png`}
                            className="download-image-btn"
                            title="Download image"
                          >
                            📥 Download Image {matches.length > 1 ? `${i + 1}` : ''}
                          </a>
                        ));
                      })()}
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
              accept=".pdf,.doc,.docx,.txt,.md,.csv,.png,.jpg,.jpeg,.gif,.mp4,.mov,.avi,.webm,.mkv"
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
              className={isAudioPlaying ? "stop-audio-button" : "voice-button"}
              onClick={() => {
                if (isAudioPlaying) {
                  // Stop audio if playing
                  stopSpeaking();
                } else {
                  // Toggle auto-speak
                  const newAutoSpeak = !autoSpeak;
                  setAutoSpeak(newAutoSpeak);
                  if (!newAutoSpeak) {
                    stopSpeaking();
                  } else {
                    // Read the last assistant message when enabling
                    const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
                    if (lastAssistantMessage?.content) {
                      speakText(lastAssistantMessage.content);
                    }
                  }
                }
              }}
              title={isAudioPlaying ? 'Stop audio' : (autoSpeak ? 'Disable auto-speak' : 'Enable auto-speak')}
            >
              {isAudioPlaying ? '⏹️' : (autoSpeak ? '🔊' : '🔇')}
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
      {/* Floating scroll-to-bottom button */}
      <button
        className="scroll-to-bottom-floating"
        onClick={() => {
          const chatMessages = document.querySelector('.chat-messages, .messages-container');
          if (chatMessages) {
            chatMessages.scrollTo({
              top: chatMessages.scrollHeight,
              behavior: 'smooth'
            });
          }
        }}
        title="Scroll to bottom"
      >
        ⬇️
      </button>
    </div>
  );
}

export default App;
