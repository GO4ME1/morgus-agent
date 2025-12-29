import { useState, useEffect, useRef } from 'react';
import './ThinkingIndicator.css';

interface ThinkingIndicatorProps {
  toolName?: string;
  isDeepResearch?: boolean;
  researchStep?: string;
}

// Dynamic thinking messages that rotate
const thinkingMessages = [
  'Thinking',
  'Analyzing your question',
  'Processing request',
  'Working on it',
  'Considering options',
  'Formulating response',
];

const researchMessages = [
  'Deep diving',
  'Researching sources',
  'Gathering evidence',
  'Cross-referencing data',
  'Analyzing findings',
  'Synthesizing insights',
  'Validating information',
  'Building comprehensive answer',
];

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ 
  toolName, 
  isDeepResearch = false,
  researchStep 
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const startTimeRef = useRef<number>(0);

  // Update elapsed time every second
  useEffect(() => {
    startTimeRef.current = Date.now();
    setElapsedSeconds(0);
    
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Rotate messages every 4 seconds
  useEffect(() => {
    const messages = isDeepResearch ? researchMessages : thinkingMessages;
    const messageTimer = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 4000);

    return () => clearInterval(messageTimer);
  }, [isDeepResearch]);

  // Format elapsed time
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Get the display message
  const getDisplayMessage = (): string => {
    // If there's a specific tool being used, show that
    if (toolName) {
      const toolMessages: Record<string, string> = {
        'search_web': 'Searching the web',
        'fetch_url': 'Fetching page content',
        'execute_code': 'Executing code',
        'browse_web': 'Browsing website',
        'create_chart': 'Creating chart',
        'generate_image': 'Generating image',
        'generate_3d_model': 'Creating 3D model',
        'text_to_speech': 'Generating voice',
        'search_images': 'Searching images',
        'get_current_time': 'Getting current time',
        'think': 'Deep thinking',
        'rag_search': 'Searching knowledge base',
      };
      return toolMessages[toolName] || `Using ${toolName}`;
    }

    // If there's a research step, show that
    if (researchStep) {
      return researchStep;
    }

    // Otherwise rotate through messages
    const messages = isDeepResearch ? researchMessages : thinkingMessages;
    return messages[currentMessageIndex];
  };

  // Get encouraging message for long waits
  const getEncouragingMessage = (): string | null => {
    if (elapsedSeconds >= 120) {
      return "Still working hard on this complex request...";
    }
    if (elapsedSeconds >= 60) {
      return "Taking a bit longer, but making progress...";
    }
    if (elapsedSeconds >= 30) {
      return "Working through the details...";
    }
    return null;
  };

  const encouragingMessage = getEncouragingMessage();

  return (
    <div className={`thinking-indicator ${isDeepResearch ? 'deep-research' : ''}`}>
      <div className="thinking-main">
        <div className="thinking-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <div className="thinking-content">
          <span className="thinking-text">{getDisplayMessage()}</span>
          <span className="thinking-time">{formatTime(elapsedSeconds)}</span>
        </div>
        <div className="thinking-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
      {encouragingMessage && (
        <div className="thinking-encouragement">
          {encouragingMessage}
        </div>
      )}
      {isDeepResearch && (
        <div className="thinking-research-badge">
          🧠 Deep Research Mode
        </div>
      )}
    </div>
  );
};
