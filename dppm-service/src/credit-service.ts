/**
 * Credit Service for Morgus DPPM
 * Handles credit tracking, validation, and deduction
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface CreditBalance {
  imageCredits: number;
  videoCredits: number;
  imageCreditsUsed: number;
  videoCreditsUsed: number;
  imageCreditsTotal: number;
  videoCreditsTotal: number;
  unlimitedImages: boolean;
  unlimitedVideos: boolean;
}

export interface CreditCheckResult {
  hasCredits: boolean;
  available: number;
  required: number;
  creditType: 'image' | 'video';
  unlimited: boolean;
}

export interface CreditConfirmation {
  id: string;
  userId: string;
  taskId?: string;
  creditType: 'image' | 'video';
  creditsRequired: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  expiresAt: string;
}

export class CreditService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get user's credit balance
   */
  async getBalance(userId: string): Promise<CreditBalance | null> {
    const { data, error } = await this.supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[Credits] Error fetching balance:', error);
      return null;
    }

    if (!data) {
      // User doesn't have credits yet, initialize them
      await this.initializeCredits(userId);
      return this.getBalance(userId);
    }

    return {
      imageCredits: data.image_credits_remaining,
      videoCredits: data.video_credits_remaining,
      imageCreditsUsed: data.image_credits_used,
      videoCreditsUsed: data.video_credits_used,
      imageCreditsTotal: data.image_credits_total,
      videoCreditsTotal: data.video_credits_total,
      unlimitedImages: data.unlimited_image_credits || false,
      unlimitedVideos: data.unlimited_video_credits || false
    };
  }

  /**
   * Initialize credits for a new user (free tier)
   */
  async initializeCredits(userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('user_credits')
      .insert({
        user_id: userId,
        image_credits_total: 5,  // Free tier: 5 images
        video_credits_total: 1,  // Free tier: 1 video
        image_credits_used: 0,
        video_credits_used: 0
      });

    if (error) {
      console.error('[Credits] Error initializing credits:', error);
      return false;
    }

    console.log(`[Credits] Initialized free tier for user ${userId}: 5 images, 1 video`);
    return true;
  }

  /**
   * Check if user has sufficient credits
   */
  async checkCredits(
    userId: string,
    creditType: 'image' | 'video',
    amount: number
  ): Promise<CreditCheckResult> {
    const balance = await this.getBalance(userId);

    if (!balance) {
      return {
        hasCredits: false,
        available: 0,
        required: amount,
        creditType,
        unlimited: false
      };
    }

    const available = creditType === 'image' ? balance.imageCredits : balance.videoCredits;
    const unlimited = creditType === 'image' ? balance.unlimitedImages : balance.unlimitedVideos;

    return {
      hasCredits: unlimited || available >= amount,
      available: unlimited ? Infinity : available,
      required: amount,
      creditType,
      unlimited
    };
  }

  /**
   * Use credits (deduct from balance)
   */
  async useCredits(
    userId: string,
    creditType: 'image' | 'video',
    amount: number,
    taskId?: string,
    description?: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // Call the use_credits function
      const { data, error } = await this.supabase.rpc('use_credits', {
        p_user_id: userId,
        p_credit_type: creditType,
        p_amount: amount,
        p_task_id: taskId || null,
        p_description: description || `Used ${amount} ${creditType} credit(s)`,
        p_metadata: {}
      });

      if (error) {
        console.error('[Credits] Error using credits:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log(`[Credits] Used ${amount} ${creditType} credit(s) for user ${userId}`);
      return {
        success: true,
        transactionId: data
      };
    } catch (err: any) {
      console.error('[Credits] Exception using credits:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Add credits to user account
   */
  async addCredits(
    userId: string,
    creditType: 'image' | 'video',
    amount: number,
    transactionType: 'purchase' | 'bonus' | 'promo' | 'refund',
    description?: string,
    paymentId?: string,
    promoCode?: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const { data, error } = await this.supabase.rpc('add_credits', {
        p_user_id: userId,
        p_credit_type: creditType,
        p_amount: amount,
        p_transaction_type: transactionType,
        p_description: description || `Added ${amount} ${creditType} credit(s)`,
        p_metadata: {},
        p_payment_id: paymentId || null,
        p_promo_code: promoCode || null
      });

      if (error) {
        console.error('[Credits] Error adding credits:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log(`[Credits] Added ${amount} ${creditType} credit(s) for user ${userId}`);
      return {
        success: true,
        transactionId: data
      };
    } catch (err: any) {
      console.error('[Credits] Exception adding credits:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Create a credit confirmation request (for video generation)
   */
  async createConfirmation(
    userId: string,
    creditType: 'image' | 'video',
    creditsRequired: number,
    description: string,
    taskId?: string
  ): Promise<CreditConfirmation | null> {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const { data, error } = await this.supabase
      .from('credit_confirmations')
      .insert({
        user_id: userId,
        task_id: taskId || null,
        credit_type: creditType,
        credits_required: creditsRequired,
        description,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[Credits] Error creating confirmation:', error);
      return null;
    }

    console.log(`[Credits] Created confirmation ${data.id} for user ${userId}`);
    return {
      id: data.id,
      userId: data.user_id,
      taskId: data.task_id,
      creditType: data.credit_type,
      creditsRequired: data.credits_required,
      description: data.description,
      status: data.status,
      expiresAt: data.expires_at
    };
  }

  /**
   * Check confirmation status
   */
  async getConfirmation(confirmationId: string): Promise<CreditConfirmation | null> {
    const { data, error } = await this.supabase
      .from('credit_confirmations')
      .select('*')
      .eq('id', confirmationId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      taskId: data.task_id,
      creditType: data.credit_type,
      creditsRequired: data.credits_required,
      description: data.description,
      status: data.status,
      expiresAt: data.expires_at
    };
  }

  /**
   * Update confirmation status
   */
  async updateConfirmation(
    confirmationId: string,
    status: 'approved' | 'rejected'
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('credit_confirmations')
      .update({
        status,
        confirmed_at: new Date().toISOString()
      })
      .eq('id', confirmationId);

    if (error) {
      console.error('[Credits] Error updating confirmation:', error);
      return false;
    }

    console.log(`[Credits] Confirmation ${confirmationId} ${status}`);
    return true;
  }

  /**
   * Get credit packages
   */
  async getPackages(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('credit_packages')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[Credits] Error fetching packages:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get user's transaction history
   */
  async getTransactions(userId: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Credits] Error fetching transactions:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Format credit balance for display
   */
  formatBalance(balance: CreditBalance): string {
    return `Images: ${balance.imageCredits}/${balance.imageCreditsTotal} | Videos: ${balance.videoCredits}/${balance.videoCreditsTotal}`;
  }

  /**
   * Check if user needs to purchase credits
   */
  needsCredits(balance: CreditBalance, creditType: 'image' | 'video'): boolean {
    if (creditType === 'image') {
      return balance.imageCredits === 0;
    } else {
      return balance.videoCredits === 0;
    }
  }

  /**
   * Get upgrade message
   */
  getUpgradeMessage(creditType: 'image' | 'video'): string {
    if (creditType === 'image') {
      return 'You\'ve run out of image credits! Purchase the Image Pack (50 images for $10) or Creator Bundle (50 images + 20 videos for $20) to continue.';
    } else {
      return 'You\'ve run out of video credits! Purchase the Video Pack (20 videos for $15) or Creator Bundle (50 images + 20 videos for $20) to continue.';
    }
  }
}

/**
 * Helper function to create credit service instance
 */
export function createCreditService(supabase: SupabaseClient): CreditService {
  return new CreditService(supabase);
}
