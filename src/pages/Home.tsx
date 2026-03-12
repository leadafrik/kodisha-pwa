import React, { useEffect, useMemo, useState } from "react";
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
import {
  BULK_HOME_LINK_VISIBLE,
  PAYMENTS_ENABLED,
} from "../config/featureFlags";
import { trackGoogleEvent } from "../utils/cookieConsent";
import { trackTrafficClick } from "../utils/trafficAnalytics";

const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;
const FREE_WINDOW_DAYS = 10;
const HERO_VARIANT_KEY = "agrisoko_home_hero_variant_v2";
const HERO_VARIANT_SEEN_KEY = "agrisoko_home_hero_variant_seen_v2";

type HeroVariant = "sell_first" | "find_first";

const conversionPillars = [
  {
    title: "No middlemen",
    copy: "Talk directly to buyers.",
  },
  {
    title: "Instant trust",
    copy: "Verification helps buyers choose faster.",
  },
  {
    title: "Zero launch risk",
    copy: PAYMENTS_ENABLED
      ? `Listing remains KSh 0 for your first ${FREE_WINDOW_DAYS} days after signup.`
      : "Listings are KSh 0 during launch.",
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
  "Maize suppliers - Uasin Gishu",
  "Poultry suppliers - Kisumu",
  "Onion suppliers - Machakos",
  "Farm inputs - Nakuru",
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

const founderLetterParagraphs = [
  "When I first started Agrisoko, almost everyone told me the same thing:",
  "\"Kenyans do not trust digital platforms. There are too many scammers.\"",
  "Others told me marketplaces never work. They said buyers would come and find no sellers. Sellers would come and find no buyers. And eventually everyone would leave.",
  "Some advised me to start small, just one county instead of all 47. Others said I should sell only one product instead of many.",
  "And many warned me of something else: \"If you connect farmers and buyers, they will eventually leave the platform and trade on the side.\"",
  "In many ways, they were right. These are real challenges.",
  "But there was something they failed to see.",
  "They underestimated the power of Kenyans when we believe in something together.",
  "Because at the heart of this country are people of goodwill, people who support each other, uplift each other, and stand together when there is a vision worth building.",
  "So I chose to trust something simple but powerful: people.",
  "I chose to trust farmers who wake up before sunrise and work tirelessly to feed our nation. I chose to trust buyers who want better access to quality food and fair prices. And I chose to trust Kenyans like you, the person reading this.",
  "I believe a day will come when Kenyan farmers will finally enjoy the full fruits of their labour without losing a big portion of their hard-earned income to brokers.",
  "I believe a day will come when agriculture will connect us in new ways, where from the comfort of our homes we can access high-quality agricultural products from farmers across the country.",
  "And I believe that one day, what is now a fragmented agricultural market will become a unified marketplace, where farmers list their produce with pride and buyers shop with confidence.",
  "That future is what Agrisoko is trying to build.",
  "And that is why I will not take this marketplace down.",
  "Because building something meaningful is never easy. But it becomes possible when people believe in it together.",
  "If this vision speaks to you, then join us.",
  "Sign up today. Tell a friend to tell a friend.",
  "And together, let us build the future of agriculture in Kenya.",
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

const formatPriceLabel = (value: unknown) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Contact for price";
  return `KSh ${amount.toLocaleString()}`;
};

const Home: React.FC = () => {
  const { user } = useAuth();
  const { isPhone, isTouch, prefersReducedMotion } = useAdaptiveLayout();
  const { productListings, serviceListings } = useProperties();
  const [heroVariant, setHeroVariant] = useState<HeroVariant>("sell_first");

  const { content: heroHeadline } = usePageContent("home.hero.headline");
  const { content: heroDescription } = usePageContent("home.hero.description");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HERO_VARIANT_KEY);
      if (saved === "sell_first" || saved === "find_first") {
        setHeroVariant(saved);
        return;
      }
      const assigned: HeroVariant = Math.random() < 0.5 ? "sell_first" : "find_first";
      localStorage.setItem(HERO_VARIANT_KEY, assigned);
      setHeroVariant(assigned);
    } catch {
      setHeroVariant("sell_first");
    }
  }, []);

  useEffect(() => {
    if (user) return;
    try {
      const seenKey = `${HERO_VARIANT_SEEN_KEY}_${heroVariant}`;
      if (sessionStorage.getItem(seenKey)) return;
      sessionStorage.setItem(seenKey, "1");
    } catch {
      // Continue tracking even if session storage is unavailable.
    }
    trackTrafficClick({
      action: `funnel_home_variant_seen_${heroVariant}`,
      target: "/",
    });
  }, [heroVariant, user]);

  const liveListingCount = useMemo(() => {
    const liveProducts = (productListings || []).filter((item: any) =>
      isLiveStatus(item?.publishStatus || item?.status)
    ).length;
    const liveServices = (serviceListings || []).filter((item: any) => {
      if (!isLiveStatus(item?.publishStatus || item?.status)) return false;
      if (item?.isDeleted === true || item?.deletedAt) return false;
      return true;
    }).length;
    return liveProducts + liveServices;
  }, [productListings, serviceListings]);

  const liveCountyCount = useMemo(() => {
    const counties = new Set<string>();
    (productListings || []).forEach((item: any) => {
      if (!isLiveStatus(item?.publishStatus || item?.status)) return;
      const county = String(item?.county || "").trim();
      if (county) counties.add(county.toLowerCase());
    });
    (serviceListings || []).forEach((item: any) => {
      if (!isLiveStatus(item?.publishStatus || item?.status)) return;
      if (item?.isDeleted === true || item?.deletedAt) return;
      const county = String(item?.county || "").trim();
      if (county) counties.add(county.toLowerCase());
    });
    return counties.size;
  }, [productListings, serviceListings]);

  const latestLiveListings = useMemo(() => {
    const normalizedProducts = (productListings || [])
      .filter((item: any) => isLiveStatus(item?.publishStatus || item?.status))
      .map((item: any) => ({
        id: String(item?._id || item?.id || ""),
        title: String(item?.title || item?.name || "Listing"),
        category: String(item?.category || "produce"),
        county: String(item?.county || ""),
        priceLabel: formatPriceLabel(item?.price),
        createdAt: toValidDate(item?.updatedAt || item?.createdAt),
      }))
      .filter((item) => !!item.id);

    const normalizedServices = (serviceListings || [])
      .filter((item: any) => {
        if (!isLiveStatus(item?.publishStatus || item?.status)) return false;
        if (item?.isDeleted === true || item?.deletedAt) return false;
        return true;
      })
      .map((item: any) => ({
        id: String(item?._id || item?.id || ""),
        title: String(item?.title || item?.name || "Service listing"),
        category: "service",
        county: String(item?.county || ""),
        priceLabel: formatPriceLabel(
          item?.price ?? item?.serviceFee ?? item?.rate ?? item?.hourlyRate
        ),
        createdAt: toValidDate(item?.updatedAt || item?.createdAt),
      }))
      .filter((item) => !!item.id);

    return [...normalizedProducts, ...normalizedServices]
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, 3);
  }, [productListings, serviceListings]);

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

  const heroHeadlineFallback =
    heroVariant === "find_first"
      ? "Find reliable produce and suppliers across Kenya - without middlemen."
      : "Sell your farm produce directly to verified buyers across Kenya.";
  const heroDescriptionFallback =
    heroVariant === "find_first"
      ? "Discover active listings, compare trusted sellers, and close deals faster."
      : "Buy and sell faster with trusted profiles, direct chat, and transparent listings.";
  const displayHeadline = heroHeadline || heroHeadlineFallback;
  const displayDescription = user
    ? isPhone
      ? "Post fast, find demand, and close deals."
      : "Post listings, find demand, and close deals across Kenya."
    : heroDescription || (isPhone ? "Sell or find produce in minutes." : heroDescriptionFallback);
  const countyCoverageLabel =
    liveCountyCount > 0 ? `${liveCountyCount.toLocaleString()} counties active` : "47 counties open";
  const primaryCtaTo = user
    ? "/create-listing?compact=1"
    : `/login?mode=signup&next=${encodeURIComponent("/create-listing?compact=1")}`;
  const primaryCtaLabel = user ? "List free today" : "Sell Produce";
  const browseTo = "/browse";
  const browseCtaLabel = "Find Produce";
  const sellClickAction = user
    ? "funnel_home_sell_click_logged_in"
    : `funnel_home_sell_click_${heroVariant}`;
  const findClickAction = user
    ? "funnel_home_find_click_logged_in"
    : `funnel_home_find_click_${heroVariant}`;
  const demandCtaTo = "/request";
  const demandCtaLabel = "View Buy Requests";
  const aboutCtaTo = "/about#founder-story";
  const aboutCtaLabel = user ? "How trust works" : "Why Agrisoko";
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
      title: user ? "Start selling in minutes" : "Start now",
      copy: user
        ? "Open your dashboard and publish your first listing."
        : "Create your account now.",
    },
  ];
  const visibleHeroFocusItems = isPhone ? heroFocusItems.slice(0, 1) : heroFocusItems;
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
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;700&family=Patrick+Hand&family=Sora:wght@400;500;600;700&display=swap');
        .home-shell {
          font-family: "Sora", "Segoe UI", "Tahoma", sans-serif;
        }
        .home-title {
          font-family: "Fraunces", "Georgia", serif;
        }
        .home-handwritten {
          font-family: "Patrick Hand", "Segoe Print", "Bradley Hand", cursive;
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
                  {heroVariant === "find_first" && !user ? (
                    <>
                      <Link
                        to={browseTo}
                        onClick={() =>
                          trackTrafficClick({
                            action: findClickAction,
                            target: browseTo,
                          })
                        }
                        className="ui-btn-primary w-full px-6 sm:w-auto"
                      >
                        {browseCtaLabel}
                      </Link>
                      <Link
                        to={primaryCtaTo}
                        onClick={() =>
                          trackTrafficClick({
                            action: sellClickAction,
                            target: "/create-listing",
                          })
                        }
                        className="ui-btn-ghost w-full px-6 sm:w-auto"
                      >
                        {primaryCtaLabel}
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to={primaryCtaTo}
                        onClick={() =>
                          trackTrafficClick({
                            action: sellClickAction,
                            target: "/create-listing",
                          })
                        }
                        className="ui-btn-primary w-full px-6 sm:w-auto"
                      >
                        {primaryCtaLabel}
                      </Link>
                      <Link
                        to={browseTo}
                        onClick={() =>
                          trackTrafficClick({
                            action: findClickAction,
                            target: browseTo,
                          })
                        }
                        className={`ui-btn-ghost w-full px-6 sm:w-auto ${
                          user
                            ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            : ""
                        }`}
                      >
                        {browseCtaLabel}
                      </Link>
                    </>
                  )}
                </div>
                <div className="mt-4 space-y-3">
                  {!isPhone && (
                  <div>
                    <Link
                      to="/about#ceo-video"
                      onClick={() =>
                        trackGoogleEvent("view_ceo_message_click", {
                          source: "home_hero",
                        })
                      }
                      className="text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900"
                    >
                      Why we built Agrisoko
                    </Link>
                  </div>
                  )}
                  {BULK_HOME_LINK_VISIBLE && (
                    <div>
                      <Link
                        to="/bulk"
                        className="text-sm font-semibold text-emerald-700 underline decoration-emerald-200 underline-offset-4 transition hover:text-emerald-800"
                      >
                        Explore bulk buying customers
                      </Link>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-700 sm:text-xs">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">
                      {liveListingCount.toLocaleString()} listings live
                    </span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">
                      {countyCoverageLabel}
                    </span>
                  </div>
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
                  {visibleHeroFocusItems.map((item) => (
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

        <section className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  Latest market activity
                </p>
                <h2 className="home-title mt-2 text-2xl text-slate-900 sm:text-3xl">
                  Real listings are already moving.
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  See what sellers are posting now, jump into details, and connect faster.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    {liveListingCount.toLocaleString()} live listings
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    {countyCoverageLabel}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={browseTo}
                    className="ui-btn-secondary min-h-[42px] px-4 py-2"
                  >
                    {browseCtaLabel}
                  </Link>
                  <Link
                    to={aboutCtaTo}
                    className="ui-btn-ghost min-h-[42px] px-4 py-2"
                  >
                    {aboutCtaLabel}
                  </Link>
                </div>
              </div>
              {latestLiveListings.length > 0 ? (
                <ul className="space-y-2.5 text-sm text-slate-700">
                  {latestLiveListings.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 font-semibold text-slate-900">{item.title}</p>
                        <span className="whitespace-nowrap text-xs font-semibold text-emerald-700">
                          {item.priceLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">
                        {item.category} {item.county ? `- ${item.county}` : ""}
                      </p>
                      <Link
                        to={`/listings/${item.id}`}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 transition hover:text-emerald-800"
                      >
                        View details
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  Listings are loading. Open the marketplace to view all live inventory.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Founder note
              </p>
              <h2 className="home-title mt-2 text-2xl text-slate-900 sm:text-3xl">
                Why we started Agrisoko
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                A direct note from Stephen on trust, middlemen, and the future of agriculture in Kenya.
              </p>
            </div>

            <div className="relative mt-5 max-w-4xl rotate-[-0.9deg] rounded-[2rem] border border-emerald-200 bg-[#dff5da] px-5 py-6 text-slate-900 shadow-[0_14px_28px_rgba(22,101,52,0.12)] sm:px-7 sm:py-7">
              <div className="absolute left-1/2 top-0 h-10 w-24 -translate-x-1/2 -translate-y-1/2 rotate-[2deg] rounded-b-2xl bg-[#edf7ea] shadow-sm" />
              <p className="home-handwritten text-[1.9rem] font-semibold leading-none text-emerald-950 sm:text-[2.2rem]">
                Why we Started Agrisoko
              </p>
              <div className="mt-4 space-y-3 home-handwritten text-[1.34rem] leading-[1.22] text-slate-900 sm:text-[1.5rem]">
                {founderLetterParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <p className="home-handwritten mt-5 text-[1.55rem] font-semibold text-emerald-950 sm:text-[1.75rem]">
                Stephen
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  Why join
                </p>
                <h2 className="home-title mt-2 text-2xl text-slate-900 sm:text-3xl">
                  Clear value, simple start.
                </h2>
                <div className="mt-5 space-y-4">
                  {conversionPillars.map((pillar) => (
                    <div
                      key={pillar.title}
                      className="border-b border-slate-200 pb-4 last:border-b-0 last:pb-0"
                    >
                      <p className="text-sm font-semibold text-slate-900">{pillar.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{pillar.copy}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:border-l lg:border-slate-200 lg:pl-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  How it works
                </p>
                <div className="mt-4 space-y-3">
                  {tradeSteps.map((step, index) => (
                    <div
                      key={step.title}
                      className="flex items-start gap-3 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0"
                    >
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-semibold text-white">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                        <p className="mt-0.5 text-sm text-slate-600">{step.copy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-10 sm:pb-14">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Live market
            </p>
            <h2 className="home-title mt-2 text-2xl text-slate-900 sm:text-3xl md:text-4xl">
              Buyers are searching.
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
                  <p className="mt-1 text-sm font-semibold text-slate-900 sm:text-lg">
                    {countyCoverageLabel}
                  </p>
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
                onClick={() =>
                  trackTrafficClick({
                    action: "funnel_home_view_buy_requests",
                    target: demandCtaTo,
                  })
                }
                className="ui-btn-ghost mt-6 w-full sm:w-auto"
              >
                {demandCtaLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <p className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">
                Trust
              </p>
              <h3 className="mt-3 text-xl font-semibold text-slate-900 sm:text-2xl">
                Trust built in
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
            </article>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:pb-16 sm:pt-8">
          <div className="rounded-3xl bg-gradient-to-r from-emerald-700 to-teal-700 p-5 text-white shadow-lg sm:p-8 md:p-10">
            <h2 className="home-title text-2xl sm:text-3xl md:text-4xl">Ready to start?</h2>
            <p className="mt-3 max-w-2xl text-sm text-emerald-100 md:text-base">
              {finalCallCopy}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to={primaryCtaTo}
                onClick={() =>
                  trackTrafficClick({
                    action: "funnel_home_final_sell_click",
                    target: "/create-listing",
                  })
                }
                className="inline-flex min-h-[46px] w-full items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 sm:w-auto"
              >
                {primaryCtaLabel}
              </Link>
              <Link
                to={browseTo}
                onClick={() =>
                  trackTrafficClick({
                    action: "funnel_home_final_find_click",
                    target: browseTo,
                  })
                }
                className="inline-flex min-h-[46px] w-full items-center justify-center rounded-xl border border-white/80 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
              >
                {browseCtaLabel}
              </Link>
            </div>
          </div>
        </section>
      </div>

      {isPhone && (
        <div className="fixed bottom-3 left-1/2 z-30 w-[calc(100%-1rem)] max-w-3xl -translate-x-1/2 rounded-2xl border border-emerald-300 bg-white/95 px-3 py-3 shadow-xl backdrop-blur sm:px-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-slate-900 sm:text-sm">
              {stickyWindowText}
            </p>
            <Link
              to={primaryCtaTo}
              onClick={() =>
                trackTrafficClick({
                  action: "funnel_home_sticky_sell_click",
                  target: "/create-listing",
                })
              }
              className="ui-btn-primary w-full sm:w-auto"
            >
              {primaryCtaLabel}
            </Link>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
