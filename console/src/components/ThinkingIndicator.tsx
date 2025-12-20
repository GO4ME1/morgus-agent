import React from 'react';
import './ThinkingIndicator.css';

interface ThinkingIndicatorProps {
  toolName?: string;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ toolName }) => {
  const getToolMessage = (tool?: string) => {
    if (!tool) return 'thinking';
    
    const messages: Record<string, string> = {
      'search_web': 'searching web',
      'fetch_url': 'fetching page',
      'execute_code': 'executing code',
      'browse_web': 'browsing',
      'create_chart': 'creating chart',
      'generate_image': 'generating image',
      'generate_3d_model': 'creating 3D model',
      'text_to_speech': 'generating voice',
      'search_images': 'searching images',
      'get_current_time': 'getting time',
      'think': 'thinking',
    };
    
    return messages[tool] || tool;
  };

  return (
    <div className="thinking-indicator">
      <span className="thinking-text">{getToolMessage(toolName)}</span>
      <div className="thinking-dots">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
    </div>
  );
};
