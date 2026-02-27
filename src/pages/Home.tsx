import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useProperties } from "../contexts/PropertyContext";
import { usePageContent } from "../hooks/usePageContent";
import RaffleCampaign from "../components/RaffleCampaign";

const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;
const launchFeeDeadline = new Date("2026-03-08T23:59:59+03:00");
const launchFeeDeadlineLabel = launchFeeDeadline.toLocaleDateString("en-KE", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const conversionPillars = [
  {
    title: "No middlemen",
    copy: "Chat directly with buyers and keep full control of your profit.",
  },
  {
    title: "Instant trust",
    copy: "Verified badge helps buyers choose you faster.",
  },
  {
    title: "Zero launch risk",
    copy: `Listing remains KSh 0 until ${launchFeeDeadlineLabel}.`,
  },
];

const tradeSteps = [
  {
    title: "Create account",
    copy: "Open your account and set up your profile.",
  },
  {
    title: "Verify profile",
    copy: "Submit ID and selfie once to build buyer trust.",
  },
  {
    title: "Post first listing",
    copy: "List your offer and start receiving direct inquiries.",
  },
];

const buyerDemandSignals = [
  "Maize and beans suppliers",
  "Poultry and livestock",
  "Transport and tractor services",
  "Agrovet inputs and farm supplies",
];

const trustFeatures = [
  {
    title: "Verified traders",
    copy: "ID and selfie verification to reduce fraud and improve confidence.",
    icon: ShieldCheck,
  },
  {
    title: "Direct buyer chat",
    copy: "Real-time messaging to negotiate and close quickly.",
    icon: MessageCircle,
  },
  {
    title: "Smart discovery",
    copy: "Filter by county, category, and pricing expectations.",
    icon: Search,
  },
  {
    title: "County coverage",
    copy: "Agrisoko supports trade across all 47 counties.",
    icon: MapPin,
  },
  {
    title: "Launch fee window",
    copy: `List at KSh 0 during the early window ending ${launchFeeDeadlineLabel}.`,
    icon: Clock3,
  },
  {
    title: "Proof-led reputation",
    copy: "Active listings and verified status strengthen your profile over time.",
    icon: BadgeCheck,
  },
];

const isLiveStatus = (status: unknown) => {
  const normalized = String(status || "").toLowerCase();
  if (!normalized) return true;
  return ![
    "draft",
    "rejected",
    "deleted",
    "removed",
    "archived",
    "inactive",
    "delisted",
  ].includes(normalized);
};

const Home: React.FC = () => {
  const { user } = useAuth();
  const { properties, productListings, serviceListings } = useProperties();

  const { content: heroHeadline } = usePageContent("home.hero.headline");
  const { content: heroDescription } = usePageContent("home.hero.description");
  const { content: announcementText } = usePageContent("home.announcement.banner");

  const liveListingCount = useMemo(() => {
    const liveProducts = (productListings || []).filter((item: any) =>
      isLiveStatus(item?.publishStatus || item?.status)
    ).length;
    const liveServices = (serviceListings || []).filter((item: any) => {
      if (!isLiveStatus(item?.publishStatus || item?.status)) return false;
      if (item?.isDeleted === true || item?.deletedAt) return false;
      return true;
    }).length;
    const liveLand = (properties || []).filter((item: any) =>
      isLiveStatus(item?.publishStatus || item?.status)
    ).length;
    return liveProducts + liveServices + liveLand;
  }, [productListings, serviceListings, properties]);

  const daysLeft = Math.max(
    0,
    Math.ceil((launchFeeDeadline.getTime() - Date.now()) / MILLISECONDS_IN_DAY)
  );
  const launchWindowLabel =
    daysLeft > 0
      ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left at KSh 0`
      : "Launch fee window closing";

  const displayHeadline =
    heroHeadline || "Get your first direct buyers in your county - without brokers.";
  const displayDescription =
    heroDescription ||
    "Built in Kenya for Kenyan farmers, traders, agrovets, and service providers. Verify once, list fast, and win repeat buyers.";
  const displayAnnouncement =
    announcementText ||
    `Launch listing remains KSh 0 until ${launchFeeDeadlineLabel}. Secure your early seller position now.`;

  const primaryCtaTo = user ? "/create-listing" : "/login?next=/create-listing";
  const primaryCtaLabel = user ? "Post Your First Listing" : "Get Verified & List Free";

  return (
    <main className="min-h-screen bg-slate-50 pb-24 text-slate-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;700&family=Sora:wght@400;500;600;700&display=swap');
        .home-shell {
          font-family: "Sora", "Segoe UI", "Tahoma", sans-serif;
        }
        .home-title {
          font-family: "Fraunces", "Georgia", serif;
        }
        .campaign-summary::-webkit-details-marker {
          display: none;
        }
      `}</style>

      <div className="home-shell">
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="pointer-events-none absolute -top-16 left-1/3 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 right-0 h-72 w-72 rounded-full bg-amber-200/35 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-14 md:pb-16 md:pt-20">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                <Sparkles className="h-3.5 w-3.5" />
                Launch Fee Alert
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] tracking-[0.12em]">
                  {launchWindowLabel}
                </span>
              </div>

              <h1 className="home-title mt-5 text-4xl leading-tight text-slate-900 md:text-6xl">
                {displayHeadline}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-700 md:text-lg">
                {displayDescription}
              </p>
              <p className="mt-3 text-sm font-medium text-emerald-800">{displayAnnouncement}</p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={primaryCtaTo}
                  className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-300/40 transition hover:bg-emerald-700"
                >
                  {primaryCtaLabel}
                  <span className="ml-1 text-xs text-emerald-100">(takes ~3 mins)</span>
                </Link>
                <Link
                  to="/request"
                  className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                >
                  See Who&apos;s Buying in My County
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 px-4 py-4 text-slate-900">
          <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-3">
            <span className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
              <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{liveListingCount.toLocaleString()} founding listings live</span>
            </span>
            <span className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
              <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>47 counties open for trade</span>
            </span>
            <span className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
              <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Verified profiles and direct buyer chat</span>
            </span>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14">
          <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-7 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Founding seller advantage</p>
              <h2 className="home-title mt-3 text-3xl text-slate-900 md:text-4xl">
                Secure your county before the category gets crowded
              </h2>
              <ul className="mt-5 space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Appear earlier in buyer discovery
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Earn buyer trust with verification
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Build repeat customers before late entrants
                </li>
              </ul>
              <Link
                to={primaryCtaTo}
                className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Secure My County Position
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </article>

            <article className="rounded-3xl border border-amber-200 bg-amber-50 p-7 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-800">Urgency window</p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900">
                Launch listing is free until {launchFeeDeadlineLabel}
              </h3>
              <p className="mt-2 text-sm text-slate-700">
                After launch, listing fees return. Start now to keep early position and trust momentum.
              </p>
              <Link
                to={primaryCtaTo}
                className="mt-6 inline-flex min-h-[44px] items-center rounded-xl border border-amber-300 bg-white px-5 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
              >
                Get Verified & List Free
              </Link>
            </article>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-14">
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Why sellers convert</p>
            <h2 className="home-title mt-2 text-3xl text-slate-900 md:text-4xl">Outcomes that move revenue</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {conversionPillars.map((pillar) => (
              <article key={pillar.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{pillar.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{pillar.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white px-4 py-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Early market activity</p>
              <h2 className="home-title mt-2 text-3xl text-slate-900 md:text-4xl">Momentum is already building</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">{liveListingCount.toLocaleString()} founding listings</p>
                <p className="mt-1 text-sm text-slate-600">Early suppliers are already visible to buyers.</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">47 counties open</p>
                <p className="mt-1 text-sm text-slate-600">Every county is available for trusted seller growth.</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">Direct negotiation model</p>
                <p className="mt-1 text-sm text-slate-600">No broker layers between you and your buyer.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">How it works</p>
            <h2 className="home-title mt-2 text-3xl text-slate-900 md:text-4xl">
              Create account, verify, list - then receive inquiries
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {tradeSteps.map((step, index) => (
              <article key={step.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{step.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-14">
          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <p className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                Buyer demand
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900">
                Buyers are already searching for core categories
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {buyerDemandSignals.map((signal) => (
                  <li key={signal} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    {signal}
                  </li>
                ))}
              </ul>
              <Link
                to="/request"
                className="mt-6 inline-flex min-h-[44px] items-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                View Buy Requests
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <p className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">
                Trust engine
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900">
                Verified traders close deals faster
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Your public profile, verification status, and listing activity remove hesitation before price talks.
              </p>
              <Link
                to={primaryCtaTo}
                className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Start Trusted Seller Profile
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </article>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white px-4 py-10">
          <div className="mx-auto max-w-7xl">
            <details className="group rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <summary className="campaign-summary flex cursor-pointer list-none items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Founding seller reward pool</p>
                  <p className="text-lg font-semibold text-slate-900">Open raffle details</p>
                  <p className="text-sm text-slate-600">
                    Bonus incentive for qualified verified sellers. Core flow stays focused on listings.
                  </p>
                </div>
                <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                  View
                </span>
              </summary>
              <div className="mt-4">
                <RaffleCampaign />
              </div>
            </details>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Why Agrisoko</p>
            <h2 className="home-title mt-2 text-3xl text-slate-900 md:text-4xl">
              A trusted Kenyan marketplace engineered for conversion
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {trustFeatures.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <feature.icon className="h-5 w-5 text-emerald-700" />
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{feature.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 pt-2">
          <div className="rounded-3xl bg-gradient-to-r from-emerald-700 to-teal-700 p-8 text-white shadow-lg md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">Final call</p>
            <h2 className="home-title mt-3 text-3xl md:text-4xl">Your county is still open. Lock your position now.</h2>
            <p className="mt-3 max-w-2xl text-sm text-emerald-100 md:text-base">
              Create account, verify once, and post your first listing while launch fee remains KSh 0.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to={primaryCtaTo}
                className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                Get Verified & List Free
              </Link>
              <Link
                to="/browse"
                className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-white/80 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-3 left-1/2 z-30 w-[calc(100%-1rem)] max-w-3xl -translate-x-1/2 rounded-2xl border border-emerald-300 bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-900">
            Free listing ends soon: {daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : "launch window closing"}
          </p>
          <Link
            to={primaryCtaTo}
            className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            List for Free Now
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Home;
