import { useState } from 'react';
import './MOEHeader.css';

interface MOEMetadata {
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
    status?: 'responded' | 'too_slow'; // Status of the model in the competition
  }>;
  tooSlowModels?: string[]; // Models that were too slow to respond
  nashExplanation: string;
  totalLatency: number;
  totalCost: number;
}

interface MOEHeaderProps {
  metadata: MOEMetadata;
}

export function MOEHeader({ metadata }: MOEHeaderProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  // Separate responded and too-slow models
  const respondedModels = metadata.allModels.filter(m => m.status !== 'too_slow');
  const tooSlowModels = metadata.allModels.filter(m => m.status === 'too_slow');
  
  // Sort responded models by score (descending)
  const sortedModels = [...respondedModels].sort((a, b) => b.score - a.score);

  // Get model display name (remove provider prefix)
  const getModelName = (fullModel: string): string => {
    const parts = fullModel.split('/');
    const name = parts[parts.length - 1].replace(':free', '');
    
    // Friendly names
    const nameMap: Record<string, string> = {
      'mistral-7b-instruct': 'Mistral 7B',
      'grok-4.1-fast': 'Grok Fast',
      'kat-coder-pro-v1': 'KAT-Coder',
      'qwen3-4b': 'Qwen3 4B',
      'gemini-2.0-flash-exp': 'Gemini Flash',
      'claude-3-haiku': 'Claude Haiku',
      'gpt-4o-mini': 'GPT-4o Mini',
    };
    
    return nameMap[name] || name;
  };

  // Format latency
  const formatLatency = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Get medal emoji for ranking
  const getMedal = (index: number): string => {
    if (index === 0) return '🏆';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return '';
  };

  return (
    <div className="moe-header">
      <div className="moe-title">
        🎯 MOE Competition
        <span className="moe-responded-count">
          {respondedModels.length} responded{tooSlowModels.length > 0 ? `, ${tooSlowModels.length} 🐢` : ''}
        </span>
      </div>

      <div className="moe-models">
        {/* Responded models */}
        {sortedModels.map((model, index) => {
          const isWinner = model.model === metadata.winner.model;
          const scorePercent = (model.score * 100).toFixed(1);
          
          return (
            <div
              key={model.model}
              className={`moe-model-card ${isWinner ? 'winner' : ''}`}
            >
              <div className="moe-model-name">
                {getMedal(index)} {getModelName(model.model)}
              </div>
              <div className="moe-model-score">
                {scorePercent}%
              </div>
              <div className="moe-model-stats">
                <div>{formatLatency(model.latency)}</div>
                <div>{model.tokens} tokens</div>
              </div>
            </div>
          );
        })}
        
        {/* Too slow models with turtle emoji */}
        {tooSlowModels.map((model) => (
          <div
            key={model.model}
            className="moe-model-card too-slow"
          >
            <div className="moe-model-name">
              🐢 {getModelName(model.model)}
            </div>
            <div className="moe-model-score too-slow-badge">
              TOO SLOW
            </div>
            <div className="moe-model-stats">
              <div>Timed out</div>
            </div>
          </div>
        ))}
      </div>

      <div className="moe-footer">
        <span>
          Total: {formatLatency(metadata.totalLatency)} | ${metadata.totalCost.toFixed(6)}
        </span>
        <button
          className="moe-expand-btn"
          onClick={() => setShowExplanation(!showExplanation)}
        >
          {showExplanation ? 'Hide' : 'Why?'}
        </button>
      </div>

      {showExplanation && (
        <div className="moe-explanation">
          {metadata.nashExplanation}
        </div>
      )}
    </div>
  );
}
