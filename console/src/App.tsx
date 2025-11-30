import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import './App.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          task_id: currentTaskId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || 'I received your message and I\'m working on it!',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setCurrentTaskId(data.task_id);
      loadTasks();
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ I encountered an error: ${error.message}\n\nPlease make sure the OpenAI API key is configured. You can add it by running:\n\`\`\`bash\ncd worker && npx wrangler secret put OPENAI_API_KEY\n\`\`\``,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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

  const loadTask = async (taskId: string) => {
    setCurrentTaskId(taskId);
    const { data, error } = await supabase
      .from('task_steps')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true});

    if (!error && data) {
      const taskMessages: Message[] = data.flatMap((step: any) => [
        {
          id: `${step.id}-user`,
          role: 'user' as const,
          content: step.description,
          timestamp: new Date(step.created_at),
        },
        {
          id: `${step.id}-assistant`,
          role: 'assistant' as const,
          content: step.result || 'Processing...',
          timestamp: new Date(step.created_at),
        },
      ]);
      setMessages(taskMessages);
    }
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <div className={`sidebar ${showSidebar ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">M</div>
            <h1>Morgus</h1>
          </div>
          <button
            className="new-chat-btn"
            onClick={() => {
              setMessages([
                {
                  id: '1',
                  role: 'assistant',
                  content: '👋 Hello! I\'m **Morgus**, your autonomous AI agent. What would you like to accomplish today?',
                  timestamp: new Date(),
                },
              ]);
              setCurrentTaskId(null);
            }}
          >
            <span>+</span> New Chat
          </button>
        </div>

        <div className="task-list">
          <h3>Recent Tasks</h3>
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`task-item ${currentTaskId === task.id ? 'active' : ''}`}
              onClick={() => loadTask(task.id)}
            >
              <div className="task-title">{task.description.substring(0, 50)}...</div>
              <div className="task-status">{task.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="main-content">
        <div className="chat-header">
          <button className="sidebar-toggle" onClick={() => setShowSidebar(!showSidebar)}>
            ☰
          </button>
          <h2>Morgus AI Agent</h2>
          <div className="status-indicator">
            <span className="status-dot"></span>
            Online
          </div>
        </div>

        <div className="messages-container">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className="message-avatar">
                {message.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-text">
                  {message.content.split('\n').map((line, i) => {
                    // Handle bold text
                    const parts = line.split(/\*\*(.*?)\*\*/g);
                    return (
                      <p key={i}>
                        {parts.map((part, j) =>
                          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                        )}
                      </p>
                    );
                  })}
                </div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="thinking-light-show">
              <div className="light-show-container">
                <div className="light-show-bg"></div>
                <div className="light-orb"></div>
                <div className="light-orb"></div>
                <div className="light-orb"></div>
                <div className="light-orb"></div>
                <div className="light-orb"></div>
              </div>
              <div className="thinking-text">✨ Morgus is thinking...</div>
              <div className="rainbow-wave"></div>
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
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="send-button"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10L18 2L10 18L8 11L2 10Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
