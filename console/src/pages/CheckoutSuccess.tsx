// Checkout Success Page for Morgus
import { useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { Link } from 'react-router-dom';
import './Auth.css';

export function CheckoutSuccess() {
  const { refreshProfile } = useAuth();

  useEffect(() => {
    // Refresh profile to get updated subscription status
    refreshProfile();
  }, [refreshProfile]);

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-header">
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
          <h1>Welcome to Morgus!</h1>
          <p>Your subscription is now active</p>
        </div>

        <div className="auth-success">
          <p>Thank you for subscribing! You now have full access to all Morgus features.</p>
          <p style={{ marginTop: '16px' }}>
            <strong>What's next?</strong>
          </p>
          <ul style={{ textAlign: 'left', marginTop: '12px', paddingLeft: '20px' }}>
            <li>Build unlimited websites</li>
            <li>Generate images and videos</li>
            <li>Use all Morgy tools</li>
            <li>Connect your GitHub</li>
          </ul>
        </div>

        <Link to="/" className="auth-button primary">
          Start Building! 🚀
        </Link>

        <p className="auth-footer" style={{ marginTop: '24px' }}>
          Need help? <a href="mailto:support@morgus.ai">Contact support</a>
        </p>
      </div>
    </div>
  );
}
