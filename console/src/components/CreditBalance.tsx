/**
 * Credit Balance Widget
 * Displays user's image and video credits in the header
 */

import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';

interface CreditBalance {
  images: {
    total: number;
    used: number;
    remaining: number;
  };
  videos: {
    total: number;
    used: number;
    remaining: number;
  };
}

export function CreditBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchBalance();
    
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchBalance = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `https://morgus-deploy.fly.dev/api/credits/balance?user_id=${user.id}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch credit balance');
      }

      const data = await response.json();
      setBalance(data.balance);
      setError(null);
    } catch (err) {
      console.error('[Credits] Error fetching balance:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;
  if (loading) {
    return (
      <div className="credit-balance loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !balance) {
    return (
      <div className="credit-balance error" title={error || 'Failed to load credits'}>
        <span className="credit-icon">💳</span>
        <span className="credit-text">Credits unavailable</span>
      </div>
    );
  }

  const imageCredits = balance.images.remaining;
  const videoCredits = balance.videos.remaining;
  const lowImageCredits = imageCredits <= 2;
  const lowVideoCredits = videoCredits === 0;

  return (
    <div className="credit-balance">
      <div className="credit-item" title={`${imageCredits} of ${balance.images.total} image credits remaining`}>
        <span className="credit-icon">🖼️</span>
        <span className={`credit-count ${lowImageCredits ? 'low' : ''}`}>
          {imageCredits}
        </span>
      </div>
      
      <div className="credit-item" title={`${videoCredits} of ${balance.videos.total} video credits remaining`}>
        <span className="credit-icon">🎥</span>
        <span className={`credit-count ${lowVideoCredits ? 'low' : ''}`}>
          {videoCredits}
        </span>
      </div>
      
      {(lowImageCredits || lowVideoCredits) && (
        <a href="/pricing" className="credit-upgrade-btn" title="Buy more credits">
          <span>+</span>
        </a>
      )}
    </div>
  );
}

// CSS styles (to be added to App.css or a separate CSS file)
export const creditBalanceStyles = `
.credit-balance {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  transition: all 0.2s ease;
}

.credit-balance:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.credit-balance.loading {
  padding: 12px 20px;
  justify-content: center;
}

.credit-balance.error {
  opacity: 0.5;
  cursor: help;
}

.credit-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.credit-icon {
  font-size: 16px;
  line-height: 1;
}

.credit-count {
  font-weight: 600;
  color: #fff;
  min-width: 20px;
  text-align: center;
}

.credit-count.low {
  color: #ff6b6b;
  animation: pulse-low 2s ease-in-out infinite;
}

@keyframes pulse-low {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.credit-upgrade-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  color: white;
  font-size: 18px;
  font-weight: bold;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.credit-upgrade-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.credit-upgrade-btn span {
  line-height: 1;
  margin-top: -2px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .credit-balance {
    background: rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.05);
  }
  
  .credit-balance:hover {
    background: rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .credit-balance {
    padding: 6px 12px;
    gap: 8px;
    font-size: 12px;
  }
  
  .credit-icon {
    font-size: 14px;
  }
  
  .credit-upgrade-btn {
    width: 20px;
    height: 20px;
    font-size: 16px;
  }
}
`;
