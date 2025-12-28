// @ts-nocheck
/**
 * Audit Service
 * Comprehensive logging for customer support and debugging
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'mock-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'failure' | 'error';
  errorMessage?: string;
}

export interface ErrorLogEntry {
  userId?: string;
  errorType: string;
  errorCode?: string;
  errorMessage: string;
  stackTrace?: string;
  context?: any;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

export class AuditService {
  /**
   * Log an audit event
   */
  async logAudit(entry: AuditLogEntry) {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: entry.userId,
          action: entry.action,
          resource_type: entry.resourceType,
          resource_id: entry.resourceId,
          details: entry.details,
          ip_address: entry.ipAddress,
          user_agent: entry.userAgent,
          status: entry.status || 'success',
          error_message: entry.errorMessage
        });

      if (error) {
        console.error('Failed to log audit event:', error);
      }
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }

  /**
   * Log an error
   */
  async logError(entry: ErrorLogEntry) {
    try {
      const { error } = await supabase
        .from('error_logs')
        .insert({
          user_id: entry.userId,
          error_type: entry.errorType,
          error_code: entry.errorCode,
          error_message: entry.errorMessage,
          stack_trace: entry.stackTrace,
          context: entry.context,
          severity: entry.severity || 'error'
        });

      if (error) {
        console.error('Failed to log error:', error);
      }

      // Also log to console for immediate visibility
      console.error(`[${entry.severity?.toUpperCase()}] ${entry.errorType}:`, entry.errorMessage);
    } catch (error) {
      console.error('Error logging error:', error);
    }
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(userId: string, options?: {
    action?: string;
    resourceType?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options?.action) {
        query = query.eq('action', options.action);
      }

      if (options?.resourceType) {
        query = query.eq('resource_type', options.resourceType);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserAuditLogs:', error);
      return null;
    }
  }

  /**
   * Get error logs for a user
   */
  async getUserErrorLogs(userId: string, options?: {
    errorType?: string;
    severity?: string;
    resolved?: boolean;
    limit?: number;
  }) {
    try {
      let query = supabase
        .from('error_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options?.errorType) {
        query = query.eq('error_type', options.errorType);
      }

      if (options?.severity) {
        query = query.eq('severity', options.severity);
      }

      if (options?.resolved !== undefined) {
        query = query.eq('resolved', options.resolved);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching error logs:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserErrorLogs:', error);
      return null;
    }
  }

  /**
   * Get user activity timeline (audit logs + errors)
   */
  async getUserTimeline(userId: string, options?: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    try {
      const startDate = options?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = options?.endDate || new Date();

      // Get audit logs
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(options?.limit || 100);

      // Get error logs
      const { data: errorLogs } = await supabase
        .from('error_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(options?.limit || 100);

      // Combine and sort by timestamp
      const timeline = [
        ...(auditLogs || []).map(log => ({ ...log, type: 'audit' })),
        ...(errorLogs || []).map(log => ({ ...log, type: 'error' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return timeline;
    } catch (error) {
      console.error('Error in getUserTimeline:', error);
      return null;
    }
  }

  /**
   * Mark error as resolved
   */
  async resolveError(errorId: string, resolvedBy: string, notes?: string) {
    try {
      const { error } = await supabase
        .from('error_logs')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy,
          resolution_notes: notes
        })
        .eq('id', errorId);

      if (error) {
        console.error('Error resolving error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in resolveError:', error);
      return false;
    }
  }

  /**
   * Get all unresolved errors (for admin dashboard)
   */
  async getUnresolvedErrors(options?: {
    severity?: string;
    limit?: number;
  }) {
    try {
      let query = supabase
        .from('error_logs')
        .select('*, profiles!error_logs_user_id_fkey(email, full_name)')
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      if (options?.severity) {
        query = query.eq('severity', options.severity);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching unresolved errors:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUnresolvedErrors:', error);
      return null;
    }
  }

  /**
   * Search audit logs (admin)
   */
  async searchAuditLogs(options: {
    userId?: string;
    action?: string;
    resourceType?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*, profiles!audit_logs_user_id_fkey(email, full_name)')
        .order('created_at', { ascending: false });

      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }

      if (options.action) {
        query = query.eq('action', options.action);
      }

      if (options.resourceType) {
        query = query.eq('resource_type', options.resourceType);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }

      if (options.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error searching audit logs:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in searchAuditLogs:', error);
      return null;
    }
  }

  /**
   * Get error statistics
   */
  async getErrorStats(timeRange: '24h' | '7d' | '30d' = '24h') {
    try {
      const since = this.getTimeRangeDate(timeRange);

      const { data: errors } = await supabase
        .from('error_logs')
        .select('error_type, severity, resolved')
        .gte('created_at', since.toISOString());

      if (!errors) return null;

      // Count by type
      const byType = errors.reduce((acc, err) => {
        acc[err.error_type] = (acc[err.error_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Count by severity
      const bySeverity = errors.reduce((acc, err) => {
        acc[err.severity] = (acc[err.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Resolution rate
      const resolved = errors.filter(e => e.resolved).length;
      const total = errors.length;
      const resolutionRate = total ? ((resolved / total) * 100).toFixed(1) : 0;

      return {
        total,
        resolved,
        unresolved: total - resolved,
        resolutionRate: `${resolutionRate}%`,
        byType,
        bySeverity,
        timeRange
      };
    } catch (error) {
      console.error('Error in getErrorStats:', error);
      return null;
    }
  }

  /**
   * Helper: Get date for time range
   */
  private getTimeRangeDate(timeRange: '24h' | '7d' | '30d'): Date {
    const now = Date.now();
    switch (timeRange) {
      case '24h':
        return new Date(now - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now - 30 * 24 * 60 * 60 * 1000);
    }
  }
}

export const auditService = new AuditService();
