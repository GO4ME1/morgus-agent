import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, TrendingUp, Calendar, Check } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { getBillingInfo, getPricingTiers, createCheckoutSession, createPortalSession } from '../lib/api-client';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  messagesPerMonth: number;
  features: string[];
  popular?: boolean;
}

interface UsageData {
  messagesUsed: number;
  messagesLimit: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

interface Subscription {
  id: string;
  tier: string;
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export const BillingDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [processingCheckout, setProcessingCheckout] = useState(false);

  useEffect(() => {
    loadBillingData();
  }, [user]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      // Load pricing tiers (public endpoint)
      const pricingData = await getPricingTiers();
      setPricingTiers(pricingData || []);

      // Load user's billing info if logged in
      if (user) {
        try {
          const billingInfo = await getBillingInfo();
          
          // Set subscription data
          if (billingInfo.subscription) {
            setSubscription({
              id: 'sub-id',
              tier: billingInfo.subscription.tier,
              status: billingInfo.subscription.status as 'active' | 'canceled' | 'past_due',
              currentPeriodEnd: billingInfo.subscription.current_period_end || '',
              cancelAtPeriodEnd: false,
            });
          }
          
          // Set usage data
          if (billingInfo.usage) {
            setUsage({
              messagesUsed: billingInfo.usage.credits_used,
              messagesLimit: billingInfo.usage.credits_limit,
              currentPeriodStart: new Date().toISOString(),
              currentPeriodEnd: billingInfo.subscription?.current_period_end || new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Failed to load user billing info:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (priceId: string) => {
    if (!user) {
      alert('Please log in to subscribe');
      return;
    }

    try {
      setProcessingCheckout(true);
      const data = await createCheckoutSession(priceId);
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setProcessingCheckout(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    try {
      const data = await createPortalSession();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to open portal:', error);
      alert('Failed to open billing portal');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getUsagePercentage = () => {
    if (!usage) return 0;
    return (usage.messagesUsed / usage.messagesLimit) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading billing information...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Billing & Subscription</h1>
          <p className="text-gray-400">Manage your Morgus subscription and view usage</p>
        </div>

        {/* Current Subscription Card */}
        {user && subscription && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`
                    px-3 py-1 rounded-full text-sm font-medium
                    ${subscription.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                      subscription.status === 'past_due' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'}
                  `}>
                    {subscription.status === 'active' ? '✓ Active' : 
                     subscription.status === 'past_due' ? '⚠ Past Due' : 
                     '⊗ Canceled'}
                  </span>
                  {subscription.cancelAtPeriodEnd && (
                    <span className="text-sm text-gray-400">
                      (Cancels on {formatDate(subscription.currentPeriodEnd)})
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleManageSubscription}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Manage Subscription
              </button>
            </div>

            {/* Usage Stats */}
            {usage && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Messages this month</span>
                  <span className="text-white font-medium">
                    {usage.messagesUsed.toLocaleString()} / {usage.messagesLimit.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      getUsagePercentage() > 90 ? 'bg-red-500' :
                      getUsagePercentage() > 75 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-sm text-gray-400">
                  <span>Period: {formatDate(usage.currentPeriodStart)}</span>
                  <span>Renews: {formatDate(usage.currentPeriodEnd)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pricing Tiers */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            {subscription ? 'Change Plan' : 'Choose Your Plan'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingTiers.map((tier) => (
              <div
                key={tier.id}
                className={`
                  bg-gray-800 rounded-lg p-6 border-2 transition-all
                  ${tier.popular 
                    ? 'border-purple-500 shadow-lg shadow-purple-500/20' 
                    : 'border-gray-700 hover:border-gray-600'
                  }
                  ${subscription?.tier === tier.id ? 'ring-2 ring-green-500' : ''}
                `}
              >
                {tier.popular && (
                  <div className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                    MOST POPULAR
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">${tier.price}</span>
                  {tier.price > 0 && <span className="text-gray-400">/month</span>}
                </div>

                <div className="mb-6">
                  <div className="text-gray-400 text-sm mb-2">
                    {tier.messagesPerMonth === -1 
                      ? 'Unlimited messages' 
                      : `${tier.messagesPerMonth.toLocaleString()} messages/month`
                    }
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {subscription?.tier === tier.id ? (
                  <button
                    disabled
                    className="w-full py-3 bg-green-500/20 text-green-400 rounded-lg font-medium cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleCheckout(tier.id)}
                    disabled={processingCheckout || tier.price === 0}
                    className={`
                      w-full py-3 rounded-lg font-medium transition-colors
                      ${tier.popular
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }
                      ${(processingCheckout || tier.price === 0) && 'opacity-50 cursor-not-allowed'}
                    `}
                  >
                    {tier.price === 0 ? 'Free Forever' : 'Subscribe Now'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Features Comparison */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">All Plans Include</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">Advanced AI Models</h4>
                <p className="text-sm text-gray-400">Access to GPT-4, Gemini, and more</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">24/7 Availability</h4>
                <p className="text-sm text-gray-400">Your Morgys work around the clock</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">No Hidden Fees</h4>
                <p className="text-sm text-gray-400">Cancel anytime, no commitments</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
