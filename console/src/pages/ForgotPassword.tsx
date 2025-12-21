// Forgot Password Page for Morgus
import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Link } from 'react-router-dom';
import './Auth.css';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await resetPassword(email);
    
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <span className="logo-icon">🐷</span>
              <span className="logo-text">Morgus</span>
            </div>
            <h1>Check your email!</h1>
            <p>We sent a password reset link to <strong>{email}</strong></p>
          </div>

          <div className="auth-success">
            <p>Click the link in the email to reset your password.</p>
            <p>Didn't receive it? Check your spam folder or try again.</p>
          </div>

          <Link to="/login" className="auth-button secondary">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">🐷</span>
            <span className="logo-text">Morgus</span>
          </div>
          <h1>Reset your password</h1>
          <p>Enter your email and we'll send you a reset link</p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <button type="submit" className="auth-button primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="auth-footer">
          Remember your password? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
