import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface Morgy {
  id: string;
  name: string;
  description: string;
  avatar_config: any;
  is_starter: boolean;
  category: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface MorgyChatProps {
  morgyId?: string;
  onMorgyChange?: (morgyId: string) => void;
}

export function MorgyChat({ morgyId: initialMorgyId, onMorgyChange }: MorgyChatProps) {
  const [morgys, setMorgys] = useState<Morgy[]>([]);
  const [selectedMorgy, setSelectedMorgy] = useState<Morgy | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMorgySelector, setShowMorgySelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load starter Morgys on mount
  useEffect(() => {
    loadStarterMorgys();
  }, []);

  // Load selected Morgy when ID changes
  useEffect(() => {
    if (initialMorgyId) {
      loadMorgy(initialMorgyId);
    }
  }, [initialMorgyId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadStarterMorgys = async () => {
    try {
      const response = await fetch('/api/morgys/starters');
      const data = await response.json();
      setMorgys(data);
      
      // Auto-select Bill if no morgy selected
      if (!selectedMorgy && data.length > 0) {
        const bill = data.find((m: Morgy) => m.name === 'Bill') || data[0];
        setSelectedMorgy(bill);
        createConversation(bill.id);
      }
    } catch (error) {
      console.error('Failed to load starter Morgys:', error);
    }
  };

  const loadMorgy = async (morgyId: string) => {
    try {
      const response = await fetch(`/api/morgys/${morgyId}`, {
        headers: {
          'x-user-id': (await supabase.auth.getUser()).data.user?.id || ''
        }
      });
      const data = await response.json();
      setSelectedMorgy(data);
      createConversation(data.id);
    } catch (error) {
      console.error('Failed to load Morgy:', error);
    }
  };

  const createConversation = async (morgyId: string) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const response = await fetch(`/api/morgys/${morgyId}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({ title: 'New Conversation' })
      });
      const data = await response.json();
      setConversationId(data.id);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const selectMorgy = (morgy: Morgy) => {
    setSelectedMorgy(morgy);
    createConversation(morgy.id);
    setShowMorgySelector(false);
    if (onMorgyChange) {
      onMorgyChange(morgy.id);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversationId || !selectedMorgy) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message to UI
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Save user message
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          role: 'user',
          content: userMessage
        })
      });

      // Get AI response (this would integrate with your AI service)
      const aiResponse = await getAIResponse(selectedMorgy, userMessage, messages);

      // Save assistant message
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          role: 'assistant',
          content: aiResponse
        })
      });

      // Add assistant message to UI
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAIResponse = async (morgy: Morgy, userMessage: string, history: Message[]): Promise<string> => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      // Call the Morgy chat endpoint
      const response = await fetch(`/api/morgys/${morgy.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          message: userMessage,
          history: history.map(m => ({
            role: m.role,
            content: m.content
          })),
          mode: 'auto' // Let the engine decide
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('AI response error:', error);
      // Fallback to mock responses for demo
      if (morgy.name === 'Bill') {
        return getBillResponse(userMessage);
      } else if (morgy.name === 'Sally') {
        return getSallyResponse(userMessage);
      } else if (morgy.name === 'Professor Hogsworth') {
        return getHogsworthResponse(userMessage);
      }
      return "I'm here to help! How can I assist you today?";
    }
  };

  const getBillResponse = (_message: string): string => {
    const responses = [
      "OH MAN! This is so exciting! Let me tell you what we're going to do... 🚀",
      "YES! I love this question! Okay, here's my plan (Sally might want to refine it later, but hear me out!)...",
      "LET'S DO THIS! I've got about 17 ideas for you right now!",
      "This is HUGE! We're going to absolutely CRUSH this! Here's what I'm thinking...",
      "Okay okay okay, I'm getting excited just thinking about this! Let me share my vision..."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const getSallyResponse = (_message: string): string => {
    const responses = [
      "Love your enthusiasm! Let me help you turn that into a practical plan 😊",
      "Great question! Here's what actually works in the real world...",
      "I totally get where you're coming from. Let's refine this approach a bit...",
      "That's a solid start! Here's how we can make it even better...",
      "Bill would probably suggest doing everything at once 😅 But let's be strategic about this..."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const getHogsworthResponse = (_message: string): string => {
    const responses = [
      "Indeed, an excellent inquiry. Let me provide a comprehensive analysis...",
      "According to recent research, the data suggests...",
      "From an academic perspective, we must consider several factors...",
      "The literature on this topic indicates...",
      "Allow me to break this down systematically..."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const getAvatarImage = (morgy: Morgy) => {
    if (morgy.name === 'Bill') return '/avatars/bill.png';
    if (morgy.name === 'Sally') return '/avatars/sally.png';
    if (morgy.name === 'Professor Hogsworth') return '/avatars/professor.png';
    return null;
  };

  const getAvatarEmoji = (morgy: Morgy) => {
    if (morgy.name === 'Bill') return '💼';
    if (morgy.name === 'Sally') return '✨';
    if (morgy.name === 'Professor Hogsworth') return '🎓';
    return '🐷';
  };

  const getMorgyColor = (morgy: Morgy) => {
    if (morgy.name === 'Bill') return 'bg-green-100 text-green-800';  // Green for Bill
    if (morgy.name === 'Sally') return 'bg-pink-100 text-pink-800';   // Pink for Sally
    if (morgy.name === 'Professor Hogsworth') return 'bg-cyan-100 text-cyan-800';  // Cyan/blue for Professor
    return 'bg-gray-100 text-gray-800';
  };

  if (!selectedMorgy) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Loading Morgys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowMorgySelector(!showMorgySelector)}
            className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
          >
            {getAvatarImage(selectedMorgy) ? (
              <img 
                src={getAvatarImage(selectedMorgy)!} 
                alt={selectedMorgy.name}
                className="w-16 h-16 object-contain"
              />
            ) : (
              <div className="text-4xl">{getAvatarEmoji(selectedMorgy)}</div>
            )}
            <div className="text-left">
              <h2 className="text-xl font-bold text-gray-900">{selectedMorgy.name}</h2>
              <p className="text-sm text-gray-500">{selectedMorgy.description}</p>
            </div>
          </button>
          <button
            onClick={() => setShowMorgySelector(!showMorgySelector)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Morgy Selector Dropdown */}
        {showMorgySelector && (
          <div className="mt-4 space-y-2">
            {morgys.map((morgy) => (
              <button
                key={morgy.id}
                onClick={() => selectMorgy(morgy)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  selectedMorgy.id === morgy.id
                    ? getMorgyColor(morgy)
                    : 'hover:bg-gray-50'
                }`}
              >
                {getAvatarImage(morgy) ? (
                  <img 
                    src={getAvatarImage(morgy)!} 
                    alt={morgy.name}
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <div className="text-3xl">{getAvatarEmoji(morgy)}</div>
                )}
                <div className="text-left flex-1">
                  <h3 className="font-semibold">{morgy.name}</h3>
                  <p className="text-sm text-gray-600">{morgy.description}</p>
                </div>
                {selectedMorgy.id === morgy.id && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            {getAvatarImage(selectedMorgy) ? (
              <img 
                src={getAvatarImage(selectedMorgy)!} 
                alt={selectedMorgy.name}
                className="w-32 h-32 object-contain mx-auto mb-4"
              />
            ) : (
              <div className="text-6xl mb-4">{getAvatarEmoji(selectedMorgy)}</div>
            )}
            <h3 className="text-xl font-semibold mb-2">Chat with {selectedMorgy.name}</h3>
            <p className="text-sm">{selectedMorgy.description}</p>
            <div className="mt-6 space-y-2">
              <p className="text-xs font-semibold text-gray-700">Try asking:</p>
              {selectedMorgy.name === 'Bill' && (
                <>
                  <button
                    onClick={() => setInput("How can I grow my business?")}
                    className="block w-full text-left px-4 py-2 text-sm bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    "How can I grow my business?"
                  </button>
                  <button
                    onClick={() => setInput("Help me create a marketing strategy")}
                    className="block w-full text-left px-4 py-2 text-sm bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    "Help me create a marketing strategy"
                  </button>
                </>
              )}
              {selectedMorgy.name === 'Sally' && (
                <>
                  <button
                    onClick={() => setInput("What should I post on social media?")}
                    className="block w-full text-left px-4 py-2 text-sm bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"
                  >
                    "What should I post on social media?"
                  </button>
                  <button
                    onClick={() => setInput("Help me create a content calendar")}
                    className="block w-full text-left px-4 py-2 text-sm bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"
                  >
                    "Help me create a content calendar"
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : getMorgyColor(selectedMorgy)
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center space-x-2 mb-2">
                  {getAvatarImage(selectedMorgy) ? (
                    <img 
                      src={getAvatarImage(selectedMorgy)!} 
                      alt={selectedMorgy.name}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <span className="text-2xl">{getAvatarEmoji(selectedMorgy)}</span>
                  )}
                  <span className="font-semibold">{selectedMorgy.name}</span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className={`max-w-[70%] rounded-lg p-4 ${getMorgyColor(selectedMorgy)}`}>
              <div className="flex items-center space-x-2 mb-2">
                {getAvatarImage(selectedMorgy) ? (
                  <img 
                    src={getAvatarImage(selectedMorgy)!} 
                    alt={selectedMorgy.name}
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <span className="text-2xl">{getAvatarEmoji(selectedMorgy)}</span>
                )}
                <span className="font-semibold">{selectedMorgy.name}</span>
              </div>
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
            placeholder={`Chat with ${selectedMorgy.name}...`}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
