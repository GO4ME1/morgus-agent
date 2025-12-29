// Updated Pricing Page for Morgus with Credit Packs
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import './Pricing.css';
import './PricingCreditPacks.css';

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

interface CreditPack {
  id: string;
  name: string;
  price: number;
  imageCredits?: number;
  videoCredits?: number;
  perCredit?: number;
  description: string;
  badge?: string;
  type: 'video' | 'image' | 'bundle';
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

const VIDEO_PACKS: CreditPack[] = [
  {
    id: 'video-small',
    name: 'Small Video Pack',
    price: 5,
    videoCredits: 5,
    perCredit: 1.00,
    description: 'Perfect for quick projects',
    type: 'video',
  },
  {
    id: 'video-medium',
    name: 'Video Pack',
    price: 10,
    videoCredits: 15,
    perCredit: 0.67,
    description: 'Best for regular usage',
    badge: 'POPULAR',
    type: 'video',
  },
  {
    id: 'video-large',
    name: 'Large Video Pack',
    price: 15,
    videoCredits: 25,
    perCredit: 0.60,
    description: 'Maximum savings',
    badge: 'BEST VALUE',
    type: 'video',
  },
];

const IMAGE_PACKS: CreditPack[] = [
  {
    id: 'image-small',
    name: 'Small Image Pack',
    price: 5,
    imageCredits: 25,
    perCredit: 0.20,
    description: 'Perfect for trying it out',
    type: 'image',
  },
  {
    id: 'image-medium',
    name: 'Image Pack',
    price: 10,
    imageCredits: 60,
    perCredit: 0.17,
    description: 'Best for regular usage',
    badge: 'POPULAR',
    type: 'image',
  },
  {
    id: 'image-large',
    name: 'Large Image Pack',
    price: 15,
    imageCredits: 100,
    perCredit: 0.15,
    description: 'Maximum savings',
    badge: 'BEST VALUE',
    type: 'image',
  },
];

const BUNDLES: CreditPack[] = [
  {
    id: 'bundle-starter',
    name: 'Starter Bundle',
    price: 10,
    imageCredits: 25,
    videoCredits: 5,
    description: 'Great for new users',
    type: 'bundle',
  },
  {
    id: 'bundle-creator',
    name: 'Creator Bundle',
    price: 15,
    imageCredits: 60,
    videoCredits: 15,
    description: 'Best for regular creators',
    badge: 'SAVE $5',
    type: 'bundle',
  },
  {
    id: 'bundle-pro',
    name: 'Pro Bundle',
    price: 25,
    imageCredits: 100,
    videoCredits: 25,
    description: 'Maximum power',
    badge: 'SAVE $5',
    type: 'bundle',
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
    } catch (err: unknown) {
      setError(err.message || 'Failed to start checkout');
      setLoading(null);
    }
  };

  const handleBuyPack = async (packId: string, _: number) => {
    if (!user) {
      navigate(`/signup?redirect=/pricing`);
      return;
    }

    setLoading(packId);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/checkout/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          packId,
          successUrl: `${window.location.origin}/checkout/success?type=credits`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (err: unknown) {
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

      {/* Subscription Plans */}
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

      {/* Credit Packs Section */}
      <div className="credit-packs-section">
        <div className="section-header">
          <h2>Need Extra Credits?</h2>
          <p>Buy exactly what you need, when you need it.</p>
          <p className="subtitle">Perfect for Day Pass and Weekly users who need more videos!</p>
        </div>

        {/* Video Packs */}
        <div className="pack-category">
          <h3>🎥 Video Packs</h3>
          <div className="pack-grid">
            {VIDEO_PACKS.map((pack) => (
              <div key={pack.id} className="pack-card">
                {pack.badge && <div className="pack-badge">{pack.badge}</div>}
                <h4>{pack.name}</h4>
                <div className="pack-price">
                  <span className="price">${pack.price}</span>
                </div>
                <div className="pack-credits">
                  {pack.videoCredits} videos
                </div>
                {pack.perCredit && (
                  <div className="pack-per-credit">
                    ${pack.perCredit.toFixed(2)} per video
                  </div>
                )}
                <p className="pack-description">{pack.description}</p>
                <button
                  className="pack-button"
                  onClick={() => handleBuyPack(pack.id, pack.price)}
                  disabled={loading === pack.id}
                >
                  {loading === pack.id ? 'Loading...' : 'Buy Now'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Image Packs */}
        <div className="pack-category">
          <h3>🖼️ Image Packs</h3>
          <div className="pack-grid">
            {IMAGE_PACKS.map((pack) => (
              <div key={pack.id} className="pack-card">
                {pack.badge && <div className="pack-badge">{pack.badge}</div>}
                <h4>{pack.name}</h4>
                <div className="pack-price">
                  <span className="price">${pack.price}</span>
                </div>
                <div className="pack-credits">
                  {pack.imageCredits} images
                </div>
                {pack.perCredit && (
                  <div className="pack-per-credit">
                    ${pack.perCredit.toFixed(2)} per image
                  </div>
                )}
                <p className="pack-description">{pack.description}</p>
                <button
                  className="pack-button"
                  onClick={() => handleBuyPack(pack.id, pack.price)}
                  disabled={loading === pack.id}
                >
                  {loading === pack.id ? 'Loading...' : 'Buy Now'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bundles */}
        <div className="pack-category">
          <h3>📦 Bundles (Images + Videos)</h3>
          <div className="pack-grid">
            {BUNDLES.map((pack) => (
              <div key={pack.id} className="pack-card">
                {pack.badge && <div className="pack-badge">{pack.badge}</div>}
                <h4>{pack.name}</h4>
                <div className="pack-price">
                  <span className="price">${pack.price}</span>
                </div>
                <div className="pack-credits">
                  <div>{pack.imageCredits} images</div>
                  <div>{pack.videoCredits} videos</div>
                </div>
                <p className="pack-description">{pack.description}</p>
                <button
                  className="pack-button"
                  onClick={() => handleBuyPack(pack.id, pack.price)}
                  disabled={loading === pack.id}
                >
                  {loading === pack.id ? 'Loading...' : 'Buy Now'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="pricing-faq">
        <h2>Frequently Asked Questions</h2>
        
        <div className="faq-item">
          <h3>What are credit packs?</h3>
          <p>Credit packs let you purchase additional image or video generation credits without upgrading your subscription. They're perfect for when you need extra credits for a specific project!</p>
        </div>
        
        <div className="faq-item">
          <h3>Can I buy credit packs if I have a subscription?</h3>
          <p>Yes! All users can purchase credit packs. For example, if you have a Day Pass (2 videos included) and need 5 more videos, just buy a Small Video Pack for $5.</p>
        </div>
        
        <div className="faq-item">
          <h3>Do credit packs expire?</h3>
          <p>No! Your purchased credits never expire. Use them whenever you need them.</p>
        </div>
        
        <div className="faq-item">
          <h3>Which pack should I buy?</h3>
          <p>Just need a few? Buy a small pack ($5). Regular usage? Medium packs offer better value ($10). Heavy user? Large packs have the best per-credit price ($15).</p>
        </div>
        
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
          <p>You'll see a friendly upgrade prompt. You can either wait until tomorrow when limits reset, buy a credit pack, or upgrade to continue immediately.</p>
        </div>
      </div>

      <div className="pricing-footer">
        <p>Have questions? <a href="mailto:support@morgus.ai">Contact us</a></p>
      </div>
    </div>
  );
}
