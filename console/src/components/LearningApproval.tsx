import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/api-client';

interface Learning {
  id: string;
  title: string;
  learning: string;
  category?: string;
  domain?: string;
  learning_type?: string;
  confidence_score: number;
  proposed_at: string;
  times_applied: number;
  feedback_score?: number;
}

export const LearningApproval: React.FC = () => {
  const [platformLearnings, setPlatformLearnings] = useState<Learning[]>([]);
  const [morgyLearnings, setMorgyLearnings] = useState<Learning[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'platform' | 'morgy'>('platform');

  useEffect(() => {
    loadPendingLearnings();
  }, []);

  const loadPendingLearnings = async () => {
    try {
      setLoading(true);
      
      // Load pending platform learnings
      const platformRes = await apiClient.get('/api/memory/platform/pending');
      setPlatformLearnings(platformRes.data.learnings || []);

      // Load pending Morgy learnings
      const morgyRes = await apiClient.get('/api/memory/morgy/pending');
      setMorgyLearnings(morgyRes.data.learnings || []);
    } catch {
      console.error('Error loading pending learnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveLearning = async (id: string, type: 'platform' | 'morgy') => {
    try {
      if (type === 'platform') {
        await apiClient.post(`/api/memory/platform/${id}/approve`);
        setPlatformLearnings(prev => prev.filter(l => l.id !== id));
      } else {
        await apiClient.post(`/api/memory/morgy/${id}/approve`);
        setMorgyLearnings(prev => prev.filter(l => l.id !== id));
      }
    } catch {
      console.error('Error approving learning:', error);
      alert('Failed to approve learning');
    }
  };

  const rejectLearning = async (id: string, type: 'platform' | 'morgy') => {
    const reason = prompt('Why are you rejecting this learning? (optional)');
    
    try {
      if (type === 'platform') {
        await apiClient.post(`/api/memory/platform/${id}/reject`, { reason });
        setPlatformLearnings(prev => prev.filter(l => l.id !== id));
      } else {
        await apiClient.post(`/api/memory/morgy/${id}/reject`, { reason });
        setMorgyLearnings(prev => prev.filter(l => l.id !== id));
      }
    } catch {
      console.error('Error rejecting learning:', error);
      alert('Failed to reject learning');
    }
  };

  const renderLearning = (learning: Learning, type: 'platform' | 'morgy') => (
    <div key={learning.id} className="border border-gray-200 rounded-lg p-4 mb-4 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{learning.title}</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
            {learning.category || learning.learning_type || 'general'}
          </span>
          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
            {Math.round(learning.confidence_score * 100)}% confidence
          </span>
        </div>
      </div>

      <p className="text-gray-700 mb-3">{learning.learning}</p>

      {learning.domain && (
        <p className="text-sm text-gray-600 mb-2">
          <strong>Domain:</strong> {learning.domain}
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <span>Applied {learning.times_applied} times</span>
        {learning.feedback_score !== undefined && (
          <span>
            Feedback: {Math.round(learning.feedback_score * 100)}% positive
          </span>
        )}
        <span>Proposed {new Date(learning.proposed_at).toLocaleDateString()}</span>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => approveLearning(learning.id, type)}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium transition"
        >
          ✓ Approve
        </button>
        <button
          onClick={() => rejectLearning(learning.id, type)}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition"
        >
          ✗ Reject
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const totalPending = platformLearnings.length + morgyLearnings.length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Learning Approval
        </h1>
        <p className="text-gray-600">
          Review and approve learnings proposed by the system. Approved learnings will be used to improve future interactions.
        </p>
      </div>

      {totalPending === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            All caught up!
          </h2>
          <p className="text-gray-600">
            No pending learnings to review right now.
          </p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex space-x-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('platform')}
              className={`pb-2 px-4 font-medium transition ${
                activeTab === 'platform'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Platform Learnings ({platformLearnings.length})
            </button>
            <button
              onClick={() => setActiveTab('morgy')}
              className={`pb-2 px-4 font-medium transition ${
                activeTab === 'morgy'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Morgy Learnings ({morgyLearnings.length})
            </button>
          </div>

          {/* Content */}
          <div>
            {activeTab === 'platform' && (
              <>
                {platformLearnings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No pending platform learnings
                  </div>
                ) : (
                  platformLearnings.map(learning => renderLearning(learning, 'platform'))
                )}
              </>
            )}

            {activeTab === 'morgy' && (
              <>
                {morgyLearnings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No pending Morgy learnings
                  </div>
                ) : (
                  morgyLearnings.map(learning => renderLearning(learning, 'morgy'))
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
