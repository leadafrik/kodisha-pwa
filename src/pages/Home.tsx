import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 text-white">
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-14 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-50 text-xs tracking-wide">
          LeadAfrik • Agricultural Ecosystem
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-white">
          Grow with LeadAfrik: land, services, agrovets, and produce in one place.
        </h1>
        <p className="text-emerald-100 text-lg max-w-3xl">
          A minimal, professional hub for Kenya&apos;s agricultural economy—verified people, dynamic
          listings, M-Pesa-ready monetization, and in-app chat to close deals fast.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/browse"
            className="inline-flex justify-center items-center px-5 py-3 rounded-xl bg-white text-emerald-900 font-semibold shadow-sm hover:shadow-lg transition"
          >
            Explore Marketplace
          </Link>
          <Link
            to="/list"
            className="inline-flex justify-center items-center px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold border border-emerald-400 hover:bg-emerald-500 transition"
          >
            List Something
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-emerald-100">
          <div>
            <div className="text-2xl font-bold text-emerald-200">47</div>
            <div>Counties covered</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-200">Unified</div>
            <div>Land • Services • Products</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-200">Verified</div>
            <div>ID + selfie & payouts</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-200">M-Pesa</div>
            <div>STK-ready flows</div>
          </div>
        </div>
      </section>

      <footer className="border-t border-emerald-800/60">
        <div className="max-w-5xl mx-auto px-6 py-6 text-center text-emerald-200 text-sm">
          {new Date().getFullYear()} LeadAfrik • Agricultural Ecosystem
        </div>
      </footer>
    </main>
  );
};

export default Home;
