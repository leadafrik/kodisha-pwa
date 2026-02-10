import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePageContent } from '../hooks/usePageContent';

const categoryTiles = [
  { title: 'Vehicles', count: '329,547 ads', description: 'From sedans to pickup trucks, connect with drop-shippers and private owners.' },
  { title: 'Property', count: '102,283 ads', description: 'Land, farms, and residential properties listed by verified sellers.' },
  { title: 'Phones & Tablets', count: '88,119 ads', description: 'New and pre-owned devices, accessories, and repair parts.' },
  { title: 'Electronics', count: '262,384 ads', description: 'Audio gear, computers, and home theater setups ready for delivery.' },
  { title: 'Home & Furniture', count: '535,902 ads', description: 'Appliances, furnishings, and fixtures sourced across Kenya.' },
  { title: 'Fashion & Beauty', count: '221,000+ ads', description: 'Apparel, accessories, and wellness items curated by trusted sellers.' },
];

const sellingSteps = [
  { label: 'Register', copy: 'Sign up with email, phone, or social login. Use a reachable phone number so buyers can contact you directly.' },
  { label: 'Capture photos', copy: 'Shoot multiple angles with good light so your goods feel tangible online.' },
  { label: 'Post your ad', copy: 'Choose the right category, describe the condition transparently, set a fair price, and submit.' },
  { label: 'Respond quickly', copy: 'Answer chats and calls, confirm details, and keep your listing updated after every inquiry.' },
];

const buyingSteps = [
  { label: 'Search smart', copy: 'Use filters or quick search to narrow by county, category, or price range.' },
  { label: 'Contact seller', copy: 'Chat or call straight from the listing to verify condition, delivery, and price.' },
  { label: 'Meet safely', copy: 'Always inspect items in public places and pay after you see the product.' },
  { label: 'Share feedback', copy: 'Leave reviews to reward good sellers and flag anything that needs our attention.' },
];

const safetyTips = [
  'Pay only after you inspect the item.',
  'Meet sellers in public, well-lit locations.',
  'Confirm the item matches the listing photos.',
  'Report suspicious behaviour so we can help quickly.',
];

const proTips = [
  'Answer messages within minutes and activate SMS/push alerts.',
  'Use our premium placement options when you want faster leads.',
  'Refresh your listing with new photos or updated pricing every few days.',
];

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
    <main className="bg-white">
      {/* HERO */}
      <section className="pt-14 md:pt-20 pb-14 md:pb-24 px-4 md:px-8 border-b border-gray-200">
        <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6 lg:space-y-8">
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">Sell</span>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">What are you looking for?</span>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">All Kenya</span>
            </div>
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                {displayHeadline}
              </h1>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                {displayDescription}
              </p>
              <p className="text-sm md:text-base text-gray-500 font-medium">
                {displayAnnouncement}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
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
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 text-sm text-gray-600 pt-6 border-t border-gray-200">
              <div>
                <div className="text-2xl font-bold text-gray-900">47</div>
                <p>Counties covered</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">Instant</div>
                <p>Chat, SMS & alerts</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">100%</div>
                <p>Fresh listings daily</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-700 to-emerald-500 text-white rounded-3xl p-6 space-y-6 shadow-lg border border-emerald-200">
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-100">Table of contents</p>
              <ul className="mt-4 space-y-3 text-sm leading-snug">
                <li>
                  <a href="#sell" className="text-white/90 hover:text-white transition">How to sell on Agrisoko</a>
                </li>
                <li>
                  <a href="#buy" className="text-white/90 hover:text-white transition">How to buy on Agrisoko</a>
                </li>
                <li>
                  <a href="#safety" className="text-white/90 hover:text-white transition">Safety tips</a>
                </li>
                <li>
                  <a href="#pro" className="text-white/90 hover:text-white transition">Sell like a pro</a>
                </li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center text-xs">
              <div className="rounded-xl bg-white/20 p-3">
                <p className="text-white font-semibold text-lg">2.4x</p>
                <p>Faster replies</p>
              </div>
              <div className="rounded-xl bg-white/20 p-3">
                <p className="text-white font-semibold text-lg">24/7</p>
                <p>Support coverage</p>
              </div>
            </div>
            <div className="text-sm text-emerald-100">
              <p>Sell, buy, and trade safely with clear trust indicators + moderation checks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="py-14 md:py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-600 uppercase">Trending categories</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Explore the demand</h2>
            </div>
            <Link to="/browse" className="text-emerald-600 font-semibold hover:underline">
              View all listings <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categoryTiles.map((category) => (
              <div key={category.title} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                <div className="text-xs font-semibold text-emerald-600 mb-2">Top seller</div>
                <h3 className="text-2xl font-bold text-gray-900">{category.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{category.count}</p>
                <p className="mt-4 text-gray-600 text-sm leading-relaxed">{category.description}</p>
                <Link to="/browse" className="mt-6 inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                  Browse category <span aria-hidden="true">→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SELLING GUIDE */}
      <section id="sell" className="py-14 md:py-20 px-4 md:px-8 bg-gradient-to-r from-white to-emerald-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-10 lg:items-center justify-between">
            <div className="max-w-xl space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">How to sell on Agrisoko</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Sell fast and safely</h2>
              <p className="text-gray-600">
                Our flow was built to help sellers publish in minutes, stay responsive, and keep trust high.
              </p>
            </div>
            <Link
              to={user ? "/create-listing" : "/login?next=/create-listing"}
              className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 border border-emerald-500 rounded-full font-semibold text-emerald-700 hover:bg-emerald-600 hover:text-white transition"
            >
              {user ? "Post your listing" : "Start selling"}
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {sellingSteps.map((step, index) => (
              <div key={step.label} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-emerald-600">{String(index + 1).padStart(2, '0')}</span>
                  <h3 className="text-xl font-bold text-gray-900">{step.label}</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BUYING GUIDE */}
      <section id="buy" className="py-14 md:py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase">How to buy on Agrisoko</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Find the right deal</h2>
            </div>
            <Link
              to="/browse"
              className="text-sm font-semibold text-emerald-600 border border-emerald-500 px-5 py-2 rounded-full hover:bg-emerald-600 hover:text-white transition"
            >
              Go shopping
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {buyingSteps.map((step, index) => (
              <div key={step.label} className="rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 text-emerald-600 text-lg font-bold">
                    {index + 1}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900">{step.label}</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SAFETY */}
      <section id="safety" className="py-14 md:py-20 px-4 md:px-8 bg-gradient-to-br from-gray-900 to-emerald-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-4 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-200">Safety</p>
            <h2 className="text-3xl md:text-4xl font-bold">Shop with confidence</h2>
            <p className="text-gray-200">
              Verified sellers, secure payments, and rapid moderation keep our marketplace clean. Here are the guardrails we ask every community member to follow.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {safetyTips.map((tip) => (
              <div key={tip} className="rounded-2xl bg-white/10 p-5 text-sm">{tip}</div>
            ))}
          </div>
        </div>
      </section>

      {/* SELL LIKE A PRO */}
      <section id="pro" className="py-14 md:py-20 px-4 md:px-8 border-y border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-emerald-600 uppercase">Sell like a pro</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Keep listings fresh & fast</h2>
            </div>
              <Link
                to="/browse"
                className="text-sm font-semibold text-emerald-600 border border-emerald-500 px-5 py-2 rounded-full hover:bg-emerald-600 hover:text-white transition"
              >
                Go premium <span aria-hidden="true">→</span>
              </Link>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {proTips.map((tip) => (
              <div key={tip} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-600 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-14 md:py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-3xl p-8 md:p-12 text-white text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-100">Ready</p>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">
              {user ? "Grow your Agrisoko presence" : "Join Agrisoko today"}
            </h2>
            <p className="mt-3 text-base md:text-lg text-white/90">
              {user
                ? "Keep listings accurate, stay in touch with buyers, and unlock premium visibility."
                : "Create your account, verify your identity, and start listing without the middlemen."}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to={user ? "/create-listing" : "/login?next=/create-listing"}
                className="inline-flex w-full sm:w-auto min-h-[48px] justify-center items-center px-6 py-3 bg-white text-emerald-700 font-semibold rounded-full hover:bg-white/90 transition"
              >
                {user ? "Post another listing" : "Create Account"}
              </Link>
              <Link
                to="/browse"
                className="inline-flex w-full sm:w-auto min-h-[48px] justify-center items-center px-6 py-3 border border-white text-white font-semibold rounded-full hover:bg-white/10 transition"
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
