import { useState, useEffect } from 'react';
import { X, Trophy } from 'lucide-react';

interface ModelStat {
  model_name: string;
  win_rate: number;
  total_competitions: number;
}

interface MOEModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MOEModal({ isOpen, onClose }: MOEModalProps) {
  const [stats, setStats] = useState<ModelStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        'https://morgus-orchestrator.morgan-426.workers.dev/api/stats/leaderboard'
      );
      const data = await response.json();
      setStats(data.stats || []);
    } catch (err) {
      setError('Failed to load rankings');
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getMedalEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return index + 1;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[10000] p-5"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-200 rounded-3xl p-7 max-w-lg w-full max-h-[80vh] overflow-y-auto relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full w-11 h-11 flex items-center justify-center transition-all hover:scale-110"
        >
          <X className="w-6 h-6 text-gray-800" />
        </button>

        <h2 className="text-3xl font-bold mb-5 bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
          <Trophy className="w-8 h-8 text-amber-500" />
          Model Rankings
        </h2>

        {loading && (
          <div className="text-center py-8 text-gray-700">
            Loading rankings...
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && stats.length === 0 && (
          <div className="text-center py-8 text-gray-700">
            No rankings available yet
          </div>
        )}

        {!loading && !error && stats.length > 0 && (
          <div className="space-y-2">
            {stats.slice(0, 10).map((stat, index) => (
              <div
                key={stat.model_name}
                className="bg-gray-100 rounded-xl p-3 flex items-center gap-3 hover:bg-gray-200 transition-colors"
              >
                <span className="text-2xl min-w-[40px] text-center">
                  {getMedalEmoji(index)}
                </span>
                <div className="flex-1">
                  <div className="font-bold text-gray-900">
                    {stat.model_name.split('/').pop()}
                  </div>
                  <div className="text-xs text-gray-600">
                    {stat.win_rate.toFixed(0)}% wins • {stat.total_competitions} competitions
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
