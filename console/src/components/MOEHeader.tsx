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
    status?: 'responded' | 'too_slow';  // New field for tracking slow models
  }>;
  tooSlowModels?: string[];  // List of models that were too slow
  nashExplanation: string;
  totalLatency: number;
  totalCost: number;
}

interface MOEHeaderProps {
  metadata: MOEMetadata;
}

export function MOEHeader({ metadata }: MOEHeaderProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  // Sort models: responded models by score (descending), then too-slow models at the end
  const sortedModels = [...metadata.allModels].sort((a, b) => {
    // Too slow models go to the end
    if (a.status === 'too_slow' && b.status !== 'too_slow') return 1;
    if (b.status === 'too_slow' && a.status !== 'too_slow') return -1;
    // Both too slow - alphabetical
    if (a.status === 'too_slow' && b.status === 'too_slow') return a.model.localeCompare(b.model);
    // Both responded - sort by score
    return b.score - a.score;
  });

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
      'llama-3.3-8b-instruct': 'Llama 3.3',
      'deepseek-r1-distill-qwen-32b': 'DeepSeek R1',
      'gemini-2.0-flash-exp': 'Gemini Flash',
      'gpt-4o-mini': 'GPT-4o Mini',
      'claude-3-5-haiku-20241022': 'Claude Haiku',
    };
    
    return nameMap[name] || name;
  };

  // Format latency
  const formatLatency = (ms: number): string => {
    if (ms < 0) return '⏱️ Too Slow';  // -1 indicates too slow
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Get medal emoji for ranking (only for responded models)
  const getMedal = (index: number, status?: string): string => {
    if (status === 'too_slow') return '🐢';  // Turtle for slow models
    if (index === 0) return '🏆';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return '';
  };

  // Count responded vs too slow
  const respondedCount = sortedModels.filter(m => m.status !== 'too_slow').length;
  const tooSlowCount = sortedModels.filter(m => m.status === 'too_slow').length;

  return (
    <div className="moe-header">
      <div className="moe-title">
        🎯 MOE Competition
        <span className="moe-model-count">
          {respondedCount} responded{tooSlowCount > 0 ? `, ${tooSlowCount} too slow` : ''}
        </span>
      </div>

      <div className="moe-models">
        {sortedModels.map((model) => {
          const isWinner = model.model === metadata.winner.model;
          const isTooSlow = model.status === 'too_slow' || model.latency < 0;
          const scorePercent = isTooSlow ? '—' : (model.score * 100).toFixed(1);
          const respondedIndex = isTooSlow ? -1 : sortedModels.filter(m => m.status !== 'too_slow').indexOf(model);
          
          return (
            <div
              key={model.model}
              className={`moe-model-card ${isWinner ? 'winner' : ''} ${isTooSlow ? 'too-slow' : ''}`}
            >
              <div className="moe-model-name">
                {getMedal(respondedIndex, model.status)} {getModelName(model.model)}
              </div>
              {isTooSlow ? (
                <div className="moe-model-too-slow">
                  <span className="too-slow-badge">TOO SLOW</span>
                </div>
              ) : (
                <>
                  <div className="moe-model-score">
                    {scorePercent}%
                  </div>
                  <div className="moe-model-stats">
                    <div>{formatLatency(model.latency)}</div>
                    <div>{model.tokens} tokens</div>
                  </div>
                </>
              )}
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
