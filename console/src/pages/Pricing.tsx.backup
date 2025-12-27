// Pricing Page for Morgus
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import './Pricing.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://morgus-orchestrator.morgan-426.workers.dev';

interface Plan {
  id: 'free' | 'daily' | 'weekly' | 'monthly';
  name: string;
  price: number;
  priceLabel: string;
  period: string;
  billingType: 'free' | 'one-time' | 'subscription';
  description: string;
  features: string[];
  highlight?: boolean;
  badge?: string;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: '$0',
    period: 'forever',
    billingType: 'free',
    description: 'Try Morgus with basic features',
    features: [
      '20 messages per day',
      '1 website build per day',
      '1 deployment per day',
      '3 image generations per day',
      '10 web searches per day',
      '1 basic Morgy companion',
    ],
  },
  {
    id: 'daily',
    name: 'Day Pass',
    price: 3,
    priceLabel: '$3',
    period: 'one-time',
    billingType: 'one-time',
    description: 'Full access for 24 hours — no subscription!',
    features: [
      'Unlimited messages',
      'Unlimited website builds',
      'Unlimited deployments',
      'Unlimited image generations',
      'Unlimited web searches',
      '2 video generations',
      'GitHub integration',
      'All Morgy tools unlocked',
    ],
  },
  {
    id: 'weekly',
    name: 'Weekly',
    price: 21,
    priceLabel: '$21',
    period: '/week',
    billingType: 'subscription',
    description: 'Best value for regular users',
    features: [
      'Everything in Day Pass',
      '10 video generations per day',
      'Priority support',
      'Early access to new features',
      'Save $0/week vs daily',
    ],
    highlight: true,
    badge: 'Most Popular',
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 75,
    priceLabel: '$75',
    period: '/month',
    billingType: 'subscription',
    description: 'Maximum power for power users',
    features: [
      'Everything in Weekly',
      'Unlimited video generations',
      'Custom Morgy skins',
      'API access',
      'Team collaboration (coming soon)',
      'Save $9/month vs weekly',
    ],
    badge: 'Best Value',
  },
];

export function Pricing() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free') {
      if (!user) {
        navigate('/signup');
      }
      return;
    }

    if (!user) {
      navigate(`/signup?redirect=/pricing`);
      return;
    }

    setLoading(planId);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          planId,
          successUrl: `${window.location.origin}/checkout/success`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout');
      setLoading(null);
    }
  };

  const currentPlan = profile?.subscription_tier || 'free';

  return (
    <div className="pricing-container">
      <div className="pricing-header">
        <h1>Choose Your Plan</h1>
        <p>Unlock the full power of Morgus AI Agent</p>
      </div>

      {error && (
        <div className="pricing-error">
          {error}
        </div>
      )}

      <div className="pricing-grid">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`pricing-card ${plan.highlight ? 'highlight' : ''} ${currentPlan === plan.id ? 'current' : ''}`}
          >
            {plan.badge && <div className="pricing-badge">{plan.badge}</div>}
            {currentPlan === plan.id && <div className="current-badge">Current Plan</div>}
            
            <h2>{plan.name}</h2>
            <div className="pricing-price">
              <span className="price">{plan.priceLabel}</span>
              <span className="period">{plan.period}</span>
            </div>
            {plan.billingType === 'subscription' && (
              <div className="billing-type-badge subscription">Auto-renews</div>
            )}
            {plan.billingType === 'one-time' && (
              <div className="billing-type-badge one-time">One-time purchase</div>
            )}
            <p className="pricing-description">{plan.description}</p>
            
            <ul className="pricing-features">
              {plan.features.map((feature, index) => (
                <li key={index}>
                  <span className="check">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={`pricing-button ${plan.highlight ? 'primary' : 'secondary'}`}
              onClick={() => handleSelectPlan(plan.id)}
              disabled={loading === plan.id || currentPlan === plan.id}
            >
              {loading === plan.id ? 'Loading...' : 
               currentPlan === plan.id ? 'Current Plan' :
               plan.id === 'free' ? 'Get Started' : 
               plan.billingType === 'one-time' ? 'Buy Day Pass' : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>

      <div className="pricing-faq">
        <h2>Frequently Asked Questions</h2>
        
        <div className="faq-item">
          <h3>Can I cancel anytime?</h3>
          <p>Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
        </div>
        
        <div className="faq-item">
          <h3>What payment methods do you accept?</h3>
          <p>We accept all major credit cards through Stripe, including Visa, Mastercard, American Express, and more.</p>
        </div>
        
        <div className="faq-item">
          <h3>What are Day Passes?</h3>
          <p>Day Passes give you 24 hours of full access. You can earn free Day Passes by referring friends or redeeming promo codes!</p>
        </div>
        
        <div className="faq-item">
          <h3>What happens when I hit my free tier limits?</h3>
          <p>You'll see a friendly upgrade prompt. You can either wait until tomorrow when limits reset, or upgrade to continue immediately.</p>
        </div>
      </div>

      <div className="pricing-footer">
        <p>Have questions? <a href="mailto:support@morgus.ai">Contact us</a></p>
      </div>
    </div>
  );
}
