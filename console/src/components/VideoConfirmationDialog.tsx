/**
 * Video Confirmation Dialog
 * Shows confirmation before generating videos (which cost credits)
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';

interface VideoConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: (confirmationId: string) => void;
  onCancel: () => void;
  description: string;
  creditsRequired?: number;
}

export function VideoConfirmationDialog({
  isOpen,
  onConfirm,
  onCancel,
  description,
  creditsRequired = 1
}: VideoConfirmationDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoCredits, setVideoCredits] = useState<number | null>(null);
  const [confirmationId, setConfirmationId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (isOpen && user) {
      createConfirmation();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('Expired');
        clearInterval(interval);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const createConfirmation = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch current balance
      const balanceResponse = await fetch(
        `https://morgus-deploy.fly.dev/api/credits/balance?user_id=${user.id}`
      );

      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setVideoCredits(balanceData.balance.videos.remaining);
      }

      // Create confirmation
      const confirmResponse = await fetch(
        'https://morgus-deploy.fly.dev/api/credits/confirm/create',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            credit_type: 'video',
            credits_required: creditsRequired,
            description: description
          })
        }
      );

      if (!confirmResponse.ok) {
        throw new Error('Failed to create confirmation');
      }

      const confirmData = await confirmResponse.json();
      setConfirmationId(confirmData.confirmation.id);
      setExpiresAt(new Date(confirmData.confirmation.expiresAt));
    } catch (err) {
      console.error('[VideoConfirmation] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmationId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://morgus-deploy.fly.dev/api/credits/confirm/${confirmationId}/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to approve confirmation');
      }

      onConfirm(confirmationId);
    } catch (err) {
      console.error('[VideoConfirmation] Error approving:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (confirmationId) {
      try {
        await fetch(
          `https://morgus-deploy.fly.dev/api/credits/confirm/${confirmationId}/reject`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }
        );
      } catch (err) {
        console.error('[VideoConfirmation] Error rejecting:', err);
      }
    }
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="video-confirmation-overlay" onClick={handleCancel}>
      <div className="video-confirmation-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>🎥 Generate Video?</h3>
          {timeRemaining && (
            <div className="dialog-timer">
              Expires in: <strong>{timeRemaining}</strong>
            </div>
          )}
        </div>

        <div className="dialog-content">
          <p className="dialog-description">{description}</p>

          <div className="dialog-cost">
            <div className="cost-item">
              <span className="cost-label">Cost:</span>
              <span className="cost-value">{creditsRequired} video credit{creditsRequired > 1 ? 's' : ''}</span>
            </div>
            
            {videoCredits !== null && (
              <div className="cost-item">
                <span className="cost-label">Your balance:</span>
                <span className={`cost-value ${videoCredits < creditsRequired ? 'insufficient' : ''}`}>
                  {videoCredits} credit{videoCredits !== 1 ? 's' : ''} remaining
                </span>
              </div>
            )}
          </div>

          {videoCredits !== null && videoCredits < creditsRequired && (
            <div className="dialog-warning">
              ⚠️ Insufficient credits. You need {creditsRequired - videoCredits} more video credit{(creditsRequired - videoCredits) > 1 ? 's' : ''}.
            </div>
          )}

          {error && (
            <div className="dialog-error">
              ❌ {error}
            </div>
          )}
        </div>

        <div className="dialog-actions">
          <button
            className="dialog-btn dialog-btn-cancel"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          
          {videoCredits !== null && videoCredits < creditsRequired ? (
            <a
              href="/pricing"
              className="dialog-btn dialog-btn-upgrade"
            >
              Buy Credits
            </a>
          ) : (
            <button
              className="dialog-btn dialog-btn-confirm"
              onClick={handleConfirm}
              disabled={loading || !confirmationId}
            >
              {loading ? 'Processing...' : 'Generate Video'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// CSS styles (to be added to App.css or a separate CSS file)
export const videoConfirmationStyles = `
.video-confirmation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.video-confirmation-dialog {
  background: #1a1a2e;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h3 {
  margin: 0;
  font-size: 24px;
  color: #fff;
}

.dialog-timer {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.dialog-timer strong {
  color: #667eea;
  font-weight: 600;
}

.dialog-content {
  padding: 24px;
}

.dialog-description {
  margin: 0 0 20px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

.dialog-cost {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.cost-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.cost-item:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.cost-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.cost-value {
  color: #fff;
  font-weight: 600;
  font-size: 16px;
}

.cost-value.insufficient {
  color: #ff6b6b;
}

.dialog-warning {
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 8px;
  padding: 12px;
  color: #ff6b6b;
  font-size: 14px;
  margin-bottom: 16px;
}

.dialog-error {
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 8px;
  padding: 12px;
  color: #ff6b6b;
  font-size: 14px;
}

.dialog-actions {
  padding: 16px 24px 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.dialog-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.dialog-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dialog-btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.dialog-btn-cancel:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.dialog-btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.dialog-btn-confirm:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.dialog-btn-upgrade {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.dialog-btn-upgrade:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(245, 87, 108, 0.4);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .video-confirmation-dialog {
    width: 95%;
    max-height: 95vh;
  }
  
  .dialog-header {
    padding: 20px 20px 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .dialog-header h3 {
    font-size: 20px;
  }
  
  .dialog-content {
    padding: 20px;
  }
  
  .dialog-actions {
    padding: 12px 20px 20px;
    flex-direction: column-reverse;
  }
  
  .dialog-btn {
    width: 100%;
  }
}
`;
