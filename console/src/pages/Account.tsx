// Account/Settings Page for Morgus
import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import './Account.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://morgus-orchestrator.morgan-426.workers.dev';

interface UsageData {
  messages: { current: number; limit: number; remaining: number };
  builds: { current: number; limit: number; remaining: number };
  deployments: { current: number; limit: number; remaining: number };
  images: { current: number; limit: number; remaining: number };
  searches: { current: number; limit: number; remaining: number };
  videos: { current: number; limit: number; remaining: number };
}

interface ReferralData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  nextMilestone: { count: number; reward: string } | null;
}

export function Account() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/account');
      return;
    }

    // Fetch usage data
    fetchUsage();
    fetchReferral();
  }, [user, navigate]);

  const fetchUsage = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/api/usage/${user.id}`);
      const data = await response.json();
      setUsage(data.usage);
    } catch {
      console.error('Failed to fetch usage:', error);
    }
  };

  const fetchReferral = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/api/referral/${user.id}`);
      const data = await response.json();
      setReferral(data);
    } catch {
      console.error('Failed to fetch referral:', error);
    }
  };

  const handleRedeemPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !promoCode.trim()) return;

    setPromoLoading(true);
    setPromoMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/promo/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          code: promoCode.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPromoMessage({ type: 'success', text: data.message });
        setPromoCode('');
        refreshProfile();
      } else {
        setPromoMessage({ type: 'error', text: data.message });
      }
    } catch {
      setPromoMessage({ type: 'error', text: 'Failed to redeem promo code' });
    } finally {
      setPromoLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!user) return;

    setBillingLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/billing-portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          returnUrl: window.location.href,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to open billing portal');
      }
    } catch {
      alert('Failed to open billing portal');
    } finally {
      setBillingLoading(false);
    }
  };

  const handleUseDayPass = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_URL}/api/wallet/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        refreshProfile();
      } else {
        alert(data.message);
      }
    } catch {
      alert('Failed to use day pass');
    }
  };

  const copyReferralLink = () => {
    if (referral?.referralLink) {
      navigator.clipboard.writeText(referral.referralLink);
      alert('Referral link copied!');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user || !profile) {
    return <div className="account-loading">Loading...</div>;
  }


  return (
    <div className="account-container">
      <div className="account-header">
        <h1>Account Settings</h1>
        <button onClick={handleSignOut} className="sign-out-button">
          Sign Out
        </button>
      </div>

      <div className="account-grid">
        {/* Profile Section */}
        <div className="account-card">
          <h2>Profile</h2>
          <div className="profile-info">
            <div className="profile-avatar">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" />
              ) : (
                <img src="/bill-avatar-large.png" alt="Bill" />
              )}
            </div>
            <div className="profile-details">
              <p className="profile-name">{profile.display_name || 'Morgus User'}</p>
              <p className="profile-email">{profile.email}</p>
            </div>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="account-card">
          <h2>Subscription</h2>
          <div className="subscription-info">
            <div className="subscription-badge" data-tier={profile.subscription_tier}>
              {profile.subscription_tier === 'free' ? 'Free' :
               profile.subscription_tier === 'daily' ? 'Day Pass' :
               profile.subscription_tier === 'weekly' ? 'Weekly' :
               profile.subscription_tier === 'monthly' ? 'Monthly' : 'Free'}
            </div>
            {profile.subscription_ends_at && profile.subscription_tier !== 'free' && (
              <p className="subscription-expires">
                Expires: {new Date(profile.subscription_ends_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="subscription-actions">
            {profile.subscription_tier === 'free' ? (
              <button onClick={() => navigate('/pricing')} className="upgrade-button">
                Upgrade Now
              </button>
            ) : (
              <button onClick={handleManageBilling} disabled={billingLoading} className="manage-button">
                {billingLoading ? 'Loading...' : 'Manage Billing'}
              </button>
            )}
          </div>
        </div>

        {/* Day Pass Wallet */}
        <div className="account-card">
          <h2>Day Pass Wallet</h2>
          <div className="wallet-balance">
            <span className="balance-number">{profile.day_pass_balance || 0}</span>
            <span className="balance-label">Day Passes</span>
          </div>
          {(profile.day_pass_balance || 0) > 0 && profile.subscription_tier === 'free' && (
            <button onClick={handleUseDayPass} className="use-pass-button">
              Use Day Pass
            </button>
          )}
          <p className="wallet-hint">Earn day passes by referring friends or redeeming promo codes!</p>
        </div>

        {/* Promo Code Section */}
        <div className="account-card">
          <h2>Redeem Promo Code</h2>
          <form onSubmit={handleRedeemPromo} className="promo-form">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Enter promo code"
              maxLength={20}
            />
            <button type="submit" disabled={promoLoading || !promoCode.trim()}>
              {promoLoading ? 'Redeeming...' : 'Redeem'}
            </button>
          </form>
          {promoMessage && (
            <div className={`promo-message ${promoMessage.type}`}>
              {promoMessage.text}
            </div>
          )}
        </div>

        {/* Referral Section */}
        <div className="account-card wide">
          <h2>Refer Friends</h2>
          <p className="referral-description">
            Share your referral link and earn free day passes! You get 1 day pass for each friend who signs up.
          </p>
          {referral && (
            <>
              <div className="referral-link-box">
                <input type="text" value={referral.referralLink} readOnly />
                <button onClick={copyReferralLink}>Copy</button>
              </div>
              <div className="referral-stats">
                <div className="stat">
                  <span className="stat-number">{referral.completedReferrals}</span>
                  <span className="stat-label">Successful Referrals</span>
                </div>
                <div className="stat">
                  <span className="stat-number">{referral.pendingReferrals}</span>
                  <span className="stat-label">Pending</span>
                </div>
                {referral.nextMilestone && (
                  <div className="stat milestone">
                    <span className="stat-number">{referral.nextMilestone.count - referral.completedReferrals}</span>
                    <span className="stat-label">Until: {referral.nextMilestone.reward}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Usage Section */}
        <div className="account-card wide">
          <h2>Today's Usage</h2>
          {usage && (
            <div className="usage-grid">
              <UsageBar label="Messages" current={usage.messages.current} limit={usage.messages.limit} />
              <UsageBar label="Builds" current={usage.builds.current} limit={usage.builds.limit} />
              <UsageBar label="Deployments" current={usage.deployments.current} limit={usage.deployments.limit} />
              <UsageBar label="Images" current={usage.images.current} limit={usage.images.limit} />
              <UsageBar label="Searches" current={usage.searches.current} limit={usage.searches.limit} />
              <UsageBar label="Videos" current={usage.videos.current} limit={usage.videos.limit} />
            </div>
          )}
          <p className="usage-hint">Usage resets daily at midnight UTC</p>
        </div>
      </div>
    </div>
  );
}

function UsageBar({ label, current, limit }: { label: string; current: number; limit: number }) {
  const percentage = limit === -1 ? 0 : Math.min((current / limit) * 100, 100);
  const isUnlimited = limit === -1;

  return (
    <div className="usage-item">
      <div className="usage-header">
        <span className="usage-label">{label}</span>
        <span className="usage-count">
          {current} / {isUnlimited ? '∞' : limit}
        </span>
      </div>
      <div className="usage-bar">
        <div
          className="usage-fill"
          style={{ width: isUnlimited ? '100%' : `${percentage}%` }}
          data-unlimited={isUnlimited}
        />
      </div>
    </div>
  );
}
