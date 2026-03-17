import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Beef,
  Clock3,
  Leaf,
  MapPin,
  MessageCircle,
  NotebookText,
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
import { API_BASE_URL, API_ENDPOINTS, apiRequest } from "../config/api";
import { trackTrafficClick } from "../utils/trafficAnalytics";
import { handleImageError } from "../utils/imageFallback";
import { getOptimizedImageUrl } from "../utils/imageOptimization";
import MarketplaceSupportStrip from "../components/MarketplaceSupportStrip";
import type { BlogPost } from "../types/blog";

const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;
const FREE_WINDOW_DAYS = 10;
const HERO_VARIANT_KEY = "agrisoko_home_hero_variant_v2";
const HERO_VARIANT_SEEN_KEY = "agrisoko_home_hero_variant_seen_v2";

type HeroVariant = "sell_first" | "find_first";
type MarketCategory = "produce" | "livestock" | "inputs" | "service";

const founderLetterParagraphs = [
  "When I started Agrisoko, many people told me it would not work.",
  "I grew up watching farmers work incredibly hard — waking before sunrise, tending their land through drought and disease — and then watching brokers take the largest share of the profit at the farm gate. A farmer who grew maize for four months might sell it for KES 28 per kilo. By the time it reached Nairobi, it sold for KES 55. The farmer saw none of that difference. The broker made it all.",
  "I asked myself: what if the farmer could see the buyer directly? What if the buyer could trust the quality of what they were getting? What if we removed the unnecessary steps between the person who grew the food and the person who needed it?",
  "That question became Agrisoko.",
  "We are not just building an app. We are building trust infrastructure for Kenyan agriculture — a place where a smallholder in Meru can reach a buyer in Mombasa, where a fresh produce trader in Limuru can post what she has and be found by restaurants in Nairobi, where a livestock farmer in Kajiado does not have to wait for someone to pass through his road to know what his animals are worth.",
  "Agrisoko is building a future where farmers keep more of what they earn, buyers trade with confidence, and agriculture in Kenya becomes more direct, more trusted, and more connected.",
  "If you believe in that vision, join us. Sign up today. Tell a friend to tell a friend. And together, let us build the future of agriculture in Kenya.",
];

type BuyerDemandSignal = {
  id: string;
  title: string;
  county: string;
  urgencyLabel: string;
  budgetLabel?: string;
};

const buyerDemandFallback: BuyerDemandSignal[] = [
  {
    id: "fallback-maize",
    title: "Need dry maize for immediate purchase",
    county: "Machakos",
    urgencyLabel: "Urgent",
    budgetLabel: "KES 180,000 - 230,000",
  },
  {
    id: "fallback-onions",
    title: "Need dry red onions at 35 KES per kg",
    county: "Machakos",
    urgencyLabel: "Urgent",
    budgetLabel: "Negotiable",
  },
  {
    id: "fallback-chicks",
    title: "Arbor acre chicks",
    county: "Kiambu",
    urgencyLabel: "Urgent",
    budgetLabel: "KES 3,000 - 3,600",
  },
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
    copy: "Verification and listing activity help buyers decide faster.",
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
  if (category === "livestock" || category === "inputs" || category === "service") return category;
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
  useAdaptiveLayout();
  const { productListings, serviceListings } = useProperties();
  const [heroVariant, setHeroVariant] = useState<HeroVariant>("sell_first");

  const { content: heroHeadline } = usePageContent("home.hero.headline");
  const { content: heroDescription } = usePageContent("home.hero.description");
  const [buyerDemandSignals, setBuyerDemandSignals] =
    useState<BuyerDemandSignal[]>(buyerDemandFallback);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    let cancelled = false;

    const formatBudget = (budget?: { min?: number; max?: number; currency?: string }) => {
      if (!budget) return undefined;
      const currency = budget.currency || "KES";
      const hasMin = typeof budget.min === "number" && Number.isFinite(budget.min);
      const hasMax = typeof budget.max === "number" && Number.isFinite(budget.max);

      if (hasMin && hasMax) {
        return `${currency} ${budget.min!.toLocaleString()} - ${budget.max!.toLocaleString()}`;
      }
      if (hasMin) {
        return `From ${currency} ${budget.min!.toLocaleString()}`;
      }
      if (hasMax) {
        return `Up to ${currency} ${budget.max!.toLocaleString()}`;
      }
      return "Negotiable";
    };

    const formatUrgency = (urgency?: string) => {
      if (urgency === "high") return "Urgent";
      if (urgency === "medium") return "Within a week";
      return "Can wait";
    };

    const loadBuyerDemand = async () => {
      try {
        const params = new URLSearchParams({
          page: "1",
          limit: "3",
          status: "active",
          marketType: "standard",
        });
        const response = await fetch(`${API_BASE_URL}/buyer-requests?${params}`, {
          cache: "no-store",
          credentials: "include",
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !Array.isArray(payload?.data)) return;

        const mapped = payload.data
          .slice(0, 3)
          .map((request: any) => ({
            id: request?._id || request?.id || Math.random().toString(36).slice(2),
            title: request?.title || "Buyer demand",
            county: request?.location?.county || "Kenya",
            urgencyLabel: formatUrgency(request?.urgency),
            budgetLabel: formatBudget(request?.budget),
          }))
          .filter((item: BuyerDemandSignal) => item.title);

        if (!cancelled && mapped.length > 0) {
          setBuyerDemandSignals(mapped);
        }
      } catch {
        // Keep fallback demand signals.
      }
    };

    void loadBuyerDemand();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadBlogPosts = async () => {
      try {
        const response = await apiRequest(`${API_ENDPOINTS.blog.list}?limit=3&page=1`);
        if (!cancelled) {
          setBlogPosts(Array.isArray(response?.data) ? response.data : []);
        }
      } catch {
        if (!cancelled) {
          setBlogPosts([]);
        }
      }
    };

    void loadBlogPosts();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const formatBlogDate = (value?: string) => {
    if (!value) return "Draft";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Draft";
    return parsed.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
                </div>

                <div className="mt-7 flex flex-wrap gap-2">
                  {(Object.keys(categoryMeta) as MarketCategory[]).map((category) => {
                    const meta = categoryMeta[category];
                    const liveCount =
                      category === "service"
                        ? liveServices.filter((item: any) => normalizeCategory(item, "service") === category)
                            .length +
                          liveProducts.filter((item: any) => normalizeCategory(item, "product") === category)
                            .length
                        : liveProducts.filter((item: any) => normalizeCategory(item, "product") === category)
                            .length;
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
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600">
                          {liveCount}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="anim-in-2 ui-card p-5 md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="ui-section-kicker">Start in minutes</p>
                    <h2 className="mt-2 text-2xl text-stone-900">List fast, browse immediately</h2>
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

        <section className="mx-auto max-w-7xl px-4 py-4 sm:py-6">
          <div className="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
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

            <div className="ui-card p-5">
              <p className="ui-section-kicker">Live demand and trust</p>
              <h3 className="mt-2 text-2xl text-stone-900">What buyers need right now</h3>

              <ul className="mt-5 space-y-3">
                {buyerDemandSignals.map((signal) => (
                  <li
                    key={signal.id}
                    className="flex items-start gap-3 border-b border-stone-200 pb-3 text-sm text-stone-700 last:border-b-0 last:pb-0"
                  >
                    <Search className="mt-0.5 h-4 w-4 shrink-0 text-[#A0452E]" />
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-900">{signal.title}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {signal.county}
                        {signal.budgetLabel ? ` - ${signal.budgetLabel}` : ""}
                        {signal.urgencyLabel ? ` - ${signal.urgencyLabel}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-5 space-y-4 border-t border-stone-200 pt-5">
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
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-2 sm:py-3">
          <MarketplaceSupportStrip />
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="ui-section-kicker">Agrisoko insights</p>
              <h2 className="mt-2 text-3xl text-stone-900">Market notes and practical guidance</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
                We use the blog for demand signals, trust guidance, founder updates, and practical
                field-level notes that help buyers and sellers trade better.
              </p>
            </div>
            <Link to="/blog" className="ui-btn-ghost w-full justify-center md:w-auto">
              View all insights
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {blogPosts.length > 0 ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {blogPosts.map((post) => (
                <Link
                  key={post._id}
                  to={`/blog/${post.slug}`}
                  className="ui-card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="aspect-[16/10] bg-stone-100">
                    {post.coverImage ? (
                      <img
                        src={getOptimizedImageUrl(post.coverImage, {
                          width: 900,
                          height: 600,
                          quality: "auto:good",
                        })}
                        alt={post.title}
                        onError={handleImageError}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FDF5F3] via-[#FAF7F2] to-stone-100">
                        <NotebookText className="h-10 w-10 text-[#A0452E]" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap gap-2">
                      {(post.tags || []).slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#FDF5F3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A0452E]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-2xl text-stone-900">{post.title}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-stone-600">
                      {post.excerpt}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-stone-500">
                      <span>{formatBlogDate(post.publishedAt || post.createdAt)}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-4 w-4" />
                        {post.readTimeMinutes} min read
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 ui-card-soft p-6">
              <p className="text-sm text-stone-600">
                The blog section is live. Publish the first article from the admin panel and it
                will appear here automatically.
              </p>
            </div>
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
          <div className="max-w-4xl">
            <p className="ui-section-kicker">A note from Stephen</p>
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


    </main>
  );
};

export default Home;
