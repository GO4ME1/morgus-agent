import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAuth } from './lib/auth';
import { ThoughtsPanel } from './components/ThoughtsPanel';
import { VoiceInput, speakText, stopSpeaking } from './components/VoiceInput';
import { MOEHeader } from './components/MOEHeader';
import { MOELeaderboard } from './components/MOELeaderboard';
import { ThinkingIndicator } from './components/ThinkingIndicator';
import { BrowserView } from './components/BrowserView';
import { SettingsPanel } from './components/SettingsPanel';
import MorgyPen from './components/MorgyPen';
import { MorgyAutocomplete } from './components/MorgyAutocomplete';
import { DeepResearchPanel } from './components/DeepResearchPanel';
import { runDeepResearch } from './lib/research-orchestrator';
import type { ResearchSession, ResearchStep } from './lib/research-orchestrator';
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
  isTruncated?: boolean;
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
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Hello! I\'m Morgus, your autonomous AI agent. What would you like to accomplish today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [currentThoughtId, setCurrentThoughtId] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentTool] = useState<string | undefined>(); // TODO: Track tool usage from backend
  const [darkMode, setDarkMode] = useState(false); // Default to light mode
  const [showSettings, setShowSettings] = useState(false);
  const [activeMorgys, setActiveMorgys] = useState<string[]>([]);
  const [showMorgyAutocomplete, setShowMorgyAutocomplete] = useState(false);
  const [deepResearchMode, setDeepResearchMode] = useState(false);
  const [currentResearchSessionId, setCurrentResearchSessionId] = useState<string | null>(null);
  const [showResearchPanel, setShowResearchPanel] = useState(false);
  const [_researchSession, setResearchSession] = useState<ResearchSession | null>(null);
  const [_researchSteps, setResearchSteps] = useState<ResearchStep[]>([]);
  const [dontTrainOnMe, setDontTrainOnMe] = useState(() => {
    const saved = localStorage.getItem('morgus_dont_train');
    return saved === 'true';
  });

  // Sync dontTrainOnMe with profile from Supabase
  useEffect(() => {
    if (profile?.dont_train_on_me !== undefined) {
      setDontTrainOnMe(profile.dont_train_on_me);
      localStorage.setItem('morgus_dont_train', profile.dont_train_on_me ? 'true' : 'false');
    }
  }, [profile?.dont_train_on_me]);

  // Save dontTrainOnMe to Supabase when changed
  const handleDontTrainToggle = async (value: boolean) => {
    setDontTrainOnMe(value);
    localStorage.setItem('morgus_dont_train', value ? 'true' : 'false');
    
    // Save to Supabase if user is logged in
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ dont_train_on_me: value })
          .eq('id', user.id);
        console.log('[App] Saved dont_train_on_me to profile:', value);
      } catch (error) {
        console.error('[App] Failed to save dont_train_on_me:', error);
      }
    }
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
            content: '👋 Hello! I\'m Morgus, your autonomous AI agent. What would you like to accomplish today?',
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
    // Load conversations (recent chats)
    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      // Map to Task interface for compatibility
      setTasks(data.map(conv => ({
        id: conv.id,
        description: conv.title,
        status: 'completed',
        created_at: conv.created_at,
      })));
    }
  };

  const deleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent task selection when clicking delete
    
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', taskId);

    if (!error) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (currentTaskId === taskId) {
        setCurrentTaskId(null);
        setCurrentConversationId(null);
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

  // Helper function for normal MOE request (used when deep research is not needed)
  const handleNormalMOERequest = async (userInput: string, filesToUpload: File[], statusMessageId: string) => {
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
        }
      }
      
      // Use MOE endpoint for model competition
      const response = await fetch(`${API_URL}/moe-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput || (fileUrls.length > 0 ? 'Please analyze these files' : ''),
          task_id: currentTaskId,
          conversation_id: currentConversationId,
          thought_id: currentThoughtId,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          files: fileUrls,
          dont_train_on_me: dontTrainOnMe,
          user_id: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === statusMessageId
            ? {
                ...msg,
                content: data.message,
                moeMetadata: data.moeMetadata,
                isStreaming: false,
              }
            : msg
        )
      );
      
      if (autoSpeak && data.message) {
        setTimeout(() => speakText(data.message), 100);
      }

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
      content: deepResearchMode ? '🧠 Starting Deep Research...' : '🤖 Starting...',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, statusMessage]);

    // If Deep Research Mode is enabled, use the research orchestrator
    if (deepResearchMode && user?.id) {
      try {
        setShowResearchPanel(true);
        
        const result = await runDeepResearch(
          user.id,
          userInput,
          `${API_URL}/moe-chat`, // API endpoint
          '', // API key (handled by backend)
          import.meta.env.VITE_OPENAI_API_KEY, // For RAG embeddings
          (session, steps) => {
            // Progress callback
            setResearchSession(session);
            setResearchSteps(steps);
            setCurrentResearchSessionId(session.id);
            
            // Update status message with progress
            const progress = session.completed_steps > 0 
              ? `(${session.completed_steps}/${session.total_steps} steps)`
              : '';
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === statusMessageId
                  ? {
                      ...msg,
                      content: `🧠 Deep Research in progress ${progress}...`,
                    }
                  : msg
              )
            );
          }
        );

        if (result) {
          // Deep research completed successfully
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === statusMessageId
                ? {
                    ...msg,
                    content: result.answer,
                    isStreaming: false,
                  }
                : msg
            )
          );
          setResearchSession(result.session);
        } else {
          // Deep research not needed or failed, fall back to normal MOE
          await handleNormalMOERequest(userInput, filesToUpload, statusMessageId);
        }
        
        setIsLoading(false);
        return;
      } catch (error) {
        console.error('Deep research error:', error);
        // Fall back to normal MOE on error
        await handleNormalMOERequest(userInput, filesToUpload, statusMessageId);
        setIsLoading(false);
        return;
      }
    }

    // Normal MOE request flow
    await handleNormalMOERequest(userInput, filesToUpload, statusMessageId);
    setIsLoading(false);
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

  // Detect if a response appears truncated
  const isResponseTruncated = (content: string): boolean => {
    if (!content || content.length < 500) return false;
    
    const trimmed = content.trim();
    
    // Check for obvious truncation indicators
    const truncationPatterns = [
      /\.\.\.$/,                    // Ends with ...
      /…$/,                          // Ends with ellipsis character
      /\.\.$/,                       // Ends with ..
      /[a-z]$/i,                     // Ends with a letter (mid-word)
      /,$/,                          // Ends with comma
      /:$/,                          // Ends with colon
      /\d+\.$/,                      // Ends with number and period (numbered list)
      /bytes truncated/i,            // Explicit truncation message
      /content truncated/i,
      /\[truncated\]/i,
    ];
    
    for (const pattern of truncationPatterns) {
      if (pattern.test(trimmed)) return true;
    }
    
    // Check if response is very long (might have more)
    if (content.length > 4000) return true;
    
    return false;
  };

  // Get a fun Continue button text
  const getContinueButtonText = (): string => {
    const options = [
      '🐷 Keep Going!',
      '🐷 Oink for More!',
      '📖 Tell me more!',
      '🚀 Don\'t stop now!',
      '✨ Continue the magic!',
      '🎯 What else?',
      '💡 More wisdom please!',
      '🔥 Keep it coming!',
    ];
    return options[Math.floor(Math.random() * options.length)];
  };

  // Handle Continue button click
  const handleContinue = async (_messageId: string) => {
    if (isLoading) return;
    
    const continueMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: 'Please continue where you left off.',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, continueMessage]);
    setIsLoading(true);

    const statusMessageId = (Date.now() + 1).toString();
    const statusMessage: Message = {
      id: statusMessageId,
      role: 'assistant',
      content: '🐷 Continuing...',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, statusMessage]);

    try {
      const response = await fetch(`${API_URL}/moe-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Please continue where you left off. Pick up exactly where you stopped.',
          task_id: currentTaskId,
          conversation_id: currentConversationId,
          thought_id: currentThoughtId,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          files: [],
          dont_train_on_me: dontTrainOnMe,
          user_id: user?.id,
          was_continued: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === statusMessageId
            ? {
                ...msg,
                content: data.message,
                moeMetadata: data.moeMetadata,
                isStreaming: false,
              }
            : msg
        )
      );
      
      if (autoSpeak && data.message) {
        setTimeout(() => {
          speakText(data.message);
        }, 100);
      }

      setIsLoading(false);
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

  return (
    <div className={`app ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Sidebar */}
      <div className={`sidebar ${showSidebar ? 'show' : 'hide'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">M</div>
            <h1>Morgus</h1>
          </div>
          <button className="new-chat-button" onClick={async () => {
            // Create new conversation
            try {
              const { data, error } = await supabase
                .from('conversations')
                .insert({
                  title: 'New Chat',
                  thought_id: currentThoughtId,
                  created_at: new Date().toISOString(),
                })
                .select()
                .single();
              
              if (!error && data) {
                setCurrentConversationId(data.id);
                setMessages([{
                  id: '1',
                  role: 'assistant',
                  content: '👋 Hello! I\'m **Morgus**, your autonomous AI agent. What would you like to accomplish today?',
                  timestamp: new Date(),
                }]);
                setCurrentTaskId(null);
                await loadTasks(); // Reload to show new conversation
              }
            } catch (error) {
              console.error('Failed to create conversation:', error);
            }
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
          <h3>💬 Recent Chats</h3>
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`task-item ${currentTaskId === task.id ? 'active' : ''}`}
              onClick={async () => {
                setCurrentTaskId(task.id);
                setCurrentConversationId(task.id);
                // Load conversation messages
                const { data, error } = await supabase
                  .from('conversation_messages')
                  .select('*')
                  .eq('conversation_id', task.id)
                  .order('created_at', { ascending: true });
                
                if (!error && data) {
                  const loadedMessages: Message[] = data.map((msg: any) => ({
                    id: msg.id,
                    role: msg.role,
                    content: msg.content,
                    timestamp: new Date(msg.created_at),
                    moeMetadata: msg.metadata?.moeMetadata,
                  }));
                  setMessages(loadedMessages.length > 0 ? loadedMessages : [{
                    id: '1',
                    role: 'assistant',
                    content: '👋 Hello! I\'m **Morgus**, your autonomous AI agent. What would you like to accomplish today?',
                    timestamp: new Date(),
                  }]);
                }
              }}
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
          <MOELeaderboard />
          <button 
            className="settings-toggle"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            ⚙️
          </button>
          <button 
            className="dark-mode-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button 
            className={`training-toggle-mini ${dontTrainOnMe ? 'active' : ''}`}
            onClick={() => handleDontTrainToggle(!dontTrainOnMe)}
            title={dontTrainOnMe ? 'Training Disabled - Click to Enable' : 'Training Enabled - Click to Disable'}
          >
            🐍
          </button>
          <div className="status-indicator">
            <span className="status-dot online"></span>
            Online
          </div>
        </div>

        <div className="messages-container">
          {messages.map((message) => (
            <div key={message.id} id={`msg-${message.id}`} className={`message ${message.role}`}>
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
                  {/* Browser View iframe */}
                  {message.role === 'assistant' && message.content.includes('browserbase.com/devtools-fullscreen') && (() => {
                    const urlMatch = message.content.match(/https:\/\/www\.browserbase\.com\/devtools-fullscreen\/[^)\s]+/);
                    if (urlMatch) {
                      return <BrowserView liveViewUrl={urlMatch[0]} />;
                    }
                    return null;
                  })()}
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
                  {/* Base64 Document Download */}
                  {message.role === 'assistant' && (() => {
                    // Detect base64 encoded documents in the response
                    const base64Patterns = [
                      // Pattern for "Base64 encoded document: <base64>"
                      /(?:base64[\s_-]*(?:encoded)?[\s_-]*(?:document|file|content)?[:\s]+)([A-Za-z0-9+/=]{100,})/gi,
                      // Pattern for code blocks with base64
                      /```(?:base64)?\n?([A-Za-z0-9+/=]{100,})\n?```/g,
                      // Pattern for data URLs
                      /data:(?:application\/(?:pdf|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|msword)|text\/plain);base64,([A-Za-z0-9+/=]+)/g,
                    ];
                    
                    const documents: { base64: string; type: string; name: string }[] = [];
                    
                    for (const pattern of base64Patterns) {
                      const matches = message.content.matchAll(pattern);
                      for (const match of matches) {
                        const base64 = match[1] || match[0];
                        if (base64.length > 100) {
                          // Try to detect document type from base64 header
                          let type = 'application/octet-stream';
                          let ext = 'bin';
                          let name = 'document';
                          
                          // Check for common file signatures
                          try {
                            const decoded = atob(base64.substring(0, 20));
                            if (decoded.startsWith('PK')) {
                              // DOCX, XLSX, PPTX are all ZIP-based
                              if (message.content.toLowerCase().includes('docx') || message.content.toLowerCase().includes('word')) {
                                type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                                ext = 'docx';
                                name = 'document';
                              } else if (message.content.toLowerCase().includes('xlsx') || message.content.toLowerCase().includes('excel')) {
                                type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                                ext = 'xlsx';
                                name = 'spreadsheet';
                              } else {
                                type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                                ext = 'docx';
                                name = 'document';
                              }
                            } else if (decoded.startsWith('%PDF')) {
                              type = 'application/pdf';
                              ext = 'pdf';
                              name = 'document';
                            }
                          } catch {
                            // If decoding fails, keep defaults
                          }
                          
                          documents.push({ base64, type, name: `morgus-${name}-${Date.now()}.${ext}` });
                        }
                      }
                    }
                    
                    if (documents.length === 0) return null;
                    
                    return (
                      <div className="document-download-buttons">
                        <div className="document-download-header">📄 Documents Ready for Download</div>
                        {documents.map((doc, i) => (
                          <button
                            key={i}
                            className="download-document-btn"
                            onClick={() => {
                              try {
                                const byteCharacters = atob(doc.base64);
                                const byteNumbers = new Array(byteCharacters.length);
                                for (let j = 0; j < byteCharacters.length; j++) {
                                  byteNumbers[j] = byteCharacters.charCodeAt(j);
                                }
                                const byteArray = new Uint8Array(byteNumbers);
                                const blob = new Blob([byteArray], { type: doc.type });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = doc.name;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                              } catch (err) {
                                console.error('Failed to download document:', err);
                                alert('Failed to decode document. The base64 data may be corrupted.');
                              }
                            }}
                            title="Download document"
                          >
                            📥 Download {doc.name.includes('.docx') ? 'Word Document' : doc.name.includes('.pdf') ? 'PDF' : doc.name.includes('.xlsx') ? 'Excel' : 'Document'} {documents.length > 1 ? `${i + 1}` : ''}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
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
                      {message.content.includes('<details>') && (
                        <button 
                          className="icon-button debug-toggle" 
                          onClick={() => {
                            const details = document.querySelector(`#msg-${message.id} details`);
                            if (details) {
                              (details as HTMLDetailsElement).open = !(details as HTMLDetailsElement).open;
                            }
                          }}
                          title="Toggle debug info"
                        >
                          🔧
                        </button>
                      )}
                    </div>
                  )}
                  {/* Continue Button for truncated responses */}
                  {message.role === 'assistant' && !message.isStreaming && isResponseTruncated(message.content) && (
                    <button 
                      className="continue-button"
                      onClick={() => handleContinue(message.id)}
                      disabled={isLoading}
                    >
                      {getContinueButtonText()}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && <ThinkingIndicator toolName={currentTool} isDeepResearch={deepResearchMode} />}
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
              className={`deep-research-toggle ${deepResearchMode ? 'active' : ''}`}
              onClick={() => {
                setDeepResearchMode(!deepResearchMode);
                if (!deepResearchMode) {
                  setShowResearchPanel(true);
                }
              }}
              disabled={isLoading}
              title={deepResearchMode ? 'Deep Research Mode ON - Click to disable' : 'Enable Deep Research Mode'}
            >
              🧠
            </button>
            <button
              className="attach-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Attach files"
            >
              📎
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                // Don't submit if autocomplete is visible and Enter is pressed
                if (showMorgyAutocomplete && e.key === 'Enter') {
                  return;
                }
                handleKeyPress(e);
              }}
              placeholder="Message Morgus..."
              rows={1}
              disabled={isLoading}
            />
            <MorgyAutocomplete
              inputValue={input}
              onSelect={(newValue) => {
                setInput(newValue);
                textareaRef.current?.focus();
              }}
              inputRef={textareaRef}
              isVisible={showMorgyAutocomplete}
              onVisibilityChange={setShowMorgyAutocomplete}
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

      {/* Morgy Pen - shows when sidebar is collapsed */}
      <MorgyPen
        isVisible={!showSidebar}
        onActivateMorgy={(id) => setActiveMorgys(prev => [...prev, id])}
        onDeactivateMorgy={(id) => setActiveMorgys(prev => prev.filter(m => m !== id))}
        activeMorgys={activeMorgys}
        onMentionMorgy={(handle, _fullName) => {
          // Insert the @ mention into the chat input
          setInput(prev => prev ? `${prev} ${handle} ` : `${handle} `);
        }}
      />

      {/* Deep Research Panel */}
      <DeepResearchPanel
        sessionId={currentResearchSessionId}
        isActive={showResearchPanel}
        onClose={() => setShowResearchPanel(false)}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        darkMode={darkMode}
        onDarkModeChange={setDarkMode}
        dontTrainOnMe={dontTrainOnMe}
        onDontTrainChange={handleDontTrainToggle}
        user={user}
        profile={profile}
        onLogout={async () => {
          console.log('[App] Logout handler called');
          try {
            await signOut();
            console.log('[App] signOut completed');
          } catch (e) {
            console.error('[App] signOut error:', e);
          }
          setShowSettings(false);
          // Force a full page reload to clear all state
          console.log('[App] Redirecting to /login');
          window.location.href = '/login';
        }}
        onNavigate={(path) => {
          setShowSettings(false);
          navigate(path);
        }}
      />
    </div>
  );
}

export default App;
