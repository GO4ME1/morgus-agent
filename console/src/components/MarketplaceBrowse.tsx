import { useState, useEffect } from 'react';
import { Search, Filter, Star, ShoppingCart, CheckCircle, DollarSign, Users } from 'lucide-react';
import { browseMarketplace } from '../lib/api-client';
import { useAuth } from '../lib/auth';

interface MarketplaceListing {
  id: string;
  morgyId: string;
  creatorId: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  pricingModel: 'free' | 'one-time' | 'monthly' | 'annual';
  price?: number;
  avatarUrl?: string;
  stats: {
    views: number;
    purchases: number;
    rating: number;
    reviews: number;
  };
  creator: {
    name: string;
    avatar?: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  };
}

export const MarketplaceBrowse: React.FC = () => {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: 'all',
    pricingModel: 'all',
    search: '',
    sortBy: 'popular' as 'popular' | 'recent' | 'rating' | 'price',
  });
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);

  const categories = [
    { id: 'all', name: 'All Categories', icon: '🐷' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'social', name: 'Social Media', icon: '📱' },
    { id: 'research', name: 'Research', icon: '🔬' },
    { id: 'creative', name: 'Creative', icon: '🎨' },
    { id: 'technical', name: 'Technical', icon: '💻' },
  ];

  const pricingModels = [
    { id: 'all', name: 'All Pricing' },
    { id: 'free', name: 'Free' },
    { id: 'one-time', name: 'One-time' },
    { id: 'monthly', name: 'Monthly' },
    { id: 'annual', name: 'Annual' },
  ];

  const sortOptions = [
    { id: 'popular', name: 'Most Popular' },
    { id: 'recent', name: 'Recently Added' },
    { id: 'rating', name: 'Highest Rated' },
    { id: 'price', name: 'Lowest Price' },
  ];

  useEffect(() => {
    loadListings();
  }, [filters]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const filterParams: any = {};
      if (filters.category !== 'all') filterParams.category = filters.category;
      if (filters.pricingModel !== 'all') filterParams.licenseType = filters.pricingModel;
      if (filters.search) filterParams.search = filters.search;
      filterParams.sortBy = filters.sortBy;

      const data = await browseMarketplace(filterParams);
      setListings(data || []);
    } catch (error) {
      console.error('Failed to load listings:', error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (listingId: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://morgus-deploy.fly.dev';
      const response = await fetch(`${API_URL}/api/marketplace/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      });

      const data = await response.json();

      if (data.paymentIntent) {
        // Redirect to Stripe checkout
        window.location.href = data.paymentIntent.url;
      } else {
        // Free purchase completed
        alert('Morgy added to your collection!');
        setSelectedListing(null);
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    }
  };

  const getTierBadge = (tier: string) => {
    const badges = {
      bronze: { color: 'bg-orange-500', icon: '🥉', label: 'Bronze Creator' },
      silver: { color: 'bg-gray-400', icon: '🥈', label: 'Silver Creator' },
      gold: { color: 'bg-yellow-500', icon: '🥇', label: 'Gold Creator' },
      platinum: { color: 'bg-purple-500', icon: '💎', label: 'Platinum Creator' },
    };
    return badges[tier as keyof typeof badges] || badges.bronze;
  };

  const formatPrice = (listing: MarketplaceListing) => {
    if (listing.pricingModel === 'free') return 'Free';
    if (!listing.price) return 'Free';
    
    const suffix = listing.pricingModel === 'monthly' ? '/mo' : listing.pricingModel === 'annual' ? '/yr' : '';
    return `$${listing.price}${suffix}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Morgy Marketplace</h1>
          <p className="text-gray-400">Discover and purchase custom AI agents created by the community</p>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search Morgys..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing Filter */}
          <div className="flex gap-2 mt-4">
            {pricingModels.map((model) => (
              <button
                key={model.id}
                onClick={() => setFilters({ ...filters, pricingModel: model.id })}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${filters.pricingModel === model.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }
                `}
              >
                {model.name}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : listings.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No Morgys found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => {
              const tierBadge = getTierBadge(listing.creator.tier);
              
              return (
                <div
                  key={listing.id}
                  className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-purple-500 transition-all cursor-pointer"
                  onClick={() => setSelectedListing(listing)}
                >
                  {/* Avatar */}
                  <div className="aspect-square bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    {listing.avatarUrl ? (
                      <img src={listing.avatarUrl} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-6xl">🐷</div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-white">{listing.title}</h3>
                      <div className="text-lg font-bold text-purple-400">
                        {formatPrice(listing)}
                      </div>
                    </div>

                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {listing.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {listing.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span>{listing.stats.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{listing.stats.purchases}</span>
                      </div>
                    </div>

                    {/* Creator */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-700">
                      <div className={`w-2 h-2 rounded-full ${tierBadge.color}`} />
                      <span className="text-xs text-gray-400">by {listing.creator.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Purchase Modal */}
        {selectedListing && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{selectedListing.title}</h2>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded text-xs ${getTierBadge(selectedListing.creator.tier).color}`}>
                        {getTierBadge(selectedListing.creator.tier).icon} {selectedListing.creator.name}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedListing(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {/* Avatar */}
                <div className="aspect-video bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg mb-6 flex items-center justify-center">
                  {selectedListing.avatarUrl ? (
                    <img src={selectedListing.avatarUrl} alt={selectedListing.title} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="text-8xl">🐷</div>
                  )}
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">About this Morgy</h3>
                  <p className="text-gray-300">{selectedListing.description}</p>
                </div>

                {/* Tags */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedListing.tags.map((tag) => (
                      <span key={tag} className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white">{selectedListing.stats.rating.toFixed(1)}</div>
                    <div className="text-sm text-gray-400">Rating</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white">{selectedListing.stats.purchases}</div>
                    <div className="text-sm text-gray-400">Purchases</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white">{selectedListing.stats.reviews}</div>
                    <div className="text-sm text-gray-400">Reviews</div>
                  </div>
                </div>

                {/* Purchase Button */}
                <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Price</div>
                      <div className="text-3xl font-bold text-white">{formatPrice(selectedListing)}</div>
                    </div>
                    <button
                      onClick={() => handlePurchase(selectedListing.id)}
                      className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 flex items-center gap-2 font-semibold"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {selectedListing.pricingModel === 'free' ? 'Get Free' : 'Purchase'}
                    </button>
                  </div>

                  <div className="text-sm text-gray-400">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Includes full knowledge base and templates
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
