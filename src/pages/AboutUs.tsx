import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { kenyaCounties } from '../data/kenyaCounties';

const AboutUs: React.FC = () => {
  const { user } = useAuth();

  const founderName = "Stephen Omukoko Okoth";
  const founderWhatsapp = "254796389192";
  const founderWhatsappDisplay = "0796 389 192";
  const founderImage = "/images/stephen-omukoko-okoth.jpg";
  const founderLinkedIn = "https://www.linkedin.com/in/stephen-omukoko-okoth-a4a5b7188";
  const cooName = "Joseph Mugalla";
  const cooTitle = "Chief Operating Officer";
  const cooImage = "/images/joseph-mugalla.jpeg";
  const cooLinkedIn = "https://www.linkedin.com/in/joseph-mugalla-a387a1267";
  const cooSummary =
    "Joseph Mugalla is Agrisoko's Chief Operating Officer. He brings together operations, market research, agribusiness experience, and software delivery discipline to keep the platform practical, responsive, and execution-focused as it grows across Kenya.";
  const chiefOfStaffName = "Valary Akong'ai";
  const chiefOfStaffTitle = "Chief of Staff";
  const chiefOfStaffImage = "/images/valary-akongai.jpeg";
  const chiefOfStaffLinkedIn = "https://www.linkedin.com/in/valary-akong-ai-93115735a";
  const chiefOfStaffSummary =
    "Akong'ai Valary Purity is a Meteorology graduate and Agrisoko's Chief of Staff. She focuses on climate intelligence, environmental risk awareness, and resilient agribusiness systems that help keep agricultural trade practical, informed, and future-ready.";
  const cmoName = "Stanley Bwire";
  const cmoTitle = "Chief Marketing Officer";
  const cmoImage = "/images/stanley-bwire.jpeg";
  const cmoSummary =
    "Stanley Bwire is Agrisoko's Chief Marketing Officer. As a sales and marketing executive specializing in digital marketing and media production, he combines graphic design, market research, and product advertising to connect Agrisoko with the right audience through clear, data-driven campaigns.";
  const organizationSameAs = [
    "https://wa.me/254796389192",
    "https://chat.whatsapp.com/HzCaV5YVz86CjwajiOHR5i",
  ];

  const countiesCount = kenyaCounties.length;
  const isFullyVerified =
    user?.verification?.status === "approved" || !!user?.verification?.idVerified;
  const verificationLink = user ? (isFullyVerified ? '/profile' : '/verify-id') : '/login';
  const verificationCta = user ? (isFullyVerified ? 'View verification status' : 'Verify your profile') : 'Sign in to verify';

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
        <script type="application/ld+json">
          {JSON.stringify(
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": "https://www.agrisoko254.com/#organization",
              name: "Agrisoko Limited",
              alternateName: "Agrisoko",
              url: "https://www.agrisoko254.com",
              logo: "https://www.agrisoko254.com/logo512.png",
              email: "info@leadafrik.com",
              telephone: "+254796389192",
              slogan: "Trusted agricultural marketplace across Kenya",
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "Customer Service",
                telephone: "+254796389192",
                email: "info@leadafrik.com",
                areaServed: "KE",
                availableLanguage: ["English", "Swahili"],
              },
              address: {
                "@type": "PostalAddress",
                addressCountry: "KE",
                addressLocality: "Kenya",
              },
              sameAs: organizationSameAs,
              founder: {
                "@type": "Person",
                name: founderName,
              },
            },
            null,
            2
          )}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(
            {
              "@context": "https://schema.org",
              "@type": "Person",
              name: founderName,
              jobTitle: "Founder, Agrisoko",
              image: `https://www.agrisoko254.com${founderImage}`,
              sameAs: [founderLinkedIn],
              worksFor: {
                "@type": "Organization",
                name: "Agrisoko Limited",
              },
              address: {
                "@type": "PostalAddress",
                addressCountry: "KE",
              },
            },
            null,
            2
          )}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(
            {
              "@context": "https://schema.org",
              "@type": "Person",
              name: cooName,
              jobTitle: cooTitle,
              image: `https://www.agrisoko254.com${cooImage}`,
              description: cooSummary,
              sameAs: [cooLinkedIn],
              worksFor: {
                "@type": "Organization",
                name: "Agrisoko Limited",
              },
              address: {
                "@type": "PostalAddress",
                addressCountry: "KE",
              },
            },
            null,
            2
          )}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(
            {
              "@context": "https://schema.org",
              "@type": "Person",
              name: chiefOfStaffName,
              jobTitle: chiefOfStaffTitle,
              image: `https://www.agrisoko254.com${chiefOfStaffImage}`,
              description: chiefOfStaffSummary,
              sameAs: [chiefOfStaffLinkedIn],
              worksFor: {
                "@type": "Organization",
                name: "Agrisoko Limited",
              },
              address: {
                "@type": "PostalAddress",
                addressCountry: "KE",
              },
            },
            null,
            2
          )}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(
            {
              "@context": "https://schema.org",
              "@type": "Person",
              name: cmoName,
              jobTitle: cmoTitle,
              image: `https://www.agrisoko254.com${cmoImage}`,
              description: cmoSummary,
              worksFor: {
                "@type": "Organization",
                name: "Agrisoko Limited",
              },
              address: {
                "@type": "PostalAddress",
                addressCountry: "KE",
              },
            },
            null,
            2
          )}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntityOfPage: "https://www.agrisoko254.com/about",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "What is Agrisoko?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Agrisoko is a Kenyan agricultural marketplace where farmers, buyers, and service providers connect to trade produce, inputs, livestock, and services directly.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How does verification work?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Sellers submit ID and selfie verification to build trust. Verified profiles receive higher visibility and faster approvals.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How do I list on Agrisoko?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Create an account, fill in your listing details, and publish. You can also post a buy request if you are looking to purchase.",
                  },
                },
              ],
            },
            null,
            2
          )}
        </script>
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
                  Built by Kenyans, for Kenyan agriculture.
                </h1>
                <p className="text-base text-slate-600 max-w-xl">
                  Agrisoko connects farmers, traders, agrovets, and buyers across all 47 counties.
                  We help Kenyans trade directly, reduce broker costs, and build trust through verified profiles.
                </p>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  Karibuni. Biashara bila middlemen - direct to farm, direct to buyer.
                </div>
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
                  <p className="text-2xl font-semibold text-slate-900">{countiesCount}</p>
                  <p className="text-xs text-slate-500">Nationwide reach</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Trust checks</p>
                  <p className="text-2xl font-semibold text-slate-900">Verified</p>
                  <p className="text-xs text-slate-500">Profiles and listings</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:col-span-2">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Active community</p>
                  <p className="text-lg font-semibold text-slate-900">Farmers, buyers, and service providers</p>
                  <p className="text-xs text-slate-500">Growing daily across Kenya</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-700 font-semibold">Our Mission</p>
              <h2 className="about-title text-3xl text-slate-900 mt-3">Make direct trade normal</h2>
              <p className="text-slate-600 mt-3 leading-relaxed">
                Help Kenyan farmers and agribusinesses sell and buy directly, without broker pressure, with clear pricing and trusted profiles.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-700 font-semibold">Our Vision</p>
              <h2 className="about-title text-3xl text-slate-900 mt-3">A trusted Kenyan marketplace</h2>
              <p className="text-slate-600 mt-3 leading-relaxed">
                A platform where every farmer, buyer, agrovet, and service provider can trade with confidence, backed by verification and accountability.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
            <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] items-start">
              <div>
                <img
                  src={founderImage}
                  alt={`${founderName} - Founder of Agrisoko`}
                  className="w-full rounded-2xl object-cover shadow-sm"
                  loading="lazy"
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-700 font-semibold">
                  Founder Story
                </p>
                <h2 className="about-title text-3xl text-slate-900 mt-3">
                  From broker losses to a digital agriculture future
                </h2>
                <p className="text-slate-700 mt-4 leading-relaxed">
                  {founderName} built Agrisoko after seeing the same painful pattern in Kenyan markets:
                  farmers did the hardest work, but middlemen captured the biggest share and many families
                  were left with unfair prices.
                </p>
                <p className="text-slate-700 mt-3 leading-relaxed">
                  Agrisoko exists to change that system. By taking agriculture digital, verified farmers,
                  buyers, agrovets, and service providers can discover each other faster, negotiate directly,
                  and trade with clear accountability.
                </p>
                <p className="text-slate-700 mt-3 leading-relaxed">
                  This is the long game: make Kenya fully ready for 21st-century agricultural commerce,
                  where reputation is earned, prices are transparent, and every county can compete in one trusted market.
                </p>
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-sm font-semibold text-emerald-900">
                    "Your verified Agrisoko profile is your trading reputation."
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href={`https://wa.me/${founderWhatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                  >
                    WhatsApp {founderWhatsappDisplay}
                  </a>
                  <a
                    href={founderLinkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    View LinkedIn Profile
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
            <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] items-start">
              <div>
                <img
                  src={cooImage}
                  alt={`${cooName} - ${cooTitle} at Agrisoko`}
                  className="w-full rounded-2xl object-cover shadow-sm"
                  loading="lazy"
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-700 font-semibold">
                  Leadership
                </p>
                <h2 className="about-title text-3xl text-slate-900 mt-3">
                  {cooName}
                </h2>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {cooTitle}
                </p>
                <p className="text-slate-700 mt-4 leading-relaxed">
                  {cooSummary}
                </p>
                <p className="text-slate-700 mt-3 leading-relaxed">
                  His background across social science, technology, and agribusiness helps Agrisoko stay grounded in real market behavior while building reliable systems for sellers, buyers, and service providers.
                </p>
                <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Operations</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Market Research</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Agribusiness</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Software Delivery</span>
                </div>
                <div className="mt-5">
                  <a
                    href={cooLinkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    View LinkedIn Profile
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
            <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] items-start">
              <div>
                <img
                  src={chiefOfStaffImage}
                  alt={`${chiefOfStaffName} - ${chiefOfStaffTitle} at Agrisoko`}
                  className="w-full rounded-2xl object-cover shadow-sm"
                  loading="lazy"
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-700 font-semibold">
                  Leadership
                </p>
                <h2 className="about-title text-3xl text-slate-900 mt-3">
                  {chiefOfStaffName}
                </h2>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {chiefOfStaffTitle}
                </p>
                <p className="text-slate-700 mt-4 leading-relaxed">
                  {chiefOfStaffSummary}
                </p>
                <p className="text-slate-700 mt-3 leading-relaxed">
                  She is focused on building data-informed, climate-resilient, and commercially viable systems that help farmers make better decisions, strengthen food security, and support sustainable agricultural growth across Kenya.
                </p>
                <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Climate Intelligence</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Risk Assessment</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Agribusiness</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Sustainable Systems</span>
                </div>
                <div className="mt-5">
                  <a
                    href={chiefOfStaffLinkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    View LinkedIn Profile
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
            <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] items-start">
              <div>
                <img
                  src={cmoImage}
                  alt={`${cmoName} - ${cmoTitle} at Agrisoko`}
                  className="w-full rounded-2xl object-cover shadow-sm"
                  loading="lazy"
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-700 font-semibold">
                  Leadership
                </p>
                <h2 className="about-title text-3xl text-slate-900 mt-3">
                  {cmoName}
                </h2>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {cmoTitle}
                </p>
                <p className="text-slate-700 mt-4 leading-relaxed">
                  {cmoSummary}
                </p>
                <p className="text-slate-700 mt-3 leading-relaxed">
                  His work focuses on making Agrisoko visible, credible, and relevant in the market through strong brand communication, practical media execution, and marketing that is tied to real user behavior.
                </p>
                <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Digital Marketing</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Media Production</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Market Research</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Product Advertising</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-700 font-semibold">What we offer</p>
                <h2 className="about-title text-3xl text-slate-900 mt-2">Everything for your farm and agribusiness</h2>
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
                <p className="text-sm text-slate-600 mt-3">High-quality maize, onions, potatoes, fruits, and vegetables listed by farmers.</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li>- Vegetables and fruits</li>
                  <li>- Grains and cereals</li>
                  <li>- Farm-to-buyer deals</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">IN</div>
                  <h3 className="text-xl font-semibold text-slate-900">Inputs</h3>
                </div>
                <p className="text-sm text-slate-600 mt-3">Certified seeds, fertilizer, and tools from verified suppliers.</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li>- Seeds and seedlings</li>
                  <li>- Fertilizers and crop care</li>
                  <li>- Tools and equipment</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">SV</div>
                  <h3 className="text-xl font-semibold text-slate-900">Services</h3>
                </div>
                <p className="text-sm text-slate-600 mt-3">Tractors, transport, land prep, and agribusiness services across Kenya.</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li>- Equipment rental</li>
                  <li>- Transport and logistics</li>
                  <li>- Land preparation</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Why choose Agrisoko</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p><span className="font-semibold text-slate-800">Direct connections:</span> Fair pricing without middlemen.</p>
                <p><span className="font-semibold text-slate-800">Verified profiles:</span> Trust signals on every transaction.</p>
                <p><span className="font-semibold text-slate-800">Nationwide reach:</span> Listings across {countiesCount} counties.</p>
                <p><span className="font-semibold text-slate-800">Data protection:</span> ODPC-aligned handling of your information.</p>
                <p><span className="font-semibold text-slate-800">Ratings and reviews:</span> Transparent reputation building.</p>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">How it works</h3>
              <ol className="mt-4 space-y-3 text-sm text-slate-600">
                <li><span className="font-semibold text-slate-800">1. Sign up and verify</span> - Create your profile and verify identity.</li>
                <li><span className="font-semibold text-slate-800">2. List or browse</span> - Post a listing or search.</li>
                <li><span className="font-semibold text-slate-800">3. Connect and agree</span> - Chat and settle terms.</li>
                <li><span className="font-semibold text-slate-800">4. Complete and rate</span> - Close the deal.</li>
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
              <p className="text-sm text-slate-600 mt-3">
                Email us, message us directly on WhatsApp, or join the WhatsApp community for fast support.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <a
                  href="mailto:info@leadafrik.com"
                  className="inline-flex justify-center items-center rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800 transition"
                >
                  Email Support
                </a>
                <a
                  href={`https://wa.me/${founderWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center items-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-2 text-sm font-semibold hover:bg-emerald-100 transition"
                >
                  WhatsApp {founderWhatsappDisplay}
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
                <p><span className="font-semibold text-slate-800">{countiesCount} counties</span> connected nationwide.</p>
                <p><span className="font-semibold text-slate-800">Active listings</span> updated daily.</p>
                <p><span className="font-semibold text-slate-800">Support</span> available through email and WhatsApp.</p>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-slate-500">Trust</p>
              <h3 className="text-xl font-semibold text-slate-900 mt-2">Built on verification</h3>
              <p className="text-sm text-slate-600 mt-3">Profiles are verified and ratings keep the marketplace honest.</p>
              <Link
                to={verificationLink}
                className="mt-4 inline-flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                {verificationCta}
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default AboutUs;

