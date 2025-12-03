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
  }>;
  nashExplanation: string;
  totalLatency: number;
  totalCost: number;
}

interface MOEHeaderProps {
  metadata: MOEMetadata;
}

export function MOEHeader({ metadata }: MOEHeaderProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  // Sort models by score (descending)
  const sortedModels = [...metadata.allModels].sort((a, b) => b.score - a.score);

  // Get model display name (remove provider prefix)
  const getModelName = (fullModel: string): string => {
    const parts = fullModel.split('/');
    const name = parts[parts.length - 1].replace(':free', '');
    
    // Friendly names
    const nameMap: Record<string, string> = {
      'mistral-7b-instruct': 'Mistral 7B',
      'grok-4.1-fast': 'Grok Fast',
      'kat-coder-pro-v1': 'KAT-Coder',
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
      </div>

      <div className="moe-models">
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
