import React from 'react'
import { Link } from 'react-router-dom'

const highlights = [
  { title: 'Verified farmland', body: 'Listings are reviewed so you can rent or buy with confidence.' },
  { title: 'Nationwide reach', body: 'Coverage across all 47 counties with local details that matter.' },
  { title: 'Simple onboarding', body: 'List land, equipment, or services in minutes with guided steps.' },
  { title: 'Trusted community', body: 'Built for Kenyan farmers, landowners, and agri-service providers.' },
]

const Home: React.FC = () => {
  return (
    <main className="min-h-screen bg-emerald-950 text-white">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-14">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-100 text-xs tracking-wide">
            Kenya's Farmland Marketplace
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold leading-tight">
            Find, list, and verify farmland with ease.
          </h1>
          <p className="mt-4 text-emerald-100 max-w-xl">
            Kodisha connects farmers, landowners, and agri-service providers. Browse verified land, list your property,
            and get support to grow across all 47 counties.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              to="/browse"
              className="inline-flex justify-center items-center px-4 py-3 rounded-xl bg-white text-emerald-900 font-semibold shadow-sm hover:shadow-lg transition"
            >
              Browse listings
            </Link>
            <Link
              to="/list-property"
              className="inline-flex justify-center items-center px-4 py-3 rounded-xl bg-emerald-700 text-white font-semibold border border-emerald-500 hover:bg-emerald-600 transition"
            >
              List your land
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 max-w-md text-sm text-emerald-100">
            <div>
              <div className="text-2xl font-bold text-emerald-200">47</div>
              <div>Counties</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-200">100+</div>
              <div>Active listings</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-200">24/7</div>
              <div>Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="bg-emerald-900/50 border-t border-emerald-800/60">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {highlights.map((item) => (
            <div key={item.title} className="p-5 rounded-xl bg-white/5 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-emerald-100 text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick paths */}
      <section className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Link
          to="/browse"
          className="group p-6 rounded-2xl bg-emerald-900/70 border border-emerald-800 hover:border-emerald-500/60 transition"
        >
          <h3 className="text-xl font-semibold mb-2">Farmland marketplace</h3>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Search verified agricultural land for seasonal leases, long-term rentals, or purchase.
          </p>
          <span className="mt-3 inline-block text-emerald-200 text-sm group-hover:text-white">
            Browse land 
          </span>
        </Link>

        <Link
          to="/find-services"
          className="group p-6 rounded-2xl bg-emerald-900/70 border border-emerald-800 hover:border-emerald-500/60 transition"
        >
          <h3 className="text-xl font-semibold mb-2">Agri services & equipment</h3>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Connect with equipment hire, agrovets, and professional farm services near you.
          </p>
          <span className="mt-3 inline-block text-emerald-200 text-sm group-hover:text-white">
            Find services 
          </span>
        </Link>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-14">
        <div className="p-6 rounded-2xl border border-emerald-700 bg-emerald-900/60 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Ready to list your land</h3>
          <p className="text-emerald-100 text-sm mb-4">
            Create a listing in minutes with photos, pricing, and county details.
          </p>
          <Link
            to="/list-property"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white text-emerald-900 font-semibold shadow-sm hover:shadow-lg transition"
          >
            Start listing
          </Link>
        </div>
      </section>

      <footer className="border-t border-emerald-800/60">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-emerald-200 text-sm">
           {new Date().getFullYear()} Kodisha. Helping Kenya grow.
        </div>
      </footer>
    </main>
  )
}

export default Home
