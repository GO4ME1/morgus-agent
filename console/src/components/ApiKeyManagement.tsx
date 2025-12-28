import { useState, useEffect } from 'react';
import { Key, Copy, Trash2, Plus, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { createApiKey, listApiKeys, revokeApiKey, type ApiKey } from '../lib/api-client';

export const ApiKeyManagement: React.FC = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    scopes: [] as string[],
    expires_in_days: 30,
  });
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<{ [key: string]: boolean }>({});

  const availableScopes = [
    { id: 'morgys:read', name: 'Read Morgys', description: 'View your Morgys' },
    { id: 'morgys:write', name: 'Write Morgys', description: 'Create and update Morgys' },
    { id: 'morgys:delete', name: 'Delete Morgys', description: 'Delete your Morgys' },
    { id: 'marketplace:read', name: 'Read Marketplace', description: 'Browse marketplace listings' },
    { id: 'marketplace:purchase', name: 'Purchase from Marketplace', description: 'Buy Morgys from marketplace' },
    { id: 'analytics:read', name: 'Read Analytics', description: 'View analytics data' },
    { id: 'knowledge:read', name: 'Read Knowledge', description: 'View knowledge sources' },
    { id: 'knowledge:write', name: 'Write Knowledge', description: 'Add knowledge sources' },
    { id: 'mcp:export', name: 'MCP Export', description: 'Export Morgys as MCP servers' },
  ];

  useEffect(() => {
    if (user) {
      loadApiKeys();
    }
  }, [user]);

  const loadApiKeys = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const keys = await listApiKeys(user.id);
      setApiKeys(keys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!user || !newKeyData.name.trim()) return;

    try {
      const result = await createApiKey({
        user_id: user.id,
        name: newKeyData.name.trim(),
        scopes: newKeyData.scopes,
        expires_in_days: newKeyData.expires_in_days,
      });

      setCreatedKey(result.api_key.key);
      setNewKeyData({ name: '', scopes: [], expires_in_days: 30 });
      await loadApiKeys();
    } catch (error: any) {
      console.error('Failed to create API key:', error);
      alert(error.message || 'Failed to create API key');
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      await revokeApiKey(keyId, user.id);
      await loadApiKeys();
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      alert('Failed to revoke API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const toggleScope = (scopeId: string) => {
    setNewKeyData(prev => ({
      ...prev,
      scopes: prev.scopes.includes(scopeId)
        ? prev.scopes.filter(s => s !== scopeId)
        : [...prev.scopes, scopeId],
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Key className="w-8 h-8 text-purple-600" />
            API Key Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your API keys for programmatic access to the Morgus platform
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create API Key
        </button>
      </div>

      {/* API Keys List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading API keys...</p>
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Key className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No API keys yet</h3>
          <p className="text-gray-600 mb-4">Create your first API key to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Create API Key
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{key.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        key.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : key.status === 'expired'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {key.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <code className="px-3 py-1 bg-gray-100 rounded text-sm font-mono text-gray-700">
                      {key.key_prefix}...
                    </code>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {key.scopes.map((scope) => (
                      <span
                        key={scope}
                        className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Created: {new Date(key.created_at).toLocaleDateString()}</p>
                    {key.last_used_at && (
                      <p>Last used: {new Date(key.last_used_at).toLocaleDateString()}</p>
                    )}
                    {key.expires_at && (
                      <p>Expires: {new Date(key.expires_at).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {key.status === 'active' && (
                    <button
                      onClick={() => handleRevokeKey(key.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Revoke API key"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Create New API Key</h2>
              <p className="text-gray-600 mt-1">
                Generate a new API key for programmatic access
              </p>
            </div>

            {createdKey ? (
              <div className="p-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-900 mb-1">API Key Created!</h3>
                      <p className="text-sm text-green-800 mb-3">
                        Save this API key now. You won't be able to see it again!
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm font-mono text-gray-900 break-all">
                          {createdKey}
                        </code>
                        <button
                          onClick={() => copyToClipboard(createdKey)}
                          className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          title="Copy to clipboard"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-900 mb-1">Important</h3>
                      <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                        <li>Store this key securely</li>
                        <li>Never share it publicly or commit it to version control</li>
                        <li>Use it in your Authorization header: <code>Bearer {'{your_key}'}</code></li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCreatedKey(null);
                    setShowCreateModal(false);
                  }}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Key Name *
                    </label>
                    <input
                      type="text"
                      value={newKeyData.name}
                      onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                      placeholder="e.g., Production API Key"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scopes (Permissions)
                    </label>
                    <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {availableScopes.map((scope) => (
                        <label
                          key={scope.id}
                          className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={newKeyData.scopes.includes(scope.id)}
                            onChange={() => toggleScope(scope.id)}
                            className="mt-1"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{scope.name}</div>
                            <div className="text-sm text-gray-600">{scope.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expires In (Days)
                    </label>
                    <input
                      type="number"
                      value={newKeyData.expires_in_days}
                      onChange={(e) => setNewKeyData({ ...newKeyData, expires_in_days: parseInt(e.target.value) || 30 })}
                      min="1"
                      max="365"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Set to 0 for no expiration (not recommended)
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateKey}
                    disabled={!newKeyData.name.trim()}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create API Key
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
