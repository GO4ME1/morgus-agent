import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import './App.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input;
    setInput('');
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
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          task_id: currentTaskId,
          stream: true,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const statusUpdates: string[] = [];
      let finalResponse = '';

      if (reader) {
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
                
                if (data.type === 'status' || data.type === 'tool_call' || data.type === 'tool_result') {
                  statusUpdates.push(data.content);
                  setMessages((prev) => prev.map(msg => 
                    msg.id === statusMessageId 
                      ? { ...msg, content: statusUpdates.join('\\n') }
                      : msg
                  ));
                } else if (data.type === 'response') {
                  finalResponse = data.content;
                } else if (data.type === 'complete') {
                  if (finalResponse) {
                    setMessages((prev) => prev.map(msg => 
                      msg.id === statusMessageId 
                        ? { ...msg, content: finalResponse, isStreaming: false }
                        : msg
                    ));
                  }
                }
              } catch {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }

      loadTasks();
    } catch (error: unknown) {
      console.error('Error:', error);
      setMessages((prev) => prev.map(msg => 
        msg.id === statusMessageId 
          ? { ...msg, content: `❌ Error: ${error.message}`, isStreaming: false }
          : msg
      ));
    } finally {
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
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <div className={`sidebar ${showSidebar ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">M</div>
            <h1 className="logo-text">Morgus</h1>
          </div>
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span>Online</span>
          </div>
        </div>

        <button className="new-chat-btn" onClick={() => {
          setMessages([{
            id: '1',
            role: 'assistant',
            content: '👋 Hello! I\'m **Morgus**, your autonomous AI agent. I can help you with:\n\n• Research and information gathering\n• Planning complex projects\n• Writing and executing code\n• Deploying applications\n• And much more!\n\nWhat would you like to accomplish today?',
            timestamp: new Date(),
          }]);
          setCurrentTaskId(null);
        }}>
          + New Chat
        </button>

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
                </div>
                <div className="message-time">{formatTime(message.timestamp)}</div>
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
          <div className="input-wrapper">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message Morgus..."
              rows={1}
              disabled={isLoading}
            />
            <button
              className="send-button"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
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
