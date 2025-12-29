import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/api-client';

interface Learning {
  id: string;
  title: string;
  learning: string;
  category?: string;
  domain?: string;
  times_applied: number;
  success_rate?: number;
  feedback_score?: number;
  approved_at: string;
}

export const MemoryInsights: React.FC<{ morgyId?: string }> = ({ morgyId }) => {
  const [learnings, setLearnings] = useState<Learning[]>([]);
  const [stats, setStats] = useState<{ approved_learnings?: number; total_applications?: number; pending_learnings?: number; avg_feedback_score?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadLearnings();
    if (morgyId) {
      loadMorgyStats();
    }
  }, [morgyId]);

  const loadLearnings = async () => {
    try {
      setLoading(true);
      
      if (morgyId) {
        // Load Morgy-specific learnings
        const res = await apiClient.get(`/api/memory/morgy/${morgyId}/learnings`);
        setLearnings(res.data.learnings || []);
      } else {
        // Load top platform learnings
        const res = await apiClient.get('/api/memory/platform/top?limit=20');
        setLearnings(res.data.learnings || []);
      }
    } catch (error) {
      console.error('Error loading learnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMorgyStats = async () => {
    if (!morgyId) return;
    
    try {
      const res = await apiClient.get(`/api/memory/morgy/${morgyId}/stats`);
      setStats(res.data);
    } catch (error) {
      console.error('Error loading Morgy stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadLearnings();
      return;
    }

    try {
      setLoading(true);
      
      if (morgyId) {
        const res = await apiClient.post(`/api/memory/morgy/${morgyId}/search`, {
          query: searchQuery,
          limit: 10
        });
        setLearnings(res.data.learnings || []);
      } else {
        const res = await apiClient.post('/api/memory/platform/search', {
          query: searchQuery,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          limit: 10
        });
        setLearnings(res.data.learnings || []);
      }
    } catch (error) {
      console.error('Error searching learnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'all',
    'task_execution',
    'user_interaction',
    'model_selection',
    'error_handling',
    'optimization',
    'best_practice'
  ];

  if (loading && learnings.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {morgyId ? 'Morgy Memory Insights' : 'Platform Memory Insights'}
        </h1>
        <p className="text-gray-600">
          {morgyId 
            ? 'Explore what this Morgy has learned from conversations'
            : 'Explore what the platform has learned from all tasks'}
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-900">
              {stats.approved_learnings || 0}
            </div>
            <div className="text-sm text-blue-700">Approved Learnings</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-900">
              {stats.total_applications || 0}
            </div>
            <div className="text-sm text-green-700">Total Applications</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-900">
              {stats.pending_learnings || 0}
            </div>
            <div className="text-sm text-purple-700">Pending Review</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-900">
              {stats.avg_feedback_score ? `${Math.round(stats.avg_feedback_score * 100)}%` : 'N/A'}
            </div>
            <div className="text-sm text-yellow-700">Avg Feedback Score</div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex space-x-4 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search learnings..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            Search
          </button>
        </div>

        {!morgyId && (
          <div className="flex space-x-2 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  categoryFilter === cat
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Learnings List */}
      <div className="space-y-4">
        {learnings.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-6xl mb-4">🧠</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No learnings yet
            </h2>
            <p className="text-gray-600">
              {morgyId 
                ? 'This Morgy will learn from conversations over time'
                : 'The platform will learn from task executions over time'}
            </p>
          </div>
        ) : (
          learnings.map(learning => (
            <div key={learning.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{learning.title}</h3>
                <div className="flex items-center space-x-2">
                  {learning.category && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {learning.category}
                    </span>
                  )}
                  {learning.domain && (
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                      {learning.domain}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-gray-700 mb-3">{learning.learning}</p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Applied {learning.times_applied} times</span>
                {learning.success_rate !== undefined && (
                  <span>Success rate: {Math.round(learning.success_rate * 100)}%</span>
                )}
                {learning.feedback_score !== undefined && (
                  <span>Feedback: {Math.round(learning.feedback_score * 100)}% positive</span>
                )}
                <span>Approved {new Date(learning.approved_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
