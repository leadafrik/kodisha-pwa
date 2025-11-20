// pages/Home.tsx
import React from "react";
import { Link } from "react-router-dom";
import KodishaLogo from "../components/KodishaLogo";

const features = [
  { icon: "🏞️", title: "Verified Listings", description: "Every property is verified for authenticity and accurate details" },
  { icon: "📱", title: "Easy Listing", description: "List your land with photos, location, and pricing in minutes" },
  { icon: "🔒", title: "Secure Platform", description: "M-Pesa integration and verified user protection" },
  { icon: "🗺️", title: "County Coverage", description: "Complete coverage across all 47 Kenyan counties" },
  { icon: "🌧️", title: "Seasonal Planning", description: "Perfect timing for planting and harvesting seasons" },
  { icon: "👥", title: "Community Trust", description: "Join thousands of trusted farmers and landowners" }
];

const Home: React.FC = () => {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 text-white antialiased">
      {/* top nav */}
      <header className="sticky top-0 z-30 bg-black/10 backdrop-blur-sm">
        <nav className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KodishaLogo size={44} />
            <div>
              <div className="text-lg font-semibold leading-none">Kodisha</div>
              <div className="text-xs text-emerald-200 -mt-0.5">Cultivating Kenya's agricultural future</div>
            </div>
          </div>

          <div className="md:flex items-center gap-6 hidden">
            <Link to="/browse" className="text-emerald-100 hover:text-white transition-colors">Browse</Link>
            <Link to="/find-services" className="text-emerald-100 hover:text-white transition-colors">Services</Link>
            <Link to="/list-property" className="text-emerald-100 hover:text-white transition-colors">List</Link>
          </div>

          <Link to="/list-property" className="md:hidden inline-flex items-center gap-2 bg-emerald-700/90 px-3 py-2 rounded-xl text-sm font-medium">
            List
          </Link>
        </nav>
      </header>

      {/* hero */}
      <section className="max-w-3xl mx-auto px-5 py-10 text-center">
        <div className="inline-flex items-center gap-3 bg-white/6 px-4 py-2 rounded-full mx-auto mb-6 border border-white/8">
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          <span className="text-emerald-100 text-xs font-medium">Kenya’s Trusted Farmland Marketplace</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-4">
          Cultivate Your
          <span className="block bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-yellow-300">Farming Dreams</span>
        </h1>

        <p className="text-sm sm:text-base text-emerald-100 mb-6">
          Connect with verified farmland across Kenya’s 47 counties. From seasonal leases to long-term partnerships — grow with confidence.
        </p>

        <div className="flex flex-col sm:flex-row sm:justify-center gap-3 mb-8">
          <Link
            to="/browse"
            className="inline-flex items-center justify-center gap-3 bg-white text-emerald-900 px-4 py-3 rounded-2xl font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition"
            aria-label="Browse Land Listings"
          >
            <span>🏞️</span>
            <span className="text-sm">Browse Land Listings</span>
            <span className="hidden sm:inline">→</span>
          </Link>

          <Link
            to="/list-property"
            className="inline-flex items-center justify-center gap-3 bg-emerald-800/95 text-white px-4 py-3 rounded-2xl font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition"
            aria-label="List Your Property"
          >
            <span>📝</span>
            <span className="text-sm">List Your Property</span>
          </Link>
        </div>

        {/* stats */}
        <ul className="grid grid-cols-3 gap-4 max-w-md mx-auto text-center mb-6">
          <li>
            <div className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-yellow-300">47</div>
            <div className="text-emerald-200 text-xs">Counties</div>
          </li>
          <li>
            <div className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-yellow-300">100+</div>
            <div className="text-emerald-200 text-xs">Listings</div>
          </li>
          <li>
            <div className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-yellow-300">24/7</div>
            <div className="text-emerald-200 text-xs">Support</div>
          </li>
        </ul>
      </section>

      {/* features: grid is responsive and lightweight */}
      <section className="max-w-5xl mx-auto px-5 pb-12">
        <div className="mb-6 text-center">
          <h2 className="text-xl sm:text-2xl font-bold">Why Choose Kodisha?</h2>
          <p className="text-emerald-100 text-sm sm:text-base max-w-2xl mx-auto">Built for modern farmers by agricultural experts. Every feature designed to make your farming journey seamless.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <article key={i} className="bg-white/6 rounded-2xl p-4 border border-white/6 hover:border-emerald-400/30 transition transform hover:-translate-y-1">
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-base mb-1">{f.title}</h3>
              <p className="text-emerald-100 text-sm">{f.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ecosystem + CTAs */}
      <section className="max-w-5xl mx-auto px-5 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Link to="/browse" className="group p-6 rounded-2xl bg-gradient-to-br from-emerald-800/90 to-emerald-700/90 border border-emerald-600/20 shadow-md hover:shadow-lg transition">
            <div className="flex gap-3">
              <div className="text-3xl">🏞️</div>
              <div>
                <h3 className="text-lg font-bold">Farmland Marketplace</h3>
                <p className="text-emerald-100 text-sm">Discover verified agricultural land perfect for crops, livestock, or mixed farming. Filter by county, soil type, water availability, and seasonal availability.</p>
              </div>
            </div>
          </Link>

          <Link to="/find-services" className="group p-6 rounded-2xl bg-gradient-to-br from-emerald-800/90 to-emerald-700/90 border border-emerald-600/20 shadow-md hover:shadow-lg transition">
            <div className="flex gap-3">
              <div className="text-3xl">🚜</div>
              <div>
                <h3 className="text-lg font-bold">Agricultural Services</h3>
                <p className="text-emerald-100 text-sm">Access professional services including equipment hire, agrovet supplies, land surveying, and agricultural consulting from trusted providers.</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <div className="bg-white/6 p-6 rounded-2xl border border-white/8 inline-block">
            <h3 className="text-lg font-bold mb-2">Ready to Grow?</h3>
            <p className="text-emerald-100 text-sm mb-3">Join Kenya's fastest growing agricultural community today</p>
            <Link to="/list-property" className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-yellow-500 px-4 py-2 rounded-2xl font-semibold text-white">Start Listing Today 🌱</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-emerald-700/40 mt-12">
        <div className="max-w-6xl mx-auto px-5 py-6 text-center text-emerald-200 text-sm">
          © {new Date().getFullYear()} Kodisha. Cultivating Kenya's agricultural future.
        </div>
      </footer>
    </main>
  );
};

export default Home;
