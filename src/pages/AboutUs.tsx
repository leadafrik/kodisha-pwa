import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

const AboutUs: React.FC = () => {
  const { user } = useAuth();
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadUserCount = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/metrics/community`);
        const data = await response.json().catch(() => ({}));
        const total = data?.data?.users?.total;

        if (isMounted && typeof total === 'number') {
          setUserCount(total);
        }
      } catch (error) {
        // Silent fail to keep the page functional if metrics are unavailable.
      }
    };

    loadUserCount();

    return () => {
      isMounted = false;
    };
  }, []);

  const userCountLabel =
    userCount !== null ? `${userCount.toLocaleString()} registered users` : 'Live user count updating';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;700&family=Sora:wght@400;500;600;700&display=swap');
        :root {
          --ink: #0f172a;
          --muted: #475569;
          --accent: #0f766e;
          --accent-soft: #ccfbf1;
          --sun: #fbbf24;
          --sand: #fef3c7;
        }
        .about-shell {
          font-family: "Sora", "Segoe UI", "Tahoma", sans-serif;
        }
        .about-title {
          font-family: "Fraunces", "Georgia", serif;
        }
        .fade-rise {
          animation: fadeRise 0.8s ease both;
        }
        @keyframes fadeRise {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="about-shell">
        <section className="relative overflow-hidden">
          <div className="absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />

          <div className="max-w-6xl mx-auto px-4 pt-16 pb-12">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-center">
              <div className="space-y-5 fade-rise">
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-700 font-semibold">
                  About Agrisoko
                </p>
                <h1 className="about-title text-4xl md:text-5xl text-slate-900">
                  Kenya's agricultural marketplace, redesigned for real trade.
                </h1>
                <p className="text-base text-slate-600 max-w-xl">
                  Agrisoko connects farmers, producers, service providers, and buyers across all 47 counties.
                  We remove middlemen, build trust, and keep commerce flowing with verified profiles and direct chat.
                </p>
                <div className="flex flex-wrap gap-3">
                  {!user && (
                    <Link
                      to="/login"
                      className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                    >
                      Sign In
                    </Link>
                  )}
                  <Link
                    to="/browse"
                    className="inline-flex items-center rounded-xl border border-emerald-200 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition"
                  >
                    Explore Listings
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 fade-rise">
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Counties covered</p>
                  <p className="text-2xl font-semibold text-slate-900">47</p>
                  <p className="text-xs text-slate-500">Nationwide reach</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Verified profiles</p>
                  <p className="text-2xl font-semibold text-slate-900">100%</p>
                  <p className="text-xs text-slate-500">Trust-first access</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:col-span-2">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Active community</p>
                  <p className="text-lg font-semibold text-slate-900">{userCountLabel}</p>
                  <p className="text-xs text-slate-500">Farmers, buyers, and service providers</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-700 font-semibold">Our Mission</p>
              <h2 className="about-title text-3xl text-slate-900 mt-3">Digitize the market</h2>
              <p className="text-slate-600 mt-3 leading-relaxed">
                We bring Kenya's agricultural trade online, making it accessible, efficient, and aligned with modern
                standards. Agrisoko connects buyers and sellers directly, so commerce stays fair and transparent.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-700 font-semibold">Our Vision</p>
              <h2 className="about-title text-3xl text-slate-900 mt-3">A trusted ecosystem</h2>
              <p className="text-slate-600 mt-3 leading-relaxed">
                We envision a thriving agricultural network where every farmer, buyer, and service provider has equal
                access to markets, information, and opportunity, powered by verified profiles and direct connections.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-700 font-semibold">What we offer</p>
                <h2 className="about-title text-3xl text-slate-900 mt-2">The full agricultural stack</h2>
              </div>
              <Link
                to="/browse"
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Browse offerings
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">PR</div>
                  <h3 className="text-xl font-semibold text-slate-900">Produce</h3>
                </div>
                <p className="text-sm text-slate-600 mt-3">Fresh produce listed directly by farmers and producers.</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li>- Vegetables and fruits</li>
                  <li>- Livestock and animal products</li>
                  <li>- Grains and cereals</li>
                  <li>- Direct farm-to-buyer deals</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">IN</div>
                  <h3 className="text-xl font-semibold text-slate-900">Inputs</h3>
                </div>
                <p className="text-sm text-slate-600 mt-3">Trusted suppliers for reliable agricultural inputs.</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li>- Seeds and seedlings</li>
                  <li>- Fertilizers and soil nutrients</li>
                  <li>- Pesticides and herbicides</li>
                  <li>- Equipment and tools</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">SV</div>
                  <h3 className="text-xl font-semibold text-slate-900">Services</h3>
                </div>
                <p className="text-sm text-slate-600 mt-3">Professional services for modern farms and agribusiness.</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li>- Land surveying and mapping</li>
                  <li>- Transport and logistics</li>
                  <li>- Equipment rental and leasing</li>
                  <li>- Land preparation and landscaping</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Why choose Agrisoko</h3>
              <div className="mt-4 space-y-4 text-sm text-slate-600">
                <p><span className="font-semibold text-slate-800">Direct connections:</span> Fair pricing without middlemen.</p>
                <p><span className="font-semibold text-slate-800">Verified profiles:</span> Trust signals on every transaction.</p>
                <p><span className="font-semibold text-slate-800">Nationwide coverage:</span> Reach all 47 counties.</p>
                <p><span className="font-semibold text-slate-800">Data protection:</span> Industry-standard security.</p>
                <p><span className="font-semibold text-slate-800">Simple to use:</span> Built for first-time digital traders.</p>
                <p><span className="font-semibold text-slate-800">Ratings and reviews:</span> Transparent reputation building.</p>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">How it works</h3>
              <ol className="mt-4 space-y-4 text-sm text-slate-600">
                <li><span className="font-semibold text-slate-800">1. Sign up and verify</span> - Create your profile and verify identity.</li>
                <li><span className="font-semibold text-slate-800">2. List or browse</span> - Post a listing or explore what is available.</li>
                <li><span className="font-semibold text-slate-800">3. Connect and negotiate</span> - Chat and agree on terms directly.</li>
                <li><span className="font-semibold text-slate-800">4. Complete and rate</span> - Close the deal and leave feedback.</li>
              </ol>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="rounded-3xl bg-emerald-600 text-white p-10 text-center shadow-lg">
            <h2 className="about-title text-3xl mb-3">Ready to get started?</h2>
            <p className="text-emerald-100 mb-6">
              Join thousands of farmers, producers, buyers, and service providers building a stronger agricultural economy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user && (
                <Link
                  to="/login"
                  className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-white text-emerald-700 font-semibold hover:bg-emerald-50 transition"
                >
                  Sign In
                </Link>
              )}
              <Link
                to="/create-listing"
                className="inline-flex justify-center items-center px-6 py-3 rounded-xl border border-white text-white font-semibold hover:bg-emerald-700 transition"
              >
                Post a Listing
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-slate-500">Support</p>
              <h3 className="text-xl font-semibold text-slate-900 mt-2">We are here to help</h3>
              <p className="text-sm text-slate-600 mt-3">Email or join the WhatsApp community to get quick assistance.</p>
              <div className="mt-4 flex flex-col gap-2">
                <a
                  href="mailto:kodisha.254.ke@gmail.com"
                  className="inline-flex justify-center items-center rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800 transition"
                >
                  Email Support
                </a>
                <a
                  href="https://chat.whatsapp.com/HzCaV5YVz86CjwajiOHR5i"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center items-center rounded-xl border border-slate-200 text-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition"
                >
                  WhatsApp Community
                </a>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-slate-500">Impact</p>
              <h3 className="text-xl font-semibold text-slate-900 mt-2">Growing every week</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p><span className="font-semibold text-slate-800">47 counties</span> connected nationwide.</p>
                <p><span className="font-semibold text-slate-800">{userCount ? userCount.toLocaleString() : '—'} users</span> actively trading.</p>
                <p><span className="font-semibold text-slate-800">24/7 support</span> available to the community.</p>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-slate-500">Trust</p>
              <h3 className="text-xl font-semibold text-slate-900 mt-2">Built on verification</h3>
              <p className="text-sm text-slate-600 mt-3">Every profile is verified. Ratings keep the marketplace honest.</p>
              <Link
                to="/profile"
                className="mt-4 inline-flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Verify your profile
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 py-10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-4 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-900">Agrisoko</p>
                <p className="mt-2">Connecting Kenya's Agricultural Community</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Links</p>
                <ul className="mt-2 space-y-2">
                  <li><Link to="/" className="hover:text-slate-900 transition">Home</Link></li>
                  <li><Link to="/browse" className="hover:text-slate-900 transition">Browse Listings</Link></li>
                  <li><Link to="/request" className="hover:text-slate-900 transition">Buy Requests</Link></li>
                  <li><Link to="/create-listing" className="hover:text-slate-900 transition">List Products</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Legal</p>
                <ul className="mt-2 space-y-2">
                  <li><Link to="/terms" className="hover:text-slate-900 transition">Terms of Service</Link></li>
                  <li><Link to="/privacy" className="hover:text-slate-900 transition">Privacy Policy</Link></li>
                  <li><Link to="/privacy" className="hover:text-slate-900 transition">Data Protection</Link></li>
                  <li><Link to="/privacy" className="hover:text-slate-900 transition">ODPC</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Contact</p>
                <ul className="mt-2 space-y-2">
                  <li><a href="mailto:kodisha.254.ke@gmail.com" className="hover:text-slate-900 transition">Email Support</a></li>
                  <li><a href="https://chat.whatsapp.com/HzCaV5YVz86CjwajiOHR5i" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition">WhatsApp Community</a></li>
                  <li><Link to="/contact" className="hover:text-slate-900 transition">Contact Support</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 text-xs text-slate-500 text-center">
              <p>Copyright 2025 Agrisoko. All rights reserved.</p>
              <p className="mt-1">By using Agrisoko, you agree to our Terms of Service and Privacy Policy.</p>
              <p className="mt-1">For data protection inquiries: kodisha.254.ke@gmail.com</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};


export default AboutUs;
