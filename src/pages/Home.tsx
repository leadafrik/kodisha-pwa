import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePageContent } from '../hooks/usePageContent';

const Home: React.FC = () => {
  const { user } = useAuth();
  
  // Fetch dynamic content with fallbacks
  const { content: heroHeadline } = usePageContent('home.hero.headline');
  const { content: heroDescription } = usePageContent('home.hero.description');
  const { content: announcementText } = usePageContent('home.announcement.banner');
  
  // Set defaults if content is empty
  const displayHeadline = heroHeadline || "Connecting Kenya's Agricultural Ecosystem";
  const displayDescription = heroDescription || 'A trusted marketplace for farmers, buyers, and agricultural service providers across all 47 counties.';
  const displayAnnouncement = announcementText || 'Early access launching with zero fees while we scale.';

  return (
    <main className="min-h-screen bg-white">
      {/* HERO SECTION - Clean & Minimal */}
      <section className="pt-20 pb-24 px-4 md:px-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          {/* Beta Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Open Beta • All Listings Free
          </div>

          {/* Main Headline */}
          <div className="space-y-6 max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              {displayHeadline}
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              {displayDescription}
            </p>
            <p className="text-lg text-gray-500 font-medium">
              {displayAnnouncement}
            </p>
          </div>

          {/* Primary CTA Row */}
          <div className="flex flex-col sm:flex-row gap-3 mt-10">
            <Link
              to="/browse"
              className="inline-flex justify-center items-center px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              Browse Listings
            </Link>
            <Link
              to={user ? "/create-listing" : "/login?next=/create-listing"}
              className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              {user ? "Create Listing" : "Start Selling"}
            </Link>
          </div>

          {/* Key Metrics - Minimal */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-8 mt-16 pt-12 border-t border-gray-200">
            <div>
              <div className="text-2xl font-bold text-gray-900">47</div>
              <div className="text-xs text-gray-600 mt-1">Counties Covered</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">Verified</div>
              <div className="text-xs text-gray-600 mt-1">ID Verified</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">Instant</div>
              <div className="text-xs text-gray-600 mt-1">Chat Support</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">Free</div>
              <div className="text-xs text-gray-600 mt-1">Launch Phase</div>
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

      {/* EARLY SELLER INCENTIVE BANNER */}
      <section className="py-8 px-4 md:px-8 bg-gradient-to-r from-green-500 to-emerald-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              🎉 Be One of the First 100 Sellers
            </h2>
            <p className="text-green-50 mb-4">
              List your agricultural products, equipment, or services completely free. Limited to first 100 sellers - offer expires March 8, 2026.
            </p>
          </div>
          <Link
            to={user ? "/create-listing" : "/login?next=/create-listing"}
            className="inline-flex justify-center items-center px-6 py-3 bg-white text-green-700 font-bold rounded-lg hover:bg-green-50 transition-colors whitespace-nowrap"
          >
            {user ? "List Now Free" : "Sign Up & List"}
          </Link>
        </div>
      </section>

      {/* DUAL CTA SECTION - Two User Paths */}
      <section className="py-20 px-4 md:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">What's Your Role?</h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl">
            Whether you're buying fresh produce or selling your harvest, Agrisoko connects you with the right partners.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* BUYERS PATH */}
            <div className="border border-gray-200 rounded-lg p-12 bg-white hover:border-gray-300 transition">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">I'm Looking to Buy</h3>
              <p className="text-gray-600 mb-6">
                Browse thousands of quality agricultural products, livestock, and professional services from verified sellers across Kenya.
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
                className="inline-flex items-center px-6 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                Browse Now →
              </Link>
            </div>

            {/* SELLERS PATH */}
            <div className="border border-gray-200 rounded-lg p-12 bg-white hover:border-gray-300 transition">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">I'm Looking to Sell</h3>
              <p className="text-gray-600 mb-6">
                List your products to reach verified buyers actively seeking what you produce. Direct connections, no middlemen.
              </p>
              <ul className="space-y-3 mb-8 text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-blue-600 font-semibold">+</span> Real buyer demand
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600 font-semibold">+</span> Multiple buyer inquiries
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600 font-semibold">+</span> Quick response opportunities
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600 font-semibold">+</span> Direct buyer negotiation
                </li>
              </ul>
              <Link
                to={user ? "/create-listing" : "/login?next=/create-listing"}
                className="inline-flex items-center px-6 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                {user ? "Create Listing" : "Get Started"} →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - Simple 3 Step Flow */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl">
            Get started in minutes with our straightforward process.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-900 text-white rounded-full font-bold text-lg mb-4">1</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Create Account</h3>
              <p className="text-gray-600">Sign up with email and verify your identity with a photo. Takes just 2 minutes.</p>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-900 text-white rounded-full font-bold text-lg mb-4">2</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Browse or List</h3>
              <p className="text-gray-600">Search our marketplace or post your products. Filter by location, category, and price.</p>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-900 text-white rounded-full font-bold text-lg mb-4">3</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Connect & Trade</h3>
              <p className="text-gray-600">Message sellers directly. Negotiate terms and close deals on your terms.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM FEATURES - Clean Grid */}
      <section className="py-20 px-4 md:px-8 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Agrisoko</h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl">
            Built for Kenya's agricultural community with security, simplicity, and trust at the core.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Verified Traders</h3>
              <p className="text-gray-600">Every seller is ID-verified and selfie-authenticated. Trade with confidence.</p>
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
              <h3 className="text-lg font-bold text-gray-900 mb-3">Free Launch Phase</h3>
              <p className="text-gray-600">Zero listing fees while we onboard Kenya's agricultural community.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT CATEGORIES */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-12">What Can You Buy & Sell?</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Produce Category */}
            <div className="border border-gray-200 rounded-lg p-8">
              <div className="text-4xl mb-4">🌾</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Agricultural Produce</h3>
              <p className="text-gray-600 mb-6">
                Fresh vegetables, fruits, grains, and livestock directly from farmers and producers across Kenya.
              </p>
              <Link to="/browse" className="text-gray-900 font-semibold hover:underline">
                Browse Produce →
              </Link>
            </div>

            {/* Services Category */}
            <div className="border border-gray-200 rounded-lg p-8">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Agricultural Services</h3>
              <p className="text-gray-600 mb-6">
                Professional services including land surveying, transportation, equipment rental, and landscaping.
              </p>
              <Link to="/browse" className="text-gray-900 font-semibold hover:underline">
                Browse Services →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE STATUS BANNER */}
      <section className="py-12 px-4 md:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-2">Open Beta • Core Features Live</h3>
          <p className="text-gray-300">
            Identity verification, document uploads, and in-app messaging are fully operational. Payments and transaction fees will be announced before activation.
          </p>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {user ? "Ready to Grow Your Business?" : "Ready to Get Started?"}
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {user 
                ? "List your products now and reach verified buyers across all 47 counties."
                : "Join thousands of farmers, buyers, and service providers already using Agrisoko."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/browse"
                className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Browse Marketplace
              </Link>
              <Link
                to={user ? "/create-listing" : "/login?next=/create-listing"}
                className="inline-flex justify-center items-center px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                {user ? "Create Listing" : "Create Account"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER - Clean & Professional */}
      <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="md:col-span-1">
              <h3 className="text-lg font-bold text-white mb-3">Agrisoko</h3>
              <p className="text-sm leading-relaxed">
                Connecting Kenya's agricultural ecosystem. Direct, trusted, fair.
              </p>
            </div>

            {/* Platform Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/browse" className="hover:text-white transition">Browse Listings</Link></li>
                <li><Link to={user ? "/create-listing" : "/login"} className="hover:text-white transition">Create Listing</Link></li>
                <li><Link to="/request" className="hover:text-white transition">Buy Requests</Link></li>
                {user && <li><Link to="/profile" className="hover:text-white transition">Your Profile</Link></li>}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/terms" className="hover:text-white transition">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a 
                    href="https://wa.me/254796389192" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition"
                  >
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a 
                    href="mailto:kodisha.254.ke@gmail.com"
                    className="hover:text-white transition"
                  >
                    Email Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Agrisoko. All rights reserved. Currently in open beta with zero listing fees.</p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Home;
