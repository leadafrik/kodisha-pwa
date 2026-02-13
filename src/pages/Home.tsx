import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePageContent } from '../hooks/usePageContent';
import RaffleCampaign from '../components/RaffleCampaign';

const Home: React.FC = () => {
  const { user } = useAuth();
  
  // Fetch dynamic content with fallbacks
  const { content: heroHeadline } = usePageContent('home.hero.headline');
  const { content: heroDescription } = usePageContent('home.hero.description');
  const { content: announcementText } = usePageContent('home.announcement.banner');
  
  // Set defaults if content is empty
  const displayHeadline = heroHeadline || "Connecting Kenya's Agricultural Ecosystem";
  const displayDescription = heroDescription || 'A trusted marketplace for farmers, buyers, and agricultural service providers across all 47 counties.';
  const displayAnnouncement = announcementText || 'Verified sellers publish instantly. New sellers can still list with admin review.';

  return (
    <main className="min-h-screen bg-white">
      {/* HERO SECTION - Clean & Minimal */}
      <section className="pt-14 md:pt-20 pb-14 md:pb-24 px-4 md:px-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          {/* Confidence Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Trusted marketplace with clear trust status
          </div>

          {/* Main Headline */}
          <div className="space-y-6 max-w-3xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              {displayHeadline}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
              {displayDescription}
            </p>
            <p className="text-base md:text-lg text-gray-500 font-medium">
              {displayAnnouncement}
            </p>
          </div>

          {/* Primary CTA Row */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8 md:mt-10">
            <Link
              to="/browse"
              className="inline-flex w-full sm:w-auto min-h-[48px] justify-center items-center px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Browse Marketplace
            </Link>
            <Link
              to={user ? "/create-listing" : "/login?next=/create-listing"}
              className="inline-flex w-full sm:w-auto min-h-[48px] justify-center items-center px-6 py-3 border border-emerald-300 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-50 transition-colors"
            >
              {user ? "Create Listing" : "List Now"}
            </Link>
          </div>

          {/* Key Metrics - Minimal */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 md:gap-8 mt-12 md:mt-16 pt-10 md:pt-12 border-t border-gray-200">
            <div>
              <div className="text-2xl font-bold text-gray-900">47</div>
              <div className="text-xs text-gray-600 mt-1">Counties Covered</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">Trust</div>
              <div className="text-xs text-gray-600 mt-1">Shown On Listings</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">Instant</div>
              <div className="text-xs text-gray-600 mt-1">Chat Support</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">Free</div>
              <div className="text-xs text-gray-600 mt-1">Transparent Pricing</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">24/7</div>
              <div className="text-xs text-gray-600 mt-1">Available</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">Direct</div>
              <div className="text-xs text-gray-600 mt-1">No Middlemen</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 px-4 md:px-8 bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <RaffleCampaign />
        </div>
      </section>

      {/* DUAL CTA SECTION - Two User Paths */}
      <section className="py-14 md:py-20 px-4 md:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What's Your Role?</h2>
          <p className="text-base md:text-lg text-gray-600 mb-8 md:mb-12 max-w-2xl">
            Whether you're buying fresh produce or selling your harvest, Agrisoko connects you with the right partners.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* BUYERS PATH */}
            <div className="border border-gray-200 rounded-lg p-6 md:p-10 bg-white hover:border-gray-300 transition">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">I'm Looking to Buy</h3>
              <p className="text-gray-600 mb-6">
                Browse thousands of quality agricultural products, livestock, and professional services from trusted sellers across Kenya.
              </p>
              <ul className="space-y-3 mb-8 text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-green-600 font-semibold">+</span> Fresh produce & livestock
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 font-semibold">+</span> Farm inputs & equipment
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 font-semibold">+</span> Professional services
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 font-semibold">+</span> Direct farmer connections
                </li>
              </ul>
              <Link
                to="/browse"
                className="inline-flex w-full sm:w-auto min-h-[44px] justify-center items-center px-6 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Browse now
              </Link>
            </div>

            {/* SELLERS PATH */}
            <div className="border border-gray-200 rounded-lg p-6 md:p-10 bg-white hover:border-gray-300 transition">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">I'm Looking to Sell</h3>
              <p className="text-gray-600 mb-6">
                List your products to reach verified buyers actively seeking what you produce. Direct connections, no middlemen.
              </p>
              <ul className="space-y-3 mb-8 text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-semibold">+</span> Real buyer demand
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-semibold">+</span> Multiple buyer inquiries
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-semibold">+</span> Quick response opportunities
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-semibold">+</span> Direct buyer negotiation
                </li>
              </ul>
              <Link
                to={user ? "/create-listing" : "/login?next=/create-listing"}
                className="inline-flex w-full sm:w-auto min-h-[44px] justify-center items-center px-6 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
              >
                {user ? "Create Listing" : "Get Started"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - Simple 3 Step Flow */}
      <section className="py-14 md:py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-base md:text-lg text-gray-600 mb-8 md:mb-12 max-w-2xl">
            Get started in minutes with our straightforward process.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-900 text-white rounded-full font-bold text-lg mb-4">1</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Create Account</h3>
              <p className="text-gray-600">Sign up quickly and complete your profile in minutes.</p>
            </div>

            {/* Step 2 */}
            <div className="relative border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-900 text-white rounded-full font-bold text-lg mb-4">2</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Browse or List</h3>
              <p className="text-gray-600">Search the marketplace or post your listing with clear location, category, and pricing.</p>
            </div>

            {/* Step 3 */}
            <div className="relative border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-900 text-white rounded-full font-bold text-lg mb-4">3</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Connect & Trade</h3>
              <p className="text-gray-600">Chat directly, close your deal, and verify your ID to unlock instant publishing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM FEATURES - Clean Grid */}
      <section className="py-14 md:py-20 px-4 md:px-8 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose Agrisoko</h2>
          <p className="text-base md:text-lg text-gray-600 mb-8 md:mb-12 max-w-2xl">
            Built for Kenya's agricultural community with security, simplicity, and trust at the core.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Trust Labels</h3>
              <p className="text-gray-600">Verified profiles are ID and selfie-authenticated. Unverified listings go through admin review.</p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Instant Messaging</h3>
              <p className="text-gray-600">Chat directly with buyers and sellers. Negotiate terms in real-time.</p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">No Middlemen</h3>
              <p className="text-gray-600">Direct connections mean better prices for buyers and more profit for sellers.</p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">47 Counties</h3>
              <p className="text-gray-600">Full coverage across Kenya. Find sellers and buyers in your area.</p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Smart Search</h3>
              <p className="text-gray-600">Filter by location, category, and price. Find exactly what you need.</p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Transparent Pricing</h3>
              <p className="text-gray-600">Clear costs and terms before you publish or transact.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT CATEGORIES */}
      <section className="py-14 md:py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 md:mb-12">What Can You Buy & Sell?</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Produce Category */}
            <div className="border border-gray-200 rounded-lg p-8">
              <div className="text-sm font-semibold text-emerald-700 mb-4">Produce</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Agricultural Produce</h3>
              <p className="text-gray-600 mb-6">
                Fresh vegetables, fruits, grains, and livestock directly from farmers and producers across Kenya.
              </p>
              <Link to="/browse" className="text-gray-900 font-semibold hover:underline">
                Browse produce
              </Link>
            </div>

            {/* Services Category */}
            <div className="border border-gray-200 rounded-lg p-8">
              <div className="text-sm font-semibold text-emerald-700 mb-4">Services</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Agricultural Services</h3>
              <p className="text-gray-600 mb-6">
                Professional services including land surveying, transportation, equipment rental, and landscaping.
              </p>
              <Link to="/browse" className="text-gray-900 font-semibold hover:underline">
                Browse services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE STATUS BANNER */}
      <section className="py-12 px-4 md:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-2">Built for Daily Trade</h3>
          <p className="text-gray-300">
            Listings, in-app messaging, and verification review are active with clear trust status on each profile.
          </p>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-14 md:py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {user ? "Ready to Grow Your Business?" : "Ready to Get Started?"}
            </h2>
            <p className="text-base md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {user 
                ? "List your products now and reach verified buyers across all 47 counties."
                : "Join thousands of farmers, buyers, and service providers already using Agrisoko."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to={user ? "/create-listing" : "/login?next=/create-listing"}
                className="inline-flex w-full sm:w-auto min-h-[48px] justify-center items-center px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
              >
                {user ? "Create Listing" : "Create Account"}
              </Link>
              <Link
                to="/browse"
                className="inline-flex w-full sm:w-auto min-h-[48px] justify-center items-center px-6 py-3 border border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
};

export default Home;
