import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Morgy {
  id: string;
  name: string;
  description: string;
  category: string;
  is_starter: boolean;
  is_public: boolean;
  avatar_url?: string;
  created_at: string;
  message_count?: number;
  last_used?: string;
}

export const MorgyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [morgys, setMorgys] = useState<Morgy[]>([]);
  const [starters, setStarters] = useState<Morgy[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'starters'>('my');

  useEffect(() => {
    loadMorgys();
    loadStarters();
  }, []);

  const loadMorgys = async () => {
    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const response = await fetch('/api/morgys', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load Morgys');
      
      const data = await response.json();
      setMorgys(data);
    } catch {
      console.error('Failed to load Morgys:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStarters = async () => {
    try {
      const response = await fetch('/api/morgys/starters');
      if (!response.ok) throw new Error('Failed to load starters');
      
      const data = await response.json();
      setStarters(data);
    } catch {
      console.error('Failed to load starters:', error);
    }
  };

  const handleDelete = async (morgyId: string) => {
    if (!confirm('Are you sure you want to delete this Morgy?')) return;

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const response = await fetch(`/api/morgys/${morgyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete Morgy');
      
      await loadMorgys();
    } catch {
      console.error('Failed to delete Morgy:', error);
      alert('Failed to delete Morgy');
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      business: '💼',
      marketing: '📢',
      development: '💻',
      design: '🎨',
      writing: '✍️',
      research: '🔬',
      education: '🎓',
      other: '🔧'
    };
    return icons[category] || '🤖';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const MorgyCard: React.FC<{ morgy: Morgy; isStarter?: boolean }> = ({ morgy, isStarter }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 border-2 border-transparent hover:border-purple-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">
            {morgy.avatar_url ? (
              <img src={morgy.avatar_url} alt={morgy.name} className="w-12 h-12 rounded-full" />
            ) : (
              <span>{getCategoryIcon(morgy.category)}</span>
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{morgy.name}</h3>
            <p className="text-sm text-gray-500">{morgy.category}</p>
          </div>
        </div>
        {isStarter && (
          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
            Starter
          </span>
        )}
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {morgy.description}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <span>Created {formatDate(morgy.created_at)}</span>
        {morgy.message_count !== undefined && (
          <span>{morgy.message_count} messages</span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/morgys/${morgy.id}`)}
          className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          💬 Chat
        </button>
        <button
          onClick={() => navigate(`/morgys/${morgy.id}/knowledge`)}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          📚 Train
        </button>
        {!isStarter && (
          <>
            <button
              onClick={() => navigate(`/morgys/${morgy.id}/edit`)}
              className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ✏️
            </button>
            <button
              onClick={() => handleDelete(morgy.id)}
              className="bg-red-100 text-red-600 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors"
            >
              🗑️
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">🤖 My Morgys</h1>
            <p className="text-gray-600 mt-2">Your AI employees, ready to work</p>
          </div>
          <button
            onClick={() => navigate('/morgys/create')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl font-semibold"
          >
            ✨ Create New Morgy
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b">
          <button
            onClick={() => setActiveTab('my')}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === 'my'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Morgys ({morgys.length})
          </button>
          <button
            onClick={() => setActiveTab('starters')}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === 'starters'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Starter Morgys ({starters.length})
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600">Loading Morgys...</p>
          </div>
        </div>
      ) : activeTab === 'my' ? (
        morgys.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Morgys Yet</h2>
            <p className="text-gray-600 mb-6">Create your first AI employee to get started</p>
            <button
              onClick={() => navigate('/morgys/create')}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              ✨ Create Your First Morgy
            </button>
            <div className="mt-8">
              <p className="text-sm text-gray-500 mb-4">Or try our starter Morgys:</p>
              <button
                onClick={() => setActiveTab('starters')}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                View Starter Morgys →
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {morgys.map((morgy) => (
              <MorgyCard key={morgy.id} morgy={morgy} />
            ))}
          </div>
        )
      ) : (
        <div>
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">🎓 Starter Morgys</h2>
            <p className="text-gray-600">
              Pre-configured AI employees ready to help you with common tasks. 
              Chat with them to see how Morgys work!
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {starters.map((morgy) => (
              <MorgyCard key={morgy.id} morgy={morgy} isStarter />
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {morgys.length > 0 && activeTab === 'my' && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="text-3xl font-bold mb-2">{morgys.length}</div>
            <div className="text-purple-100">Total Morgys</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="text-3xl font-bold mb-2">
              {morgys.reduce((sum, m) => sum + (m.message_count || 0), 0)}
            </div>
            <div className="text-blue-100">Total Messages</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="text-3xl font-bold mb-2">
              {morgys.filter(m => m.is_public).length}
            </div>
            <div className="text-green-100">Public Morgys</div>
          </div>
        </div>
      )}
    </div>
  );
};
