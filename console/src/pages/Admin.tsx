// Admin Dashboard for Morgus - Direct Supabase Access
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import './Admin.css';

interface PromoCode {
  id: string;
  code: string;
  reward_type: string;
  reward_value: number;
  max_uses: number | null;
  times_used: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  description: string | null;
}

interface User {
  id: string;
  email: string;
  display_name: string | null;
  subscription_tier: string;
  subscription_status: string;
  day_pass_balance: number;
  is_admin: boolean;
  created_at: string;
}

export function Admin() {
  const { user, profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'promos' | 'users'>('promos');
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New promo form state
  const [newPromo, setNewPromo] = useState({
    code: '',
    type: 'day_pass',
    value: 1,
    maxUses: '',
    expiresAt: '',
    description: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    setDataLoading(true);
    setError(null);
    try {
      // Fetch promo codes directly from Supabase
      const { data: promoData, error: promoError } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (promoError) {
        console.error('Error fetching promo codes:', promoError);
        throw promoError;
      }
      setPromoCodes(promoData || []);

      // Fetch users directly from Supabase
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (userError) {
        console.error('Error fetching users:', userError);
        throw userError;
      }
      setUsers(userData || []);

    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      setError('Failed to load admin data. Please check your permissions.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromo.code.trim()) return;

    setCreateLoading(true);
    setCreateMessage(null);

    try {
      const { error: insertError } = await supabase
        .from('promo_codes')
        .insert({
          code: newPromo.code.toUpperCase().trim(),
          reward_type: newPromo.type,
          reward_value: newPromo.value,
          max_uses: newPromo.maxUses ? parseInt(newPromo.maxUses) : null,
          expires_at: newPromo.expiresAt || null,
          description: newPromo.description || null,
          is_active: true,
          times_used: 0,
        });

      if (insertError) {
        console.error('Error creating promo:', insertError);
        setCreateMessage({ type: 'error', text: insertError.message || 'Failed to create promo code' });
      } else {
        setCreateMessage({ type: 'success', text: 'Promo code created!' });
        setNewPromo({ code: '', type: 'day_pass', value: 1, maxUses: '', expiresAt: '', description: '' });
        fetchData();
      }
    } catch {
      setCreateMessage({ type: 'error', text: 'Failed to create promo code' });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleTogglePromo = async (promoId: string, isActive: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('promo_codes')
        .update({ is_active: !isActive })
        .eq('id', promoId);

      if (updateError) {
        console.error('Error toggling promo:', updateError);
      } else {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to toggle promo:', err);
    }
  };

  const handleDeletePromo = async (promoId: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', promoId);

      if (deleteError) {
        console.error('Error deleting promo:', deleteError);
      } else {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete promo:', err);
    }
  };

  const handleGrantDayPass = async (userId: string) => {
    const count = prompt('How many day passes to grant?', '1');
    if (!count) return;

    try {
      // Get current balance
      const { data: userData, error: fetchError } = await supabase
        .from('profiles')
        .select('day_pass_balance')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching user:', fetchError);
        return;
      }

      const newBalance = (userData?.day_pass_balance || 0) + parseInt(count);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ day_pass_balance: newBalance })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating day pass:', updateError);
      } else {
        fetchData();
        alert(`Granted ${count} day pass(es)!`);
      }
    } catch (err) {
      console.error('Failed to grant day pass:', err);
    }
  };

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    if (!confirm(isAdmin ? 'Remove admin privileges?' : 'Grant admin privileges?')) return;

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_admin: !isAdmin })
        .eq('id', userId);

      if (updateError) {
        console.error('Error toggling admin:', updateError);
      } else {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to toggle admin:', err);
    }
  };

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="admin-container">
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="admin-container">
        <div className="admin-access-denied">
          <h2>🔐 Login Required</h2>
          <p>Please log in to access the admin panel.</p>
          <Link to="/login?redirect=/admin" className="admin-login-btn">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  // Still loading profile
  if (!profile) {
    return (
      <div className="admin-container">
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  // Check admin access
  if (!profile.is_admin) {
    return (
      <div className="admin-container">
        <div className="admin-access-denied">
          <h2>🚫 Access Denied</h2>
          <p>You don't have admin privileges.</p>
          <p className="admin-email">Logged in as: {profile.email}</p>
          <Link to="/" className="admin-login-btn">
            Back to Morgus
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="admin-title-row">
          <h1>👑 Admin Dashboard</h1>
          <Link to="/" className="back-to-app">← Back to Morgus</Link>
        </div>
        <p className="admin-welcome">Welcome, {profile.display_name || profile.email}</p>
        <div className="admin-tabs">
          <button
            className={activeTab === 'promos' ? 'active' : ''}
            onClick={() => setActiveTab('promos')}
          >
            🎟️ Promo Codes
          </button>
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-error">
          <p>{error}</p>
          <button onClick={fetchData}>Retry</button>
        </div>
      )}

      {dataLoading ? (
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <p>Loading data...</p>
        </div>
      ) : activeTab === 'promos' ? (
        <div className="admin-section">
          {/* Create Promo Form */}
          <div className="admin-card">
            <h2>✨ Create Promo Code</h2>
            <form onSubmit={handleCreatePromo} className="promo-create-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Code</label>
                  <input
                    type="text"
                    value={newPromo.code}
                    onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                    placeholder="MORGUS2024"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={newPromo.type}
                    onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value })}
                  >
                    <option value="day_pass">Day Pass</option>
                    <option value="discount">Discount %</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Value</label>
                  <input
                    type="number"
                    value={newPromo.value}
                    onChange={(e) => setNewPromo({ ...newPromo, value: parseInt(e.target.value) })}
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Max Uses (empty = unlimited)</label>
                  <input
                    type="number"
                    value={newPromo.maxUses}
                    onChange={(e) => setNewPromo({ ...newPromo, maxUses: e.target.value })}
                    placeholder="Unlimited"
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Expires At (optional)</label>
                  <input
                    type="date"
                    value={newPromo.expiresAt}
                    onChange={(e) => setNewPromo({ ...newPromo, expiresAt: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={newPromo.description}
                    onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
                    placeholder="Launch promo"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" disabled={createLoading} className="create-btn">
                  {createLoading ? 'Creating...' : '🎉 Create Code'}
                </button>
              </div>
            </form>
            {createMessage && (
              <div className={`admin-message ${createMessage.type}`}>
                {createMessage.text}
              </div>
            )}
          </div>

          {/* Promo Codes List */}
          <div className="admin-card">
            <h2>📋 Active Promo Codes ({promoCodes.length})</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Uses</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promoCodes.map((promo) => (
                  <tr key={promo.id}>
                    <td><code>{promo.code}</code></td>
                    <td>{promo.reward_type}</td>
                    <td>{promo.reward_value}</td>
                    <td>{promo.times_used || 0} / {promo.max_uses || '∞'}</td>
                    <td>{promo.expires_at ? new Date(promo.expires_at).toLocaleDateString() : 'Never'}</td>
                    <td>
                      <span className={`status-badge ${promo.is_active ? 'active' : 'inactive'}`}>
                        {promo.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="action-btn"
                        onClick={() => handleTogglePromo(promo.id, promo.is_active)}
                      >
                        {promo.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeletePromo(promo.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {promoCodes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-row">No promo codes yet. Create one above!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="admin-section">
          {/* Users List */}
          <div className="admin-card">
            <h2>👥 Users ({users.length})</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Plan</th>
                  <th>Day Passes</th>
                  <th>Admin</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.display_name || '-'}</td>
                    <td>
                      <span className={`plan-badge ${u.subscription_tier}`}>
                        {u.subscription_tier}
                      </span>
                    </td>
                    <td>{u.day_pass_balance}</td>
                    <td>
                      <span className={`status-badge ${u.is_admin ? 'active' : 'inactive'}`}>
                        {u.is_admin ? '👑 Yes' : 'No'}
                      </span>
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="action-btn"
                        onClick={() => handleGrantDayPass(u.id)}
                      >
                        Grant Pass
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                      >
                        {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-row">No users yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
