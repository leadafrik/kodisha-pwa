import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Beef,
  Leaf,
  MapPin,
  MessageCircle,
  Package,
  Search,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useProperties } from "../contexts/PropertyContext";
import { useAdaptiveLayout } from "../hooks/useAdaptiveLayout";
import { usePageContent } from "../hooks/usePageContent";
import { PAYMENTS_ENABLED } from "../config/featureFlags";
import { trackTrafficClick } from "../utils/trafficAnalytics";
import { handleImageError } from "../utils/imageFallback";
import { getOptimizedImageUrl } from "../utils/imageOptimization";

const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;
const FREE_WINDOW_DAYS = 10;
const HERO_VARIANT_KEY = "agrisoko_home_hero_variant_v2";
const HERO_VARIANT_SEEN_KEY = "agrisoko_home_hero_variant_seen_v2";

type HeroVariant = "sell_first" | "find_first";
type MarketCategory = "produce" | "livestock" | "inputs" | "service";

const founderLetterParagraphs = [
  "When I started Agrisoko, many people told me it would not work.",
  "They said Kenyans do not trust digital platforms because of scammers. They said marketplaces fail because buyers find no sellers and sellers find no buyers. They said farmers and buyers would eventually trade outside the platform.",
  "Those are real challenges. But they underestimated what Kenyans can build when we believe in something together.",
  "I chose to trust farmers who wake up before sunrise to feed our nation. I chose to trust buyers who want fair prices and reliable supply. And I chose to trust people like you.",
  "Agrisoko is building a future where farmers keep more of what they earn, buyers trade with confidence, and agriculture in Kenya becomes more direct, more trusted, and more connected.",
  "If you believe in that vision, join us. Sign up today. Tell a friend to tell a friend. And together, let us build the future of agriculture in Kenya.",
];

const buyerDemandSignals = [
  "Maize suppliers in Uasin Gishu",
  "Poultry suppliers in Kisumu",
  "Onion suppliers in Machakos",
  "Farm inputs in Nakuru",
];

const startSteps = [
  {
    title: "Create account",
    copy: "Open your account in minutes.",
  },
  {
    title: "Verify when ready",
    copy: "Trust signals help serious buyers move faster.",
  },
  {
    title: "List or browse",
    copy: "Post supply, find demand, and close direct deals.",
  },
];

const trustHighlights = [
  {
    title: "Verified profiles",
    copy: "ID and selfie verification reduces fraud risk.",
    icon: ShieldCheck,
  },
  {
    title: "Direct buyer chat",
    copy: "Negotiate directly without broker layers.",
    icon: MessageCircle,
  },
  {
    title: "Reputation built in",
    copy: "Trust score and listing activity help buyers decide faster.",
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
    "sold",
    "expired",
  ].includes(normalized);
};

const toValidDate = (value: unknown): Date | null => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeCategory = (item: any, kind: "product" | "service"): MarketCategory => {
  if (kind === "service") {
    return item?.type === "agrovet" ? "inputs" : "service";
  }

  const category = String(item?.category || item?.propertyType || "").toLowerCase();
  if (category === "livestock" || category === "inputs") return category;
  return "produce";
};

const getBrowsePathForCategory = (category: MarketCategory) =>
  category === "service" ? "/browse/services" : `/browse/${category}`;

const categoryMeta: Record<
  MarketCategory,
  {
    label: string;
    copy: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  produce: {
    label: "Produce",
    copy: "Maize, beans, onions, vegetables, fruit, and more.",
    icon: Leaf,
  },
  livestock: {
    label: "Livestock",
    copy: "Poultry, goats, pigs, cattle, and related supply.",
    icon: Beef,
  },
  inputs: {
    label: "Inputs",
    copy: "Seeds, fertilizer, feeds, equipment, and agri supplies.",
    icon: Package,
  },
  service: {
    label: "Services",
    copy: "Transport, consulting, equipment hire, and labour.",
    icon: Wrench,
  },
};

const Home: React.FC = () => {
  const { user } = useAuth();
  const { isPhone } = useAdaptiveLayout();
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
      // ignore storage issues
    }
    trackTrafficClick({
      action: `funnel_home_variant_seen_${heroVariant}`,
      target: "/",
    });
  }, [heroVariant, user]);

  const liveProducts = useMemo(
    () =>
      (productListings || []).filter((item: any) =>
        isLiveStatus(item?.publishStatus || item?.status)
      ),
    [productListings]
  );

  const liveServices = useMemo(
    () =>
      (serviceListings || []).filter((item: any) => {
        if (!isLiveStatus(item?.publishStatus || item?.status)) return false;
        if (item?.isDeleted === true || item?.deletedAt) return false;
        return true;
      }),
    [serviceListings]
  );

  const liveListingCount = liveProducts.length + liveServices.length;

  const liveCountyCount = useMemo(() => {
    const counties = new Set<string>();
    liveProducts.forEach((item: any) => {
      const county = String(item?.county || item?.location?.county || "").trim();
      if (county) counties.add(county.toLowerCase());
    });
    liveServices.forEach((item: any) => {
      const county = String(item?.county || item?.location?.county || "").trim();
      if (county) counties.add(county.toLowerCase());
    });
    return counties.size;
  }, [liveProducts, liveServices]);

  const categoryCounts = useMemo(() => {
    const counts: Record<MarketCategory, number> = {
      produce: 0,
      livestock: 0,
      inputs: 0,
      service: 0,
    };

    liveProducts.forEach((item: any) => {
      counts[normalizeCategory(item, "product")] += 1;
    });

    liveServices.forEach((item: any) => {
      counts[normalizeCategory(item, "service")] += 1;
    });

    return counts;
  }, [liveProducts, liveServices]);

  const latestListings = useMemo(() => {
    const products = liveProducts.map((item: any) => ({
      id: item?._id || item?.id,
      title: item?.title || item?.name || "Fresh listing",
      description: item?.description || "Open the listing to view more details.",
      image: Array.isArray(item?.images) ? item.images[0] : undefined,
      county: item?.county || item?.location?.county || "Kenya",
      category: normalizeCategory(item, "product"),
      price:
        typeof item?.price === "number" && item.price > 0
          ? `KSh ${item.price.toLocaleString()}`
          : "Price on request",
      createdAt: toValidDate(item?.updatedAt || item?.createdAt)?.getTime() || 0,
    }));

    const services = liveServices.map((item: any) => {
      const firstImage =
        (Array.isArray(item?.images) ? item.images[0] : undefined) ||
        (Array.isArray(item?.photos) ? item.photos[0] : undefined);

      return {
        id: item?._id || item?.id,
        title: item?.title || item?.name || "Service listing",
        description: item?.description || "Open the listing to view more details.",
        image: firstImage,
        county: item?.county || item?.location?.county || "Kenya",
        category: normalizeCategory(item, "service"),
        price:
          typeof item?.price === "number" && item.price > 0
            ? `KSh ${item.price.toLocaleString()}`
            : "Quote on request",
        createdAt: toValidDate(item?.updatedAt || item?.createdAt)?.getTime() || 0,
      };
    });

    return [...products, ...services]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 4);
  }, [liveProducts, liveServices]);

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
    ? "Listings are free right now"
    : user
    ? daysLeft > 0
      ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left at KSh 0`
      : "Free launch window ended"
    : `KSh 0 for your first ${FREE_WINDOW_DAYS} days`;

  const heroHeadlineFallback =
    heroVariant === "find_first"
      ? "Find verified produce and suppliers across Kenya without middlemen."
      : "Buy and sell farm produce across Kenya directly from farmers.";
  const heroDescriptionFallback =
    heroVariant === "find_first"
      ? "Browse trusted listings, compare sellers, and close direct deals faster."
      : "Agrisoko helps farmers, traders, and buyers list supply, find demand, and trade across Kenya.";
  const displayHeadline = heroHeadline || heroHeadlineFallback;
  const displayDescription = user
    ? "Post supply, find demand, and close direct deals across Kenya."
    : heroDescription || heroDescriptionFallback;

  const countyCoverageLabel =
    liveCountyCount > 0 ? `${liveCountyCount.toLocaleString()} counties active` : "47 counties open";
  const primaryCtaTo = user
    ? "/create-listing?compact=1"
    : `/login?mode=signup&next=${encodeURIComponent("/create-listing?compact=1")}`;
  const primaryCtaLabel = user ? "List free today" : "List produce free";
  const browseTo = "/browse";
  const browseCtaLabel = "Browse listings";
  const sellClickAction = user
    ? "funnel_home_sell_click_logged_in"
    : `funnel_home_sell_click_${heroVariant}`;
  const findClickAction = user
    ? "funnel_home_find_click_logged_in"
    : `funnel_home_find_click_${heroVariant}`;
  const stickyWindowText = isGlobalFreeListing
    ? isPhone
      ? "Free to list"
      : "Listings are free right now"
    : user
    ? daysLeft > 0
      ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left at KSh 0`
      : "Free launch window ended"
    : `Free for your first ${FREE_WINDOW_DAYS} days`;

  return (
    <main className="ui-page-shell pb-28 sm:pb-24">
      <div className="font-body">
        <section className="relative overflow-hidden border-b border-stone-200 bg-gradient-to-b from-[#FAF7F2] via-[#F9F4EE] to-white">
          <div className="pointer-events-none absolute -top-12 left-[12%] h-72 w-72 rounded-full bg-[#F3C9BE]/55 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-10 h-80 w-80 rounded-full bg-[#FFF0C8]/55 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-14 md:py-16">
            <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
              <div className="anim-in max-w-3xl">
                <p className="ui-section-kicker">Built in Kenya for agricultural trade</p>
                <h1 className="mt-4 text-4xl leading-[0.98] text-stone-900 sm:text-5xl md:text-6xl">
                  {displayHeadline}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-stone-700 md:text-lg">
                  {displayDescription}
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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
                        className="ui-btn-secondary w-full px-6 sm:w-auto"
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
                        className="ui-btn-ghost w-full px-6 sm:w-auto"
                      >
                        {browseCtaLabel}
                      </Link>
                    </>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="ui-chip-soft">{launchWindowLabel}</span>
                  <span className="ui-chip-soft">{liveListingCount.toLocaleString()} listings live</span>
                  <span className="ui-chip-soft">{countyCoverageLabel}</span>
                  <span className="ui-chip-soft">Verified profiles</span>
                </div>

                <div className="mt-7 flex flex-wrap gap-2">
                  {(Object.keys(categoryMeta) as MarketCategory[]).map((category) => {
                    const meta = categoryMeta[category];
                    return (
                      <Link
                        key={category}
                        to={getBrowsePathForCategory(category)}
                        onClick={() =>
                          trackTrafficClick({
                            action: `funnel_home_category_${category}`,
                            target: getBrowsePathForCategory(category),
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/90 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-[#E8A08E] hover:bg-[#FDF5F3]"
                      >
                        <meta.icon className="h-4 w-4 text-[#A0452E]" />
                        {meta.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="anim-in-2 ui-card p-5 md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="ui-section-kicker">Start in minutes</p>
                    <h2 className="mt-2 text-2xl text-stone-900">Direct trade, fewer steps</h2>
                  </div>
                  <div className="rounded-full border border-[#F3C9BE] bg-[#FDF5F3] px-3 py-1.5 text-sm font-semibold text-[#A0452E]">
                    Free now
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {startSteps.map((step, index) => (
                    <div
                      key={step.title}
                      className="flex items-start gap-3 border-b border-stone-200 pb-4 last:border-b-0 last:pb-0"
                    >
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#A0452E] text-sm font-semibold text-white">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-stone-900">{step.title}</p>
                        <p className="mt-1 text-sm text-stone-600">{step.copy}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="ui-card-soft p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Live market</p>
                    <p className="mt-2 text-2xl font-semibold text-stone-900">{liveListingCount.toLocaleString()}</p>
                    <p className="mt-1 text-sm text-stone-600">Listings visible to buyers now.</p>
                  </div>
                  <div className="ui-card-soft p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Coverage</p>
                    <p className="mt-2 text-2xl font-semibold text-stone-900">{liveCountyCount || 47}</p>
                    <p className="mt-1 text-sm text-stone-600">Counties active on the marketplace.</p>
                  </div>
                </div>

                <Link
                  to="/request"
                  onClick={() =>
                    trackTrafficClick({
                      action: "funnel_home_view_buy_requests",
                      target: "/request",
                    })
                  }
                  className="ui-btn-ghost mt-6 w-full justify-between"
                >
                  See buyer demand
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="ui-section-kicker">Explore the marketplace</p>
              <h2 className="mt-2 text-3xl text-stone-900">Shop by category</h2>
            </div>
            <Link to="/browse" className="hidden text-sm font-semibold text-[#A0452E] md:inline-flex">
              View all listings
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {(Object.keys(categoryMeta) as MarketCategory[]).map((category) => {
              const meta = categoryMeta[category];
              return (
                <Link
                  key={category}
                  to={getBrowsePathForCategory(category)}
                  onClick={() =>
                    trackTrafficClick({
                      action: `funnel_home_explore_${category}`,
                      target: getBrowsePathForCategory(category),
                    })
                  }
                  className="card-lift ui-card p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FDF5F3] text-[#A0452E]">
                      <meta.icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                      {categoryCounts[category]} live
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-stone-900">{meta.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{meta.copy}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-4 sm:py-6">
          <div className="grid gap-8 xl:grid-cols-[1.4fr_0.6fr]">
            <div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="ui-section-kicker">Live listings</p>
                  <h2 className="mt-2 text-3xl text-stone-900">Fresh supply coming onto the market</h2>
                </div>
                <Link to="/browse" className="hidden text-sm font-semibold text-[#A0452E] md:inline-flex">
                  Browse all
                </Link>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {latestListings.map((listing) => {
                  const meta = categoryMeta[listing.category];
                  return (
                    <Link
                      key={listing.id}
                      to={listing.id ? `/listings/${listing.id}` : "/browse"}
                      onClick={() =>
                        trackTrafficClick({
                          action: "funnel_home_listing_preview_open",
                          target: listing.id ? `/listings/${listing.id}` : "/browse",
                        })
                      }
                      className="card-lift overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-stone-100">
                        {listing.image ? (
                          <img
                            src={getOptimizedImageUrl(listing.image, {
                              width: 720,
                              height: 540,
                              quality: "auto:good",
                            })}
                            alt={listing.title}
                            onError={handleImageError}
                            className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FDF5F3] via-[#FAF7F2] to-stone-100">
                            <meta.icon className="h-10 w-10 text-[#A0452E]" />
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="rounded-full bg-[#FDF5F3] px-3 py-1 text-xs font-semibold text-[#A0452E]">
                            {meta.label}
                          </span>
                          <span className="text-sm font-semibold text-stone-900">{listing.price}</span>
                        </div>
                        <h3 className="mt-3 line-clamp-2 text-xl font-semibold text-stone-900">
                          {listing.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-600">
                          {listing.description}
                        </p>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-1.5 text-sm text-stone-500">
                            <MapPin className="h-4 w-4" />
                            {listing.county}
                          </span>
                          <span className="text-sm font-semibold text-[#A0452E]">View details</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="ui-card p-5">
                <p className="ui-section-kicker">Buyer demand now</p>
                <h3 className="mt-2 text-2xl text-stone-900">What buyers are searching for today</h3>
                <ul className="mt-5 space-y-3">
                  {buyerDemandSignals.map((signal) => (
                    <li
                      key={signal}
                      className="flex items-start gap-3 border-b border-stone-200 pb-3 text-sm text-stone-700 last:border-b-0 last:pb-0"
                    >
                      <Search className="mt-0.5 h-4 w-4 shrink-0 text-[#A0452E]" />
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/request"
                  onClick={() =>
                    trackTrafficClick({
                      action: "funnel_home_open_buy_requests",
                      target: "/request",
                    })
                  }
                  className="ui-btn-primary mt-6 w-full justify-between"
                >
                  View buy requests
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="ui-card p-5">
                <p className="ui-section-kicker">Trade with confidence</p>
                <div className="mt-4 space-y-4">
                  {trustHighlights.map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FDF5F3] text-[#A0452E]">
                        <item.icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-stone-900">{item.title}</p>
                        <p className="mt-1 text-sm text-stone-600">{item.copy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
          <div className="max-w-4xl">
            <p className="ui-section-kicker">A note from Stephen</p>
            <h2 className="mt-2 text-3xl text-stone-900">Why we built Agrisoko</h2>
          </div>

          <div className="relative mt-6 max-w-4xl rotate-[-0.9deg] rounded-[2rem] border border-[#bfd0b8] bg-[#e6f0e0] px-5 py-6 text-slate-900 shadow-[0_8px_16px_rgba(92,122,99,0.08)] sm:px-7 sm:py-7">
            <div className="absolute left-1/2 top-0 h-10 w-24 -translate-x-1/2 -translate-y-1/2 rotate-[2deg] rounded-b-2xl bg-[#f1f6ee]" />
            <p className="home-handwritten text-[1.85rem] font-semibold leading-none text-[#38503b] sm:text-[2.1rem]">
              Why we started Agrisoko
            </p>
            <div className="home-handwritten mt-4 space-y-3 text-[1.28rem] leading-[1.22] text-slate-900 sm:text-[1.46rem]">
              {founderLetterParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <p className="home-handwritten mt-5 text-[1.5rem] font-semibold text-[#38503b] sm:text-[1.72rem]">
              Stephen
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-14 pt-4 sm:pb-16 sm:pt-6">
          <div className="overflow-hidden rounded-[30px] bg-gradient-to-br from-[#A0452E] via-[#8B3525] to-[#72281A] p-6 text-white shadow-[0_20px_48px_rgba(114,40,26,0.24)] sm:p-8 md:p-10">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                Ready to start?
              </p>
              <h2 className="mt-3 text-3xl text-white sm:text-4xl">
                Join the agricultural marketplace Kenya deserves
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/82 sm:text-base">
                Farmers should earn more. Buyers should find reliable produce. Agriculture should work with more trust, more visibility, and less broker leakage.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to={primaryCtaTo}
                onClick={() =>
                  trackTrafficClick({
                    action: "funnel_home_final_sell_click",
                    target: "/create-listing",
                  })
                }
                className="inline-flex min-h-[46px] w-full items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#A0452E] transition hover:bg-[#FFF7F4] sm:w-auto"
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
                className="inline-flex min-h-[46px] w-full items-center justify-center rounded-xl border border-white/75 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
              >
                {browseCtaLabel}
              </Link>
            </div>
          </div>
        </section>
      </div>

      {isPhone && (
        <div className="fixed bottom-3 left-1/2 z-30 w-[calc(100%-1rem)] max-w-3xl -translate-x-1/2 rounded-2xl border border-stone-200 bg-white/95 px-3 py-3 shadow-lg backdrop-blur-md sm:px-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-stone-900 sm:text-sm">{stickyWindowText}</p>
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
