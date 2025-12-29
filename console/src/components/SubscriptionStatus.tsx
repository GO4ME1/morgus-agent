import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './SubscriptionStatus.css';

interface SubscriptionStatusProps {
  userId: string | null;
  onUpgradeClick: () => void;
}

interface UserProfile {
  subscription_tier: string;
  subscription_status: string;
  subscription_end_date: string | null;
  day_pass_balance: number;
  day_pass_expires_at: string | null;
}

interface UsageData {
  messages_used: number;
  builds_used: number;
  deploys_used: number;
  images_used: number;
  searches_used: number;
  videos_used: number;
}

const PLAN_LIMITS: Record<string, Record<string, number>> = {
  free: { messages: 20, builds: 1, deploys: 1, images: 3, searches: 10, videos: 0 },
  day_pass: { messages: -1, builds: -1, deploys: -1, images: -1, searches: -1, videos: 2 },
  weekly: { messages: -1, builds: -1, deploys: -1, images: -1, searches: -1, videos: 10 },
  monthly: { messages: -1, builds: -1, deploys: -1, images: -1, searches: -1, videos: -1 },
};

export function SubscriptionStatus({ userId, onUpgradeClick }: SubscriptionStatusProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);

  const loadProfile = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status, subscription_end_date, day_pass_balance, day_pass_expires_at')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  const loadUsage = async () => {
    if (!userId) return;

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('usage_tracking')
      .select('messages_used, builds_used, deploys_used, images_used, searches_used, videos_used')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (!error && data) {
      setUsage(data);
    } else {
      // No usage record for today yet
      setUsage({
        messages_used: 0,
        builds_used: 0,
        deploys_used: 0,
        images_used: 0,
        searches_used: 0,
        videos_used: 0,
      });
    }
  };

  useEffect(() => {
    if (userId) {
      loadProfile();
      loadUsage();
    }
  }, [userId]);

  // Update countdown timer
  useEffect(() => {
    if (!profile) return;

    const updateTimer = () => {
      let endDate: Date | null = null;
      
      if (profile.day_pass_balance > 0 && profile.day_pass_expires_at) {
        endDate = new Date(profile.day_pass_expires_at);
      } else if (profile.subscription_end_date && profile.subscription_status === 'active') {
        endDate = new Date(profile.subscription_end_date);
      }

      if (endDate) {
        const now = new Date();
        const diff = endDate.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeRemaining('Expired');
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          setTimeRemaining(`${days}d ${hours}h remaining`);
        } else if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m remaining`);
        } else {
          setTimeRemaining(`${minutes}m remaining`);
        }
      } else {
        setTimeRemaining('');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [profile]);

  if (!userId || !profile) {
    return null;
  }

  const currentTier = profile.day_pass_balance > 0 ? 'day_pass' : profile.subscription_tier;
  const limits = PLAN_LIMITS[currentTier] || PLAN_LIMITS.free;
  const isPaid = currentTier !== 'free';

  const getPlanDisplayName = () => {
    if (profile.day_pass_balance > 0) {
      return `Day Pass (${profile.day_pass_balance} days)`;
    }
    switch (profile.subscription_tier) {
      case 'weekly': return 'Weekly Plan';
      case 'monthly': return 'Monthly Plan';
      default: return 'Free Plan';
    }
  };

  const getPlanIcon = () => {
    if (isPaid) return '⭐';
    return '🆓';
  };

  // Usage percent calculation is done inline in UsageBar component

  return (
    <div className={`subscription-status ${isPaid ? 'premium' : 'free'} ${isExpanded ? 'expanded' : ''}`}>
      <div className="status-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="plan-info">
          <span className="plan-icon">{getPlanIcon()}</span>
          <span className="plan-name">{getPlanDisplayName()}</span>
          {timeRemaining && <span className="time-remaining">{timeRemaining}</span>}
        </div>
        <button className="expand-btn">{isExpanded ? '▲' : '▼'}</button>
      </div>

      {isExpanded && (
        <div className="status-details">
          <div className="usage-grid">
            <UsageBar 
              label="Messages" 
              used={usage?.messages_used || 0} 
              limit={limits.messages} 
            />
            <UsageBar 
              label="Builds" 
              used={usage?.builds_used || 0} 
              limit={limits.builds} 
            />
            <UsageBar 
              label="Deploys" 
              used={usage?.deploys_used || 0} 
              limit={limits.deploys} 
            />
            <UsageBar 
              label="Images" 
              used={usage?.images_used || 0} 
              limit={limits.images} 
            />
            <UsageBar 
              label="Searches" 
              used={usage?.searches_used || 0} 
              limit={limits.searches} 
            />
            <UsageBar 
              label="Videos" 
              used={usage?.videos_used || 0} 
              limit={limits.videos} 
            />
          </div>

          {!isPaid && (
            <button className="upgrade-btn" onClick={onUpgradeClick}>
              ⚡ Upgrade for Unlimited
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const isUnlimited = limit === -1;
  const isUnavailable = limit === 0;
  const percent = isUnlimited ? 0 : isUnavailable ? 100 : Math.min((used / limit) * 100, 100);
  const isWarning = percent >= 80 && percent < 100;
  const isExhausted = percent >= 100;

  return (
    <div className={`usage-bar ${isWarning ? 'warning' : ''} ${isExhausted ? 'exhausted' : ''}`}>
      <div className="usage-label">
        <span>{label}</span>
        <span className="usage-count">
          {isUnlimited ? '∞' : isUnavailable ? '🔒' : `${used}/${limit}`}
        </span>
      </div>
      {!isUnlimited && !isUnavailable && (
        <div className="usage-track">
          <div className="usage-fill" style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
  );
}
