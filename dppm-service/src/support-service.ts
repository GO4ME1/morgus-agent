// @ts-nocheck
/**
 * Support Service
 * Customer support tools and user management
 */

import { createClient } from '@supabase/supabase-js';
import { auditService } from './audit-service';

const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'mock-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export class SupportService {
  /**
   * Get complete user profile for support
   */
  async getUserProfile(userId: string) {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile) {
        return null;
      }

      // Get usage quota
      const { data: quota } = await supabase
        .from('usage_quotas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get recent activity
      const recentActivity = await auditService.getUserTimeline(userId, { limit: 20 });

      // Get error count
      const { count: errorCount } = await supabase
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('resolved', false);

      // Get Morgys
      const { data: morgys } = await supabase
        .from('morgys')
        .select('id, name, category, created_at')
        .eq('user_id', userId);

      return {
        profile,
        usage: quota,
        recentActivity,
        unresolvedErrors: errorCount || 0,
        morgys: morgys || []
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Search users (admin)
   */
  async searchUsers(query: string, options?: {
    tier?: string;
    limit?: number;
  }) {
    try {
      let dbQuery = supabase
        .from('profiles')
        .select('id, email, full_name, subscription_tier, created_at, xp_balance')
        .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (options?.tier) {
        dbQuery = dbQuery.eq('subscription_tier', options.tier);
      }

      if (options?.limit) {
        dbQuery = dbQuery.limit(options.limit);
      }

      const { data, error } = await dbQuery;

      if (error) {
        console.error('Error searching users:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in searchUsers:', error);
      return null;
    }
  }

  /**
   * Get user's billing history
   */
  async getUserBillingHistory(userId: string) {
    try {
      // Get usage quotas (monthly bills)
      const { data: quotas } = await supabase
        .from('usage_quotas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Get subscription changes from audit logs
      const { data: subscriptionChanges } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .in('action', ['upgrade', 'downgrade', 'subscribe', 'cancel_subscription'])
        .order('created_at', { ascending: false });

      return {
        monthlyUsage: quotas || [],
        subscriptionChanges: subscriptionChanges || []
      };
    } catch (error) {
      console.error('Error getting billing history:', error);
      return null;
    }
  }

  /**
   * Get user's message history
   */
  async getUserMessages(userId: string, options?: {
    morgyId?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      let query = supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .eq('action_type', 'chat')
        .order('created_at', { ascending: false });

      if (options?.morgyId) {
        query = query.eq('resource_id', options.morgyId);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching messages:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserMessages:', error);
      return null;
    }
  }

  /**
   * Create support ticket
   */
  async createTicket(data: {
    userId: string;
    subject: string;
    description: string;
    category?: string;
    priority?: string;
    metadata?: any;
  }) {
    try {
      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: data.userId,
          subject: data.subject,
          description: data.description,
          category: data.category,
          priority: data.priority || 'medium',
          metadata: data.metadata
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating ticket:', error);
        return null;
      }

      // Log audit event
      await auditService.logAudit({
        userId: data.userId,
        action: 'create_support_ticket',
        resourceType: 'support_ticket',
        resourceId: ticket.id,
        details: { subject: data.subject, category: data.category }
      });

      return ticket;
    } catch (error) {
      console.error('Error in createTicket:', error);
      return null;
    }
  }

  /**
   * Add message to ticket
   */
  async addTicketMessage(data: {
    ticketId: string;
    userId: string;
    message: string;
    isInternal?: boolean;
    attachments?: any;
  }) {
    try {
      const { data: message, error } = await supabase
        .from('support_ticket_messages')
        .insert({
          ticket_id: data.ticketId,
          user_id: data.userId,
          message: data.message,
          is_internal: data.isInternal || false,
          attachments: data.attachments
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding ticket message:', error);
        return null;
      }

      // Update ticket's updated_at
      await supabase
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', data.ticketId);

      return message;
    } catch (error) {
      console.error('Error in addTicketMessage:', error);
      return null;
    }
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(ticketId: string, status: string, assignedTo?: string) {
    try {
      const updates: any = { status };

      if (status === 'resolved' || status === 'closed') {
        updates.resolved_at = new Date().toISOString();
      }

      if (assignedTo) {
        updates.assigned_to = assignedTo;
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId);

      if (error) {
        console.error('Error updating ticket status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateTicketStatus:', error);
      return false;
    }
  }

  /**
   * Get all tickets (admin)
   */
  async getAllTickets(options?: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    limit?: number;
  }) {
    try {
      let query = supabase
        .from('support_tickets')
        .select('*, profiles!support_tickets_user_id_fkey(email, full_name)')
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.priority) {
        query = query.eq('priority', options.priority);
      }

      if (options?.assignedTo) {
        query = query.eq('assigned_to', options.assignedTo);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tickets:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getAllTickets:', error);
      return null;
    }
  }

  /**
   * Get ticket with messages
   */
  async getTicketDetails(ticketId: string) {
    try {
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('*, profiles!support_tickets_user_id_fkey(email, full_name)')
        .eq('id', ticketId)
        .single();

      if (!ticket) {
        return null;
      }

      const { data: messages } = await supabase
        .from('support_ticket_messages')
        .select('*, profiles!support_ticket_messages_user_id_fkey(email, full_name)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      return {
        ticket,
        messages: messages || []
      };
    } catch (error) {
      console.error('Error getting ticket details:', error);
      return null;
    }
  }

  /**
   * Impersonate user (for debugging) - creates audit log
   */
  async impersonateUser(adminId: string, userId: string, reason: string) {
    try {
      // Log the impersonation
      await auditService.logAudit({
        userId: adminId,
        action: 'impersonate_user',
        resourceType: 'user',
        resourceId: userId,
        details: { reason }
      });

      // Return user session token (would need to implement session creation)
      return {
        success: true,
        message: 'Impersonation logged. Session token would be generated here.'
      };
    } catch (error) {
      console.error('Error in impersonateUser:', error);
      return null;
    }
  }

  /**
   * Export user data (GDPR compliance)
   */
  async exportUserData(userId: string) {
    try {
      const [profile, usage, auditLogs, errors, morgys, tickets] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('usage_quotas').select('*').eq('user_id', userId),
        supabase.from('audit_logs').select('*').eq('user_id', userId),
        supabase.from('error_logs').select('*').eq('user_id', userId),
        supabase.from('morgys').select('*').eq('user_id', userId),
        supabase.from('support_tickets').select('*').eq('user_id', userId)
      ]);

      return {
        profile: profile.data,
        usage: usage.data,
        auditLogs: auditLogs.data,
        errors: errors.data,
        morgys: morgys.data,
        supportTickets: tickets.data,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      return null;
    }
  }
}

export const supportService = new SupportService();
