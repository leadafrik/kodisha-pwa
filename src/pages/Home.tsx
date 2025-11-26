import React from 'react';
import { PAYMENTS_ENABLED } from '../config/featureFlags';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-green-50 via-white to-green-50 pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-xs sm:text-sm font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-green-600" aria-hidden="true"></span>
              Early Access Launch • Free Listings
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight">
                Agriculture. Simplified.
                <br />
                <span className="bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                  Discover • List • Connect
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl leading-relaxed">
                One platform for land, equipment, services, and produce across Kenya—built for clarity, trust, and speed.
                {!PAYMENTS_ENABLED && (
                  <span className="block mt-3 font-semibold text-green-700">Introductory Phase: Listing is free while we onboard early users.</span>
                )}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                to="/browse"
                className="inline-flex justify-center items-center px-8 py-4 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 active:bg-green-800 shadow-lg hover:shadow-xl transition duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Explore Marketplace
              </Link>
              <Link
                to={user ? "/list" : "/login?next=/list"}
                className="inline-flex justify-center items-center px-8 py-4 rounded-xl border-2 border-green-600 text-green-600 font-semibold hover:bg-green-50 active:bg-green-100 transition duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {user ? "Start Listing" : "Sign In to List"}
              </Link>
            </div>

            {/* Trust Signals (simple & realistic) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-10 border-t border-gray-200">
              {[{label:'Counties Reach',value:'47'},{label:'Launch Users',value:'Early'},{label:'Identity Verification',value:'Enabled'},{label:'In‑App Chat',value:'Live'}].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-2xl font-bold text-green-600">{item.value}</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Built For Agricultural Trade</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Identity verification, discovery, communication, and trust features are live. Payments will be introduced later with notice.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Verified Sellers</h3>
              <p className="text-gray-600">
                Every seller is ID-verified and selfie-authenticated. Buy with confidence.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Real-Time Chat</h3>
              <p className="text-gray-600">
                Message sellers instantly. Negotiate, ask questions, and close deals fast.
              </p>
            </div>

            {/* Payments feature tile switches when enabled */}
            {PAYMENTS_ENABLED ? (
              <div className="p-8 rounded-2xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Payments</h3>
                <p className="text-gray-600">Instant mobile money integration for seamless transactions.</p>
              </div>
            ) : (
              <div className="p-8 rounded-2xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Free Launch</h3>
                <p className="text-gray-600">All listings are currently free while we onboard Kenya's agricultural community.</p>
              </div>
            )}

            {/* Feature 4 */}
            <div className="p-8 rounded-2xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Search</h3>
              <p className="text-gray-600">
                Filter by county, category, price. Find exactly what you need in seconds.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-2xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Fast Listings</h3>
              <p className="text-gray-600">
                List land, equipment, services, or produce in under 2 minutes. Go live instantly.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-2xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Trusted Support</h3>
              <p className="text-gray-600">
                Get help when you need it. Our team is ready to assist you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Can You Buy?</h2>
            <p className="text-lg text-gray-600">
              From land and equipment to services and farm produce
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { title: "Agricultural Land", emoji: "🌾", desc: "For rent / lease" },
              { title: "Equipment & Tools", emoji: "🚜", desc: "Tractors & machinery" },
              { title: "Professional Services", emoji: "👨‍💼", desc: "Farm consulting" },
              { title: "Farm Produce", emoji: "🥕", desc: "Fresh from farmers" },
            ].map((cat, idx) => (
              <div key={idx} className="p-8 bg-white rounded-2xl border border-gray-200 text-center hover:shadow-lg transition">
                <div className="text-5xl mb-4">{cat.emoji}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{cat.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{cat.desc}</p>
                <Link to="/browse" className="text-green-600 font-semibold hover:text-green-700 text-sm">
                  Browse →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="py-14 px-4 bg-green-700">
        <div className="max-w-6xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-6">Core Features Live • Payments Later</h2>
          <p className="max-w-2xl mx-auto text-green-100 text-sm sm:text-base">
            Identity verification, document uploads, moderation workflow, and in‑app messaging are active. Listing fees and payment processing will be announced before activation.
          </p>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            {user ? "Ready to expand your reach?" : "Ready to get started?"}
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            {user 
              ? "List your products and reach thousands of buyers across Kenya."
              : "Join thousands of farmers, buyers, and service providers on Kodisha."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/browse"
              className="inline-flex justify-center items-center px-8 py-4 rounded-xl border-2 border-green-600 text-green-600 font-semibold hover:bg-green-50 transition"
            >
              Browse Listings
            </Link>
            <Link
              to={user ? "/list" : "/login?next=/list"}
              className="inline-flex justify-center items-center px-8 py-4 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 shadow-lg transition"
            >
              {user ? "Create a Listing" : "Create Account"}
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-gray-950 text-gray-300">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-5 gap-8 mb-10">
            <div className="md:col-span-2">
              <h4 className="text-lg font-bold mb-4 text-white">Kodisha</h4>
              <p className="text-sm leading-relaxed">A focused agricultural marketplace for Kenya—streamlining discovery of land, equipment, professional services, and produce. Currently free while we expand coverage; listing fees and payments will be introduced later.</p>
            </div>
            <div>
              <h5 className="font-semibold mb-3 text-white">Platform</h5>
              <ul className="space-y-2 text-sm">
                <li><Link to="/browse" className="hover:text-white">Browse Listings</Link></li>
                <li><Link to={user ? "/list" : "/login"} className="hover:text-white">Create Listing</Link></li>
                <li><Link to="/profile" className="hover:text-white">Your Profile</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-3 text-white">Legal</h5>
              <ul className="space-y-2 text-sm">
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-3 text-white">Contact</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="https://wa.me/254796389192" className="hover:text-white" rel="noopener noreferrer">WhatsApp: +254 796 389 192</a></li>
                <li><a href="mailto:kodisha.254.ke@gmail.com" className="hover:text-white">Email: kodisha.254.ke@gmail.com</a></li>
              </ul>
              <p className="text-xs text-gray-500 mt-4">All correspondence: kodisha.254.ke@gmail.com</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>&copy; {new Date().getFullYear()} Kodisha. All rights reserved.</p>
            <p>Currently free: listing fees and in‑app payments not yet active.</p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Home;
