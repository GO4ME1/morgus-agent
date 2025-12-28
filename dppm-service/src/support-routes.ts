// @ts-nocheck
/**
 * Support Routes
 * Customer support and admin tools API
 */

import { Router } from 'express';
import { supportService } from './support-service';
import { auditService } from './audit-service';
import { authMiddleware } from './auth-middleware';

const router = Router();

// Middleware to check admin access
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin (would check profiles table)
    // For now, simplified check
    const isAdmin = req.user?.role === 'admin' || req.user?.is_admin;
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify admin access' });
  }
};

// Get user profile (admin)
router.get('/users/:userId', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await supportService.getUserProfile(userId);
    
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Search users (admin)
router.get('/users/search/:query', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { query } = req.params;
    const { tier, limit } = req.query;

    const users = await supportService.searchUsers(query, {
      tier: tier as string,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get user timeline (admin)
router.get('/users/:userId/timeline', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;

    const timeline = await auditService.getUserTimeline(userId, {
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({ timeline });
  } catch (error) {
    console.error('Error getting user timeline:', error);
    res.status(500).json({ error: 'Failed to get user timeline' });
  }
});

// Get user errors (admin)
router.get('/users/:userId/errors', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { errorType, severity, resolved, limit } = req.query;

    const errors = await auditService.getUserErrorLogs(userId, {
      errorType: errorType as string,
      severity: severity as string,
      resolved: resolved === 'true',
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({ errors });
  } catch (error) {
    console.error('Error getting user errors:', error);
    res.status(500).json({ error: 'Failed to get user errors' });
  }
});

// Get user billing history (admin)
router.get('/users/:userId/billing', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await supportService.getUserBillingHistory(userId);

    res.json(history);
  } catch (error) {
    console.error('Error getting billing history:', error);
    res.status(500).json({ error: 'Failed to get billing history' });
  }
});

// Get user messages (admin)
router.get('/users/:userId/messages', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { morgyId, limit, offset } = req.query;

    const messages = await supportService.getUserMessages(userId, {
      morgyId: morgyId as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({ messages });
  } catch (error) {
    console.error('Error getting user messages:', error);
    res.status(500).json({ error: 'Failed to get user messages' });
  }
});

// Export user data (admin - GDPR)
router.get('/users/:userId/export', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await supportService.exportUserData(userId);

    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error exporting user data:', error);
    res.status(500).json({ error: 'Failed to export user data' });
  }
});

// Create support ticket
router.post('/tickets', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { subject, description, category, priority, metadata } = req.body;

    const ticket = await supportService.createTicket({
      userId,
      subject,
      description,
      category,
      priority,
      metadata
    });

    if (!ticket) {
      return res.status(500).json({ error: 'Failed to create ticket' });
    }

    res.json({ ticket });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Add message to ticket
router.post('/tickets/:ticketId/messages', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { ticketId } = req.params;
    const { message, isInternal, attachments } = req.body;

    const ticketMessage = await supportService.addTicketMessage({
      ticketId,
      userId,
      message,
      isInternal,
      attachments
    });

    if (!ticketMessage) {
      return res.status(500).json({ error: 'Failed to add message' });
    }

    res.json({ message: ticketMessage });
  } catch (error) {
    console.error('Error adding ticket message:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

// Get all tickets (admin)
router.get('/tickets', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { status, priority, assignedTo, limit } = req.query;

    const tickets = await supportService.getAllTickets({
      status: status as string,
      priority: priority as string,
      assignedTo: assignedTo as string,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({ tickets });
  } catch (error) {
    console.error('Error getting tickets:', error);
    res.status(500).json({ error: 'Failed to get tickets' });
  }
});

// Get ticket details
router.get('/tickets/:ticketId', authMiddleware, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const details = await supportService.getTicketDetails(ticketId);

    if (!details) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(details);
  } catch (error) {
    console.error('Error getting ticket details:', error);
    res.status(500).json({ error: 'Failed to get ticket details' });
  }
});

// Update ticket status (admin)
router.patch('/tickets/:ticketId/status', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, assignedTo } = req.body;

    const success = await supportService.updateTicketStatus(ticketId, status, assignedTo);

    if (!success) {
      return res.status(500).json({ error: 'Failed to update ticket' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Get unresolved errors (admin)
router.get('/errors/unresolved', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { severity, limit } = req.query;

    const errors = await auditService.getUnresolvedErrors({
      severity: severity as string,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({ errors });
  } catch (error) {
    console.error('Error getting unresolved errors:', error);
    res.status(500).json({ error: 'Failed to get unresolved errors' });
  }
});

// Resolve error (admin)
router.patch('/errors/:errorId/resolve', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { errorId } = req.params;
    const { notes } = req.body;
    const userId = req.user?.id;

    const success = await auditService.resolveError(errorId, userId, notes);

    if (!success) {
      return res.status(500).json({ error: 'Failed to resolve error' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error resolving error:', error);
    res.status(500).json({ error: 'Failed to resolve error' });
  }
});

// Get error statistics (admin)
router.get('/errors/stats', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { timeRange } = req.query;
    const stats = await auditService.getErrorStats(timeRange as any || '24h');

    res.json(stats);
  } catch (error) {
    console.error('Error getting error stats:', error);
    res.status(500).json({ error: 'Failed to get error stats' });
  }
});

// Search audit logs (admin)
router.post('/audit/search', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { userId, action, resourceType, status, startDate, endDate, limit } = req.body;

    const logs = await auditService.searchAuditLogs({
      userId,
      action,
      resourceType,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit
    });

    res.json({ logs });
  } catch (error) {
    console.error('Error searching audit logs:', error);
    res.status(500).json({ error: 'Failed to search audit logs' });
  }
});

// Impersonate user (admin - for debugging)
router.post('/impersonate/:userId', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const adminId = req.user?.id;
    const { userId } = req.params;
    const { reason } = req.body;

    const result = await supportService.impersonateUser(adminId, userId, reason);

    res.json(result);
  } catch (error) {
    console.error('Error impersonating user:', error);
    res.status(500).json({ error: 'Failed to impersonate user' });
  }
});

export default router;
