// @ts-nocheck
/**
 * Credit System API Routes
 * Handles credit balance, transactions, confirmations, and packages
 */

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { CreditService } from './credit-service';

const router = Router();

/**
 * Middleware to extract user ID from request
 */
function getUserId(req: Request): string | null {
  // Try to get from query, body, or headers
  return req.query.user_id as string || 
         req.body.user_id as string || 
         req.headers['x-user-id'] as string || 
         null;
}

/**
 * Middleware to create credit service
 */
function getCreditService(req: Request): CreditService | null {
  const supabaseUrl = process.env.SUPABASE_URL || req.body.config?.supabase_url;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || req.body.config?.supabase_key;
  
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  return new CreditService(supabase);
}

/**
 * GET /api/credits/balance
 * Get user's credit balance
 */
router.get('/balance', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(400).json({ error: 'user_id required' });
    }
    
    const creditService = getCreditService(req);
    if (!creditService) {
      return res.status(500).json({ error: 'Credit service not available' });
    }
    
    const balance = await creditService.getBalance(userId);
    if (!balance) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      balance: {
        images: {
          total: balance.imageCreditsTotal,
          used: balance.imageCreditsUsed,
          remaining: balance.imageCredits
        },
        videos: {
          total: balance.videoCreditsTotal,
          used: balance.videoCreditsUsed,
          remaining: balance.videoCredits
        }
      }
    });
  } catch (error: any) {
    console.error('[Credits API] Error getting balance:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/credits/check
 * Check if user has sufficient credits
 */
router.post('/check', async (req: Request, res: Response) => {
  try {
    const { user_id, credit_type, amount } = req.body;
    
    if (!user_id || !credit_type || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['user_id', 'credit_type', 'amount']
      });
    }
    
    const creditService = getCreditService(req);
    if (!creditService) {
      return res.status(500).json({ error: 'Credit service not available' });
    }
    
    const result = await creditService.checkCredits(user_id, credit_type, amount);
    
    res.json({
      success: true,
      hasCredits: result.hasCredits,
      available: result.available,
      required: result.required,
      creditType: result.creditType
    });
  } catch (error: any) {
    console.error('[Credits API] Error checking credits:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/credits/use
 * Use credits (deduct from balance)
 */
router.post('/use', async (req: Request, res: Response) => {
  try {
    const { user_id, credit_type, amount, task_id, description } = req.body;
    
    if (!user_id || !credit_type || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['user_id', 'credit_type', 'amount']
      });
    }
    
    const creditService = getCreditService(req);
    if (!creditService) {
      return res.status(500).json({ error: 'Credit service not available' });
    }
    
    const result = await creditService.useCredits(
      user_id,
      credit_type,
      amount,
      task_id,
      description
    );
    
    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        error: result.error 
      });
    }
    
    res.json({
      success: true,
      transactionId: result.transactionId
    });
  } catch (error: any) {
    console.error('[Credits API] Error using credits:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/credits/add
 * Add credits to user account
 */
router.post('/add', async (req: Request, res: Response) => {
  try {
    const { 
      user_id, 
      credit_type, 
      amount, 
      transaction_type,
      description,
      payment_id,
      promo_code
    } = req.body;
    
    if (!user_id || !credit_type || !amount || !transaction_type) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['user_id', 'credit_type', 'amount', 'transaction_type']
      });
    }
    
    const creditService = getCreditService(req);
    if (!creditService) {
      return res.status(500).json({ error: 'Credit service not available' });
    }
    
    const result = await creditService.addCredits(
      user_id,
      credit_type,
      amount,
      transaction_type,
      description,
      payment_id,
      promo_code
    );
    
    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        error: result.error 
      });
    }
    
    res.json({
      success: true,
      transactionId: result.transactionId
    });
  } catch (error: any) {
    console.error('[Credits API] Error adding credits:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/credits/confirm/create
 * Create a credit confirmation request (for video generation)
 */
router.post('/confirm/create', async (req: Request, res: Response) => {
  try {
    const { 
      user_id, 
      credit_type, 
      credits_required, 
      description,
      task_id
    } = req.body;
    
    if (!user_id || !credit_type || !credits_required || !description) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['user_id', 'credit_type', 'credits_required', 'description']
      });
    }
    
    const creditService = getCreditService(req);
    if (!creditService) {
      return res.status(500).json({ error: 'Credit service not available' });
    }
    
    const confirmation = await creditService.createConfirmation(
      user_id,
      credit_type,
      credits_required,
      description,
      task_id
    );
    
    if (!confirmation) {
      return res.status(500).json({ error: 'Failed to create confirmation' });
    }
    
    res.json({
      success: true,
      confirmation: {
        id: confirmation.id,
        creditType: confirmation.creditType,
        creditsRequired: confirmation.creditsRequired,
        description: confirmation.description,
        expiresAt: confirmation.expiresAt
      }
    });
  } catch (error: any) {
    console.error('[Credits API] Error creating confirmation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/credits/confirm/:id
 * Get confirmation status
 */
router.get('/confirm/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const creditService = getCreditService(req);
    if (!creditService) {
      return res.status(500).json({ error: 'Credit service not available' });
    }
    
    const confirmation = await creditService.getConfirmation(id);
    
    if (!confirmation) {
      return res.status(404).json({ error: 'Confirmation not found' });
    }
    
    res.json({
      success: true,
      confirmation: {
        id: confirmation.id,
        userId: confirmation.userId,
        creditType: confirmation.creditType,
        creditsRequired: confirmation.creditsRequired,
        description: confirmation.description,
        status: confirmation.status,
        expiresAt: confirmation.expiresAt
      }
    });
  } catch (error: any) {
    console.error('[Credits API] Error getting confirmation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/credits/confirm/:id/approve
 * Approve a credit confirmation
 */
router.post('/confirm/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const creditService = getCreditService(req);
    if (!creditService) {
      return res.status(500).json({ error: 'Credit service not available' });
    }
    
    const success = await creditService.updateConfirmation(id, 'approved');
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to approve confirmation' });
    }
    
    res.json({
      success: true,
      message: 'Confirmation approved'
    });
  } catch (error: any) {
    console.error('[Credits API] Error approving confirmation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/credits/confirm/:id/reject
 * Reject a credit confirmation
 */
router.post('/confirm/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const creditService = getCreditService(req);
    if (!creditService) {
      return res.status(500).json({ error: 'Credit service not available' });
    }
    
    const success = await creditService.updateConfirmation(id, 'rejected');
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to reject confirmation' });
    }
    
    res.json({
      success: true,
      message: 'Confirmation rejected'
    });
  } catch (error: any) {
    console.error('[Credits API] Error rejecting confirmation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/credits/packages
 * Get available credit packages
 */
router.get('/packages', async (req: Request, res: Response) => {
  try {
    const creditService = getCreditService(req);
    if (!creditService) {
      return res.status(500).json({ error: 'Credit service not available' });
    }
    
    const packages = await creditService.getPackages();
    
    res.json({
      success: true,
      packages: packages.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        type: pkg.package_type,
        imageCredits: pkg.image_credits,
        videoCredits: pkg.video_credits,
        price: {
          cents: pkg.price_cents,
          currency: pkg.currency,
          display: `$${(pkg.price_cents / 100).toFixed(2)}`
        },
        featured: pkg.featured
      }))
    });
  } catch (error: any) {
    console.error('[Credits API] Error getting packages:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/credits/transactions
 * Get user's transaction history
 */
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(400).json({ error: 'user_id required' });
    }
    
    const limit = parseInt(req.query.limit as string) || 50;
    
    const creditService = getCreditService(req);
    if (!creditService) {
      return res.status(500).json({ error: 'Credit service not available' });
    }
    
    const transactions = await creditService.getTransactions(userId, limit);
    
    res.json({
      success: true,
      transactions: transactions.map(tx => ({
        id: tx.id,
        type: tx.transaction_type,
        creditType: tx.credit_type,
        amount: tx.amount,
        description: tx.description,
        balanceAfter: tx.balance_after,
        createdAt: tx.created_at
      }))
    });
  } catch (error: any) {
    console.error('[Credits API] Error getting transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
