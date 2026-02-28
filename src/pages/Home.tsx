import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useProperties } from "../contexts/PropertyContext";
import { useAdaptiveLayout } from "../hooks/useAdaptiveLayout";
import { usePageContent } from "../hooks/usePageContent";
import { PAYMENTS_ENABLED } from "../config/featureFlags";
import RaffleCampaign from "../components/RaffleCampaign";

const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;
const FREE_WINDOW_DAYS = 10;

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
    copy: PAYMENTS_ENABLED
      ? `Listing remains KSh 0 for your first ${FREE_WINDOW_DAYS} days after signup.`
      : "Listings are currently KSh 0 platform-wide during launch.",
  },
];

const tradeSteps = [
  {
    title: "Create account",
    copy: "Create your account.",
  },
  {
    title: "Verify profile",
    copy: "Verify to rank higher.",
  },
  {
    title: "Post first listing",
    copy: "Post and receive inquiries.",
  },
];

const buyerDemandSignals = [
  "Maize and beans suppliers",
  "Poultry and livestock",
  "Transport and tractor services",
  "Agrovet inputs",
];

const trustFeatures = [
  {
    title: "Verified traders",
    copy: "ID and selfie verification.",
    icon: ShieldCheck,
  },
  {
    title: "Direct buyer chat",
    copy: "Negotiate directly.",
    icon: MessageCircle,
  },
  {
    title: "Smart discovery",
    copy: "Filter by county and category.",
    icon: Search,
  },
  {
    title: "Proof-led reputation",
    copy: "Verified profiles build reputation.",
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

const toValidDate = (value: unknown): Date | null => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const Home: React.FC = () => {
  const { user } = useAuth();
  const { isPhone, isTouch, prefersReducedMotion } = useAdaptiveLayout();
  const { properties, productListings, serviceListings } = useProperties();

  const { content: heroHeadline } = usePageContent("home.hero.headline");
  const { content: heroDescription } = usePageContent("home.hero.description");

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

  const signupDate = toValidDate(user?.createdAt);
  const freeWindowEndsAt = signupDate
    ? signupDate.getTime() + FREE_WINDOW_DAYS * MILLISECONDS_IN_DAY
    : null;
  const daysLeft =
    freeWindowEndsAt === null
      ? FREE_WINDOW_DAYS
      : Math.max(0, Math.ceil((freeWindowEndsAt - Date.now()) / MILLISECONDS_IN_DAY));
  const isGlobalFreeListing = !PAYMENTS_ENABLED;
  const launchWindowLabel = isGlobalFreeListing
    ? "Free now"
    : user
    ? daysLeft > 0
      ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left at KSh 0`
      : "Free launch window ended"
    : `KSh 0 for your first ${FREE_WINDOW_DAYS} days`;

  const displayHeadline =
    heroHeadline || "Get direct buyers in your county - without brokers.";
  const displayDescription =
    heroDescription || "Create your free account in 10 seconds. List later.";
  const signupCtaLabel = isPhone ? "Create Account" : "Create Free Account";
  const primaryCtaTo = user ? "/profile" : "/login?mode=signup&next=/profile";
  const primaryCtaLabel = user ? "Open My Dashboard" : signupCtaLabel;
  const buyRequestsTo = user ? "/request" : "/login?mode=signup&next=/request";
  const browseTo = user ? "/browse" : "/login?mode=signup&next=/browse";
  const demandCtaTo = user ? buyRequestsTo : primaryCtaTo;
  const demandCtaLabel = user ? "View Buy Requests" : signupCtaLabel;
  const urgencyBody = isGlobalFreeListing
    ? "No listing fee right now."
    : user
    ? daysLeft > 0
      ? "Use your active free window to post now and lock in trust early."
      : "You can still list and build trust momentum even after the initial free window."
    : `Every new account gets a personal ${FREE_WINDOW_DAYS}-day KSh 0 listing window.`;
  const heroFocusItems = [
    {
      title: isGlobalFreeListing ? "Free to list" : "Launch window",
      copy: isGlobalFreeListing ? "No listing fee right now." : urgencyBody,
    },
    {
      title: "Early position",
      copy: "47 counties are open for early reputation.",
    },
    {
      title: "Trust later",
      copy: "Start now. Verify when ready.",
    },
  ].slice(0, isPhone ? 2 : 3);
  const finalCallCopy = isGlobalFreeListing
    ? "Create your account and post your first listing. Listing is free right now."
    : user && daysLeft <= 0
    ? "Your county is still open. Keep posting and stay visible to active buyers."
    : "Create account, verify once, and post your first listing while your free 10-day window is active.";
  const stickyWindowText = isGlobalFreeListing
    ? isPhone
      ? "Free to list"
      : "Free to list right now"
    : user
    ? daysLeft > 0
      ? isPhone
        ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
        : `Your free listing window: ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
      : "Your free listing window has ended"
    : `Free listing for your first ${FREE_WINDOW_DAYS} days after signup`;

  return (
    <main className="min-h-screen bg-slate-50 pb-28 text-slate-900 sm:pb-24">
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

          <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-10 sm:pb-12 sm:pt-14 md:pb-16 md:pt-20">
            <div className="grid gap-5 sm:gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                  <Sparkles className="h-3.5 w-3.5" />
                  Free Listing Window
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] tracking-[0.12em]">
                    {launchWindowLabel}
                  </span>
                </div>

                <h1 className="home-title mt-4 text-3xl leading-[1.05] text-slate-900 sm:mt-5 sm:text-4xl md:text-6xl">
                  {displayHeadline}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-700 sm:mt-4 sm:text-base md:text-lg">
                  {displayDescription}
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row">
                  <Link
                    to={primaryCtaTo}
                    className="inline-flex min-h-[46px] w-full items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-300/40 transition hover:bg-emerald-700 sm:w-auto"
                  >
                    {primaryCtaLabel}
                  </Link>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-700 sm:text-xs">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">
                    {liveListingCount.toLocaleString()} listings live
                  </span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">
                    47 counties open
                  </span>
                </div>
              </div>

              <aside
                className={`rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:p-6 ${
                  prefersReducedMotion ? "" : "transition-transform duration-300"
                } ${isTouch ? "" : "lg:hover:-translate-y-0.5"}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  Why now
                </p>
                <h2 className="home-title mt-3 text-2xl text-slate-900 sm:text-3xl">
                  Fast start. Strong trust.
                </h2>
                <div className="mt-4 space-y-3 sm:mt-5">
                  {heroFocusItems.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4"
                    >
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.copy}</p>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <div className="mb-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Why Agrisoko
              </p>
              <h2 className="home-title mt-2 text-2xl text-slate-900 sm:text-3xl md:text-4xl">
                Why people sign up
              </h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {conversionPillars.map((pillar) => (
              <article key={pillar.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <h3 className="text-lg font-semibold text-slate-900">{pillar.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{pillar.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">How it works</p>
            <h2 className="home-title mt-2 text-2xl text-slate-900 sm:text-3xl md:text-4xl">
              3 steps
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {tradeSteps.map((step, index) => (
              <article key={step.title} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{step.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-10 sm:pb-14">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Market proof
            </p>
            <h2 className="home-title mt-2 text-2xl text-slate-900 sm:text-3xl md:text-4xl">
              Buyers are active.
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <p className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                Buyer demand
              </p>
              <h3 className="mt-3 text-xl font-semibold text-slate-900 sm:text-2xl">
                Buyers are searching for
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {buyerDemandSignals.map((signal) => (
                  <li key={signal} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    {signal}
                  </li>
                ))}
              </ul>
              <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Live now
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 sm:text-lg">
                    {liveListingCount.toLocaleString()} listings
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Coverage
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 sm:text-lg">47 counties</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Model
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 sm:text-lg">Direct deal</p>
                </div>
              </div>
              <Link
                to={demandCtaTo}
                className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 sm:w-auto"
              >
                {demandCtaLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <p className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">
                Trade safely on Agrisoko
              </p>
              <h3 className="mt-3 text-xl font-semibold text-slate-900 sm:text-2xl">
                Trust built into every profile
              </h3>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {trustFeatures.map((feature) => (
                  <div key={feature.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4">
                    <feature.icon className="h-5 w-5 text-emerald-700" />
                    <p className="mt-3 text-sm font-semibold text-slate-900">{feature.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{feature.copy}</p>
                  </div>
                ))}
              </div>
              <Link
                to={primaryCtaTo}
                className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:w-auto"
              >
                {primaryCtaLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </article>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white px-4 py-8 sm:py-10">
          <div className="mx-auto max-w-7xl">
            <details className="group rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <summary className="campaign-summary flex cursor-pointer list-none items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Founding seller reward pool</p>
                  <p className="text-lg font-semibold text-slate-900">Open raffle details</p>
                  {!isPhone && (
                    <p className="text-sm text-slate-600">
                    Bonus reward for qualified sellers.
                    </p>
                  )}
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

        <section className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:pb-16 sm:pt-8">
          <div className="rounded-3xl bg-gradient-to-r from-emerald-700 to-teal-700 p-5 text-white shadow-lg sm:p-8 md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">Final call</p>
            <h2 className="home-title mt-3 text-2xl sm:text-3xl md:text-4xl">Ready to start?</h2>
            <p className="mt-3 max-w-2xl text-sm text-emerald-100 md:text-base">
              {finalCallCopy}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to={primaryCtaTo}
                className="inline-flex min-h-[46px] w-full items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 sm:w-auto"
              >
                {primaryCtaLabel}
              </Link>
              <Link
                to={browseTo}
                className="inline-flex min-h-[46px] w-full items-center justify-center rounded-xl border border-white/80 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-3 left-1/2 z-30 w-[calc(100%-1rem)] max-w-3xl -translate-x-1/2 rounded-2xl border border-emerald-300 bg-white/95 px-3 py-3 shadow-xl backdrop-blur sm:px-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-slate-900 sm:text-sm">
            {stickyWindowText}
          </p>
          <Link
            to={primaryCtaTo}
            className="inline-flex min-h-[42px] w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:w-auto"
          >
            {primaryCtaLabel}
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Home;
