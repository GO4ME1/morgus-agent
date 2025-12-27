import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface MorgyListing {
  id: string;
  morgy_id: string;
  seller_id: string;
  pricing_model: 'free' | 'trial' | 'monthly' | 'annual' | 'lifetime';
  price: number;
  average_rating: number;
  review_count: number;
  total_sales: number;
  morgy: {
    name: string;
    description: string;
    category: string;
    avatar_config: any;
    tags: string[];
  };
}

interface CreatorAnalytics {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSales: number;
  totalRevenue: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
  activeListing: number;
}

export function MorgyMarket() {
  const [listings, setListings] = useState<MorgyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatorDashboard, setShowCreatorDashboard] = useState(false);
  const [creatorAnalytics, setCreatorAnalytics] = useState<CreatorAnalytics | null>(null);

  const categories = [
    { id: 'all', name: 'All Morgys', icon: '🐷' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'marketing', name: 'Marketing', icon: '✨' },
    { id: 'research', name: 'Research', icon: '🎓' },
    { id: 'creative', name: 'Creative', icon: '🎨' },
    { id: 'technical', name: 'Technical', icon: '💻' },
  ];

  useEffect(() => {
    loadListings();
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    if (showCreatorDashboard) {
      loadCreatorAnalytics();
    }
  }, [showCreatorDashboard]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/market/listings?${params}`);
      const data = await response.json();
      setListings(data);
    } catch (error) {
      console.error('Failed to load listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCreatorAnalytics = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const response = await fetch('/api/creator/analytics', {
        headers: {
          'x-user-id': user.id
        }
      });
      const data = await response.json();
      setCreatorAnalytics(data);
    } catch (error) {
      console.error('Failed to load creator analytics:', error);
    }
  };

  const getTierBadge = (tier: string) => {
    const badges = {
      bronze: { color: 'bg-orange-100 text-orange-800', icon: '🥉', split: '70/30' },
      silver: { color: 'bg-gray-100 text-gray-800', icon: '🥈', split: '75/25' },
      gold: { color: 'bg-yellow-100 text-yellow-800', icon: '🥇', split: '80/20' },
      platinum: { color: 'bg-purple-100 text-purple-800', icon: '💎', split: '85/15' }
    };
    return badges[tier as keyof typeof badges] || badges.bronze;
  };

  const getPriceDisplay = (listing: MorgyListing) => {
    if (listing.pricing_model === 'free') return 'Free';
    if (listing.pricing_model === 'trial') return `$${listing.price}/mo (7-day trial)`;
    if (listing.pricing_model === 'monthly') return `$${listing.price}/mo`;
    if (listing.pricing_model === 'annual') return `$${listing.price}/yr`;
    if (listing.pricing_model === 'lifetime') return `$${listing.price} (lifetime)`;
    return `$${listing.price}`;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-sm text-gray-600 ml-1">
          {rating.toFixed(1)} ({listing.review_count})
        </span>
      </div>
    );
  };

  if (showCreatorDashboard) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your Morgys and track earnings</p>
            </div>
            <button
              onClick={() => setShowCreatorDashboard(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Market
            </button>
          </div>

          {creatorAnalytics && (
            <>
              {/* Tier Badge */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Creator Tier</h2>
                    <div className="flex items-center space-x-3">
                      <span className={`px-4 py-2 rounded-full text-lg font-semibold ${getTierBadge(creatorAnalytics.tier).color}`}>
                        {getTierBadge(creatorAnalytics.tier).icon} {creatorAnalytics.tier.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-600">
                        Revenue Split: {getTierBadge(creatorAnalytics.tier).split}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Next Tier</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {creatorAnalytics.tier === 'bronze' && '26 sales for Silver'}
                      {creatorAnalytics.tier === 'silver' && '100 sales for Gold'}
                      {creatorAnalytics.tier === 'gold' && '500 sales for Platinum'}
                      {creatorAnalytics.tier === 'platinum' && 'Max Tier! 🎉'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <p className="text-sm text-gray-600 mb-1">Total Sales</p>
                  <p className="text-3xl font-bold text-gray-900">{creatorAnalytics.totalSales}</p>
                  <p className="text-sm text-green-600 mt-1">↑ Growing</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">${creatorAnalytics.totalRevenue.toFixed(2)}</p>
                  <p className="text-sm text-gray-600 mt-1">Your earnings: ${creatorAnalytics.totalEarnings.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                  <p className="text-3xl font-bold text-gray-900">{creatorAnalytics.averageRating.toFixed(1)} ⭐</p>
                  <p className="text-sm text-gray-600 mt-1">{creatorAnalytics.totalReviews} reviews</p>
                </div>
              </div>

              {/* Active Listings */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Listings</h2>
                <p className="text-gray-600">
                  You have {creatorAnalytics.activeListing} active listing(s) in the marketplace.
                </p>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Create New Morgy
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Morgy Market</h1>
            <p className="text-gray-600 mt-1">Discover and purchase AI agents created by the community</p>
          </div>
          <button
            onClick={() => setShowCreatorDashboard(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Creator Dashboard
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Morgys..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Categories */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading Morgys...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No Morgys found. Try a different search or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Card Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{listing.morgy.name}</h3>
                      <p className="text-sm text-gray-600">{listing.morgy.description}</p>
                    </div>
                    <div className="text-4xl ml-4">🐷</div>
                  </div>

                  {/* Rating */}
                  <div className="mb-4">
                    {renderStars(listing.average_rating)}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {listing.morgy.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span>📊 {listing.total_sales} sales</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      {listing.morgy.category}
                    </span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{getPriceDisplay(listing)}</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Try Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
