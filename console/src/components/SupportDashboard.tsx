import React, { useState, useEffect } from 'react';
import { MessageCircle, AlertCircle, CheckCircle, Clock, Search, User, Calendar } from 'lucide-react';
import { useAuth } from '../lib/auth';

interface Ticket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  userEmail?: string;
}

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  userEmail?: string;
}

export const SupportDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tickets' | 'audit'>('tickets');
  const [filter, setFilter] = useState({
    status: 'all',
    priority: 'all',
    search: '',
  });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://morgus-deploy.fly.dev';
  const isAdmin = profile?.is_admin;

  useEffect(() => {
    loadData();
  }, [activeTab, filter]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      if (activeTab === 'tickets') {
        const params = new URLSearchParams();
        if (filter.status !== 'all') params.append('status', filter.status);
        if (filter.priority !== 'all') params.append('priority', filter.priority);
        if (filter.search) params.append('search', filter.search);

        const endpoint = isAdmin 
          ? `/api/support/tickets?${params}`
          : `/api/support/tickets/user/${user.id}?${params}`;

        const response = await fetch(`${API_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${user.id}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTickets(data);
        }
      } else if (activeTab === 'audit' && isAdmin) {
        const params = new URLSearchParams();
        if (filter.search) params.append('search', filter.search);

        const response = await fetch(`${API_URL}/api/support/audit-logs?${params}`, {
          headers: {
            'Authorization': `Bearer ${user.id}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAuditLogs(data);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!user || !newTicket.subject || !newTicket.description) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/support/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          ...newTicket,
          userId: user.id,
        }),
      });

      if (response.ok) {
        setNewTicket({
          subject: '',
          description: '',
          category: 'general',
          priority: 'medium',
        });
        setShowNewTicketForm(false);
        loadData();
      } else {
        alert('Failed to create ticket');
      }
    } catch (error) {
      console.error('Failed to create ticket:', error);
      alert('Failed to create ticket');
    }
  };

  const handleUpdateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
    if (!user || !isAdmin) return;

    try {
      const response = await fetch(`${API_URL}/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        loadData();
        setSelectedTicket(null);
      } else {
        alert('Failed to update ticket');
      }
    } catch (error) {
      console.error('Failed to update ticket:', error);
      alert('Failed to update ticket');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      open: { color: 'bg-blue-500/20 text-blue-400', icon: <Clock className="w-3 h-3" /> },
      in_progress: { color: 'bg-yellow-500/20 text-yellow-400', icon: <AlertCircle className="w-3 h-3" /> },
      resolved: { color: 'bg-green-500/20 text-green-400', icon: <CheckCircle className="w-3 h-3" /> },
      closed: { color: 'bg-gray-500/20 text-gray-400', icon: <CheckCircle className="w-3 h-3" /> },
    };
    return badges[status as keyof typeof badges] || badges.open;
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-gray-500/20 text-gray-400',
      medium: 'bg-blue-500/20 text-blue-400',
      high: 'bg-orange-500/20 text-orange-400',
      urgent: 'bg-red-500/20 text-red-400',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Support Dashboard</h1>
            <p className="text-gray-400">
              {isAdmin ? 'Manage tickets and view audit logs' : 'View and create support tickets'}
            </p>
          </div>

          {!isAdmin && (
            <button
              onClick={() => setShowNewTicketForm(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              New Ticket
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`
              px-6 py-3 rounded-lg font-medium transition-colors
              ${activeTab === 'tickets'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }
            `}
          >
            Tickets
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`
                px-6 py-3 rounded-lg font-medium transition-colors
                ${activeTab === 'audit'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              Audit Logs
            </button>
          )}
        </div>

        {/* Filters */}
        {activeTab === 'tickets' && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  placeholder="Search tickets..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={filter.priority}
                onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : activeTab === 'tickets' ? (
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="text-center text-gray-400 py-12">No tickets found</div>
            ) : (
              tickets.map((ticket) => {
                const statusBadge = getStatusBadge(ticket.status);
                const priorityBadge = getPriorityBadge(ticket.priority);

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-purple-500 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">{ticket.subject}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2">{ticket.description}</p>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusBadge.color}`}>
                          {statusBadge.icon}
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityBadge}`}>
                          {ticket.priority}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      {isAdmin && ticket.userEmail && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{ticket.userEmail}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(ticket.createdAt)}</span>
                      </div>
                      <span className="text-gray-600">•</span>
                      <span>{ticket.category}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">IP Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm text-white">{log.userEmail || log.userId}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{log.action}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{log.ipAddress}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{formatDate(log.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* New Ticket Modal */}
        {showNewTicketForm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Create Support Ticket</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Subject</label>
                  <input
                    type="text"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                    placeholder="Brief description of the issue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                  <textarea
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                    placeholder="Detailed description of the issue..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                    <select
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="general">General</option>
                      <option value="billing">Billing</option>
                      <option value="technical">Technical</option>
                      <option value="feature">Feature Request</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Priority</label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as Ticket['priority'] })}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleCreateTicket}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  Create Ticket
                </button>
                <button
                  onClick={() => setShowNewTicketForm(false)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedTicket.subject}</h2>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedTicket.status).color}`}>
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityBadge(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
                  <p className="text-white">{selectedTicket.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Category</h3>
                    <p className="text-white">{selectedTicket.category}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Created</h3>
                    <p className="text-white">{formatDate(selectedTicket.createdAt)}</p>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="space-y-4 pt-6 border-t border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-4">Admin Actions</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleUpdateTicket(selectedTicket.id, { status: e.target.value as Ticket['status'] })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Priority</label>
                      <select
                        value={selectedTicket.priority}
                        onChange={(e) => handleUpdateTicket(selectedTicket.id, { priority: e.target.value as Ticket['priority'] })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
