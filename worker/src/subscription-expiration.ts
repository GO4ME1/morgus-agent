// Subscription Expiration Checker for Morgus
// Automatically expires old subscriptions and day passes
// Run this as a scheduled Cloudflare Worker cron job

interface ExpirationEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

export class SubscriptionExpirationService {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(env: ExpirationEnv) {
    this.supabaseUrl = env.SUPABASE_URL;
    this.supabaseKey = env.SUPABASE_SERVICE_KEY;
  }

  /**
   * Run the expiration check
   * This should be called by a cron job every hour
   */
  async checkAndExpireSubscriptions(): Promise<{
    expired: number;
    dayPassesExpired: number;
    errors: number;
  }> {
    const now = new Date().toISOString();
    let expired = 0;
    let dayPassesExpired = 0;
    let errors = 0;

    try {
      // 1. Expire subscriptions in the subscriptions table
      const subscriptionsExpired = await this.expireSubscriptionsTable(now);
      expired += subscriptionsExpired;

      // 2. Expire day passes in the profiles table
      const dayPassesExpiredCount = await this.expireDayPasses(now);
      dayPassesExpired += dayPassesExpiredCount;

      // 3. Expire subscriptions in the profiles table
      const profilesExpired = await this.expireProfileSubscriptions(now);
      expired += profilesExpired;

      console.log(`Expiration check complete: ${expired} subscriptions expired, ${dayPassesExpired} day passes expired, ${errors} errors`);
    } catch (error) {
      console.error('Error during expiration check:', error);
      errors++;
    }

    return { expired, dayPassesExpired, errors };
  }

  /**
   * Expire subscriptions in the subscriptions table
   */
  private async expireSubscriptionsTable(now: string): Promise<number> {
    try {
      // Find all active subscriptions that have expired
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/subscriptions?status=eq.active&expires_at=lt.${now}`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
          },
        }
      );

      const expiredSubscriptions = await response.json() as any[];

      if (!expiredSubscriptions.length) {
        return 0;
      }

      // Update each expired subscription
      for (const subscription of expiredSubscriptions) {
        await fetch(
          `${this.supabaseUrl}/rest/v1/subscriptions?id=eq.${subscription.id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': this.supabaseKey,
              'Authorization': `Bearer ${this.supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              status: 'expired',
            }),
          }
        );
      }

      console.log(`Expired ${expiredSubscriptions.length} subscriptions in subscriptions table`);
      return expiredSubscriptions.length;
    } catch (error) {
      console.error('Error expiring subscriptions table:', error);
      return 0;
    }
  }

  /**
   * Expire day passes in the profiles table
   */
  private async expireDayPasses(now: string): Promise<number> {
    try {
      // Find all profiles with expired day passes
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/profiles?day_pass_expires_at=lt.${now}&day_pass_balance=gt.0`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
          },
        }
      );

      const expiredProfiles = await response.json() as any[];

      if (!expiredProfiles.length) {
        return 0;
      }

      // Update each expired day pass
      for (const profile of expiredProfiles) {
        await fetch(
          `${this.supabaseUrl}/rest/v1/profiles?id=eq.${profile.id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': this.supabaseKey,
              'Authorization': `Bearer ${this.supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              day_pass_balance: 0,
              day_pass_expires_at: null,
              subscription_status: profile.stripe_subscription_id ? profile.subscription_status : 'free',
              subscription_tier: profile.stripe_subscription_id ? profile.subscription_tier : 'free',
            }),
          }
        );
      }

      console.log(`Expired ${expiredProfiles.length} day passes`);
      return expiredProfiles.length;
    } catch (error) {
      console.error('Error expiring day passes:', error);
      return 0;
    }
  }

  /**
   * Expire subscriptions in the profiles table
   */
  private async expireProfileSubscriptions(now: string): Promise<number> {
    try {
      // Find all profiles with expired subscriptions
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/profiles?subscription_ends_at=lt.${now}&subscription_status=neq.free&subscription_status=neq.cancelled`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
          },
        }
      );

      const expiredProfiles = await response.json() as any[];

      if (!expiredProfiles.length) {
        return 0;
      }

      // Update each expired subscription
      for (const profile of expiredProfiles) {
        await fetch(
          `${this.supabaseUrl}/rest/v1/profiles?id=eq.${profile.id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': this.supabaseKey,
              'Authorization': `Bearer ${this.supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              subscription_status: 'expired',
            }),
          }
        );
      }

      console.log(`Expired ${expiredProfiles.length} subscriptions in profiles table`);
      return expiredProfiles.length;
    } catch (error) {
      console.error('Error expiring profile subscriptions:', error);
      return 0;
    }
  }

  /**
   * Reset daily usage counters
   * This should be called by a cron job at midnight UTC
   */
  async resetDailyUsage(): Promise<{ reset: number; errors: number }> {
    let reset = 0;
    let errors = 0;

    try {
      // Get yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Archive yesterday's usage (optional - for analytics)
      // This keeps the usage_tracking table clean and fast
      
      // Note: We don't actually delete old records here
      // Instead, the subscription middleware automatically creates new records for today
      // Old records can be archived or deleted by a separate cleanup job

      console.log(`Daily usage reset complete for ${yesterdayStr}`);
      reset = 1;
    } catch (error) {
      console.error('Error resetting daily usage:', error);
      errors++;
    }

    return { reset, errors };
  }

  /**
   * Clean up old usage records (older than 90 days)
   * This should be called by a cron job once a week
   */
  async cleanupOldUsageRecords(): Promise<{ deleted: number; errors: number }> {
    let deleted = 0;
    let errors = 0;

    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const cutoffDate = ninetyDaysAgo.toISOString().split('T')[0];

      // Delete old usage records
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/usage_tracking?date=lt.${cutoffDate}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Prefer': 'return=representation',
          },
        }
      );

      if (response.ok) {
        const deletedRecords = await response.json() as any[];
        deleted = deletedRecords.length;
        console.log(`Deleted ${deleted} old usage records (older than ${cutoffDate})`);
      }
    } catch (error) {
      console.error('Error cleaning up old usage records:', error);
      errors++;
    }

    return { deleted, errors };
  }
}

/**
 * Cloudflare Worker scheduled event handler
 * Add this to your wrangler.toml:
 * 
 * [triggers]
 * crons = [
 *   "0 * * * *",      # Every hour - check for expired subscriptions
 *   "0 0 * * *",      # Daily at midnight UTC - reset daily usage
 *   "0 0 * * 0"       # Weekly on Sunday - cleanup old records
 * ]
 */
export async function handleScheduledEvent(
  event: ScheduledEvent,
  env: ExpirationEnv
): Promise<void> {
  const service = new SubscriptionExpirationService(env);

  // Determine which job to run based on the cron schedule
  const cron = event.cron;

  if (cron === '0 * * * *') {
    // Hourly: Check for expired subscriptions
    const result = await service.checkAndExpireSubscriptions();
    console.log('Hourly expiration check:', result);
  } else if (cron === '0 0 * * *') {
    // Daily: Reset daily usage
    const result = await service.resetDailyUsage();
    console.log('Daily usage reset:', result);
  } else if (cron === '0 0 * * 0') {
    // Weekly: Cleanup old records
    const result = await service.cleanupOldUsageRecords();
    console.log('Weekly cleanup:', result);
  }
}

// Export for use in main worker
export function createExpirationService(env: ExpirationEnv): SubscriptionExpirationService {
  return new SubscriptionExpirationService(env);
}
