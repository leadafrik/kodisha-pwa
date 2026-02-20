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
  const displayDescription = heroDescription || 'Sell faster and buy safer across all 47 counties with verified profiles, direct chat, and transparent terms.';
  const displayAnnouncement = announcementText || 'Launch window: listing fee is KSh 0. Keep more margin on every sale.';
  const primaryCtaHref = user ? "/create-listing" : "/login?next=/create-listing";
  const primaryCtaLabel = user ? "List Now Before Fees Start" : "Start Free Listing";
  const launchOfferEndsAt = new Date("2026-03-08T23:59:59+03:00");
  const daysLeft = Math.max(
    0,
    Math.ceil((launchOfferEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
  const urgencyLine =
    daysLeft > 0
      ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left: listing fee stays at KSh 0.`
      : "Launch fee waiver closes soon. List now and lock in momentum.";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7fff3_0%,_#ffffff_58%)]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');
        .home-display {
          font-family: "Plus Jakarta Sans", "Segoe UI", sans-serif;
        }
        .home-headline {
          font-family: "Fraunces", Georgia, serif;
        }
        .hook-glow {
          box-shadow: 0 18px 40px -18px rgba(16, 185, 129, 0.65);
        }
        .home-float {
          animation: rise 0.9s ease both;
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <section className="border-b border-emerald-900/20 bg-[#103021] px-4 py-3 text-emerald-50 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="home-display text-sm font-semibold md:text-base">
            Move now: {urgencyLine}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-100">
            <span className="rounded-full border border-emerald-300/50 bg-emerald-500/20 px-3 py-1">47 counties live</span>
            <span className="rounded-full border border-emerald-300/50 bg-emerald-500/20 px-3 py-1">Verified traders</span>
            <span className="rounded-full border border-emerald-300/50 bg-emerald-500/20 px-3 py-1">Direct chat deals</span>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-emerald-100 px-4 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20">
        <div className="pointer-events-none absolute -left-20 top-12 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-20 h-64 w-64 rounded-full bg-amber-200/35 blur-3xl" />

        <div className="home-display mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="home-float">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">
              Trusted by serious buyers and sellers
            </p>
            <h1 className="home-headline mt-5 text-4xl leading-tight text-slate-900 sm:text-5xl md:text-6xl">
              {displayHeadline}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-700 md:text-xl">
              {displayDescription}
            </p>
            <p className="mt-3 max-w-2xl text-base font-semibold text-emerald-800">
              {displayAnnouncement} First movers capture repeat buyers while competition is still thin.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to={primaryCtaHref}
                className="hook-glow inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-bold text-white transition hover:bg-emerald-700 sm:w-auto"
              >
                {primaryCtaLabel}
              </Link>
              <Link
                to="/browse"
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-900 transition hover:bg-slate-50 sm:w-auto"
              >
                See Active Demand
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-100 bg-white/85 px-4 py-3">
                <p className="text-2xl font-black text-emerald-700">3 min</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">First listing</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-white/85 px-4 py-3">
                <p className="text-2xl font-black text-emerald-700">Auto</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">No data loss</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-white/85 px-4 py-3">
                <p className="text-2xl font-black text-emerald-700">Live</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Close faster</p>
              </div>
            </div>
          </div>

          <aside className="home-float rounded-2xl border border-emerald-200 bg-white/95 p-6 shadow-[0_25px_55px_-32px_rgba(16,185,129,0.7)]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Your unfair advantage</p>
            <h2 className="mt-3 text-2xl font-extrabold text-slate-900">
              Start now, build compounding trust
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <strong className="text-slate-900">1. Loss aversion:</strong> each delayed day can cost buyer attention to faster sellers.
              </li>
              <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <strong className="text-slate-900">2. Social proof:</strong> verified badges and active listings raise buyer confidence.
              </li>
              <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <strong className="text-slate-900">3. Goal gradient:</strong> each listing pushes the raffle target closer and keeps users engaged.
              </li>
            </ul>
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-700">Today&apos;s action</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                Post one listing now, then a second tomorrow to dominate your category with visible activity.
              </p>
            </div>
            <Link
              to={primaryCtaHref}
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Start my first listing
            </Link>
          </aside>
        </div>

        <div className="mx-auto mt-12 grid max-w-7xl grid-cols-3 gap-4 border-t border-slate-200 pt-8 text-center md:grid-cols-6 md:gap-6 md:text-left">
          <div>
            <div className="text-2xl font-bold text-slate-900">47</div>
            <div className="mt-1 text-xs text-slate-600">Counties Covered</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">Verified</div>
            <div className="mt-1 text-xs text-slate-600">ID Verified</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">Instant</div>
            <div className="mt-1 text-xs text-slate-600">Chat Support</div>
          </div>
          <div className="hidden md:block">
            <div className="text-2xl font-bold text-slate-900">KSh 0</div>
            <div className="mt-1 text-xs text-slate-600">Launch Fee Waiver</div>
          </div>
          <div className="hidden md:block">
            <div className="text-2xl font-bold text-slate-900">24/7</div>
            <div className="mt-1 text-xs text-slate-600">Buyer Activity</div>
          </div>
          <div className="hidden md:block">
            <div className="text-2xl font-bold text-slate-900">Direct</div>
            <div className="mt-1 text-xs text-slate-600">No Middlemen</div>
          </div>
        </div>
      </section>

      <section className="py-10 px-4 md:px-8 bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <RaffleCampaign />
        </div>
      </section>

      {/* EARLY SELLER INCENTIVE BANNER */}
      <section className="py-8 px-4 md:px-8 bg-gradient-to-r from-green-500 to-emerald-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Launch Advantage: Keep More of Every Sale
            </h2>
            <p className="text-green-50 mb-4">
              Listing fee is KSh 0 during launch. Delay means less visibility while early sellers lock buyer relationships.
            </p>
          </div>
          <Link
            to={user ? "/create-listing" : "/login?next=/create-listing"}
            className="inline-flex justify-center items-center px-6 py-3 bg-white text-green-700 font-bold rounded-lg hover:bg-green-50 transition-colors whitespace-nowrap"
          >
            {user ? "List Before Fees Start" : "Join & List Free"}
          </Link>
        </div>
      </section>

      {/* DUAL CTA SECTION - Two User Paths */}
      <section className="py-20 px-4 md:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Growth Path</h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl">Buy with confidence or sell with urgency.</p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* BUYERS PATH */}
            <div className="border border-gray-200 rounded-lg p-12 bg-white hover:border-gray-300 transition">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">I'm Buying</h3>
              <p className="text-gray-600 mb-6">
                Compare verified options and negotiate directly.
              </p>
              <ul className="space-y-3 mb-8 text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-green-600 font-semibold">+</span> Produce and livestock
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 font-semibold">+</span> Inputs and equipment
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 font-semibold">+</span> Verified service providers
                </li>
              </ul>
              <Link
                to="/browse"
                className="inline-flex items-center px-6 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                Browse Now
              </Link>
            </div>

            {/* SELLERS PATH */}
            <div className="border border-gray-200 rounded-lg p-12 bg-white hover:border-gray-300 transition">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">I'm Selling</h3>
              <p className="text-gray-600 mb-6">
                Reach buyers already searching and close faster.
              </p>
              <ul className="space-y-3 mb-8 text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-blue-600 font-semibold">+</span> Buyer demand already live
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600 font-semibold">+</span> Higher trust with verified badge
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600 font-semibold">+</span> Faster repeat deals
                </li>
              </ul>
              <Link
                to={user ? "/create-listing" : "/login?next=/create-listing"}
                className="inline-flex items-center px-6 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                {user ? "Start Selling Today" : "Get Started"}
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
            Three steps to trusted trade and repeat business.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-900 text-white rounded-full font-bold text-lg mb-4">1</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Create Account</h3>
              <p className="text-gray-600">Sign up and verify your profile.</p>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-900 text-white rounded-full font-bold text-lg mb-4">2</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Browse or List</h3>
              <p className="text-gray-600">Browse listings or post what you have.</p>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-900 text-white rounded-full font-bold text-lg mb-4">3</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Connect & Trade</h3>
              <p className="text-gray-600">Message directly and close the deal.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM FEATURES - Clean Grid */}
      <section className="py-20 px-4 md:px-8 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Agrisoko</h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl">
            Built to convert trust into real transactions.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Verified Traders</h3>
              <p className="text-gray-600">ID and selfie verification for safer trade.</p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Instant Messaging</h3>
              <p className="text-gray-600">Chat in real time with buyers and sellers.</p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">No Middlemen</h3>
              <p className="text-gray-600">Direct deals for better pricing.</p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">47 Counties</h3>
              <p className="text-gray-600">Find buyers and sellers across Kenya.</p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Smart Search</h3>
              <p className="text-gray-600">Filter by location, category, and price.</p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Launch Fee Waiver</h3>
              <p className="text-gray-600">List at KSh 0 now before standard fees activate.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT CATEGORIES */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-12">Top Categories</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Produce Category */}
            <div className="border border-gray-200 rounded-lg p-8">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-emerald-50 text-emerald-700 font-semibold mb-4">
                P
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Agricultural Produce</h3>
              <p className="text-gray-600 mb-6">
                Fresh produce and livestock from trusted sellers.
              </p>
              <Link to="/browse" className="text-gray-900 font-semibold hover:underline">
                Browse Produce
              </Link>
            </div>

            {/* Services Category */}
            <div className="border border-gray-200 rounded-lg p-8">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-50 text-blue-700 font-semibold mb-4">
                S
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Agricultural Services</h3>
              <p className="text-gray-600 mb-6">
                Transport, equipment hire, and technical support.
              </p>
              <Link to="/browse" className="text-gray-900 font-semibold hover:underline">
                Browse Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE STATUS BANNER */}
      <section className="py-12 px-4 md:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-2">Core Features Live</h3>
          <p className="text-gray-300">
            Verification, messaging, and moderation are live so every trade starts with trust.
          </p>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {user ? "Ready to Capture More Buyers?" : "Ready to Launch Your First Listing?"}
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {user 
                ? "Post now while listing is free and lock in repeat buyer relationships."
                : "Create your account, verify once, and list in minutes."}
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
                {user ? "Claim Free Listing" : "Create Account"}
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
                Kenya's direct marketplace for trusted agri trade.
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
                    href="mailto:info@leadafrik.com"
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
            <p>&copy; {new Date().getFullYear()} Agrisoko. Launch pricing active with zero listing fees.</p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Home;
