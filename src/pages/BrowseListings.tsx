import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useProperties } from "../contexts/PropertyContext";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { API_ENDPOINTS, apiRequest } from "../config/api";
import { kenyaCounties } from "../data/kenyaCounties";
import { handleImageError } from "../utils/imageFallback";
import { getOptimizedImageUrl } from "../utils/imageOptimization";
import { normalizeKenyanPhone } from "../utils/phone";
import { getMarketTrustScore } from "../utils/trustScore";
import { useAdaptiveLayout } from "../hooks/useAdaptiveLayout";
import { TRUST_SCORE_VISIBLE } from "../config/featureFlags";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Eye,
  Bookmark,
  MessageCircle,
  Truck,
} from "lucide-react";
import RaffleCampaign from "../components/RaffleCampaign";
import MarketplaceSupportStrip from "../components/MarketplaceSupportStrip";

type Category = "all" | "produce" | "livestock" | "inputs" | "service";
type ServiceSubType = "all" | "equipment" | "professional_services";
type DeliveryScope = "countrywide" | "within_county" | "negotiable";

type UnifiedCard = {
  id: string;
  category: Category;
  subCategory?: string;
  title: string;
  description: string;
  ownerName?: string;
  county: string;
  locationLabel: string;
  priceLabel?: string;
  priceValue?: number;
  sizeLabel?: string;
  typeLabel: string;
  verified: boolean;
  paid: boolean;
  boosted: boolean;
  isDemo?: boolean;
  ownerId?: string;
  contact?: string;
  createdAt?: Date;
  ownerResponseTime?: string;
  ownerLastActive?: string;
  ownerTrustScore?: number;
  ownerFollowerCount?: number;
  ownerRatingAverage?: number;
  ownerRatingCount?: number;
  ownerCreatedAt?: Date;
  image?: string;
  deliveryScope: DeliveryScope;
};

type TrendingCard = {
  id: string;
  category: Category;
  listingType: "product" | "equipment" | "service" | "agrovet";
  title: string;
  description: string;
  county: string;
  locationLabel: string;
  priceLabel?: string;
  typeLabel: string;
  verified: boolean;
  ownerName?: string;
  image?: string;
  deliveryScope: DeliveryScope;
  engagement: {
    views: number;
    saves: number;
    recentInquiries: number;
    score: number;
  };
};

type EngagementMetrics = {
  views: number;
  saves: number;
  reachOuts: number;
};

const formatPrice = (value?: number) =>
  typeof value === "number"
    ? `KSh ${value.toLocaleString()}`
    : undefined;

const buildLocation = (loc: any) =>
  [loc?.ward, loc?.constituency, loc?.county, loc?.approximateLocation]
    .filter(Boolean)
    .join(", ");

const normalizeDeliveryScope = (value?: string): DeliveryScope => {
  if (value === "countrywide" || value === "within_county") {
    return value;
  }
  return "negotiable";
};

const getDeliveryScopeLabel = (scope: DeliveryScope) => {
  if (scope === "countrywide") return "Countrywide delivery";
  if (scope === "within_county") return "Within county";
  return "Delivery negotiable";
};

const toTrustInput = (item: UnifiedCard) => ({
  isVerified: item.verified,
  ownerTrustScore: item.ownerTrustScore,
  followerCount: item.ownerFollowerCount,
  ratingAverage: item.ownerRatingAverage,
  ratingCount: item.ownerRatingCount,
  createdAt: item.ownerCreatedAt,
  responseTimeLabel: item.ownerResponseTime,
});

const getScore = (item: UnifiedCard) => {
  const marketTrustScore = getMarketTrustScore(toTrustInput(item));
  const recency = getRecencyScore(item.createdAt) * 4;
  const boost = item.boosted ? 28 : 0;
  const verified = item.verified ? 16 : 0;
  const paid = item.paid ? 8 : 0;
  const trust = marketTrustScore * 0.6;

  const responseText = (item.ownerResponseTime || "").toLowerCase();
  const responseScore = responseText.includes("hour")
    ? 8
    : responseText.includes("day")
    ? 5
    : responseText.includes("week")
    ? 2
    : 3;

  return boost + verified + paid + trust + recency + responseScore;
};

type SortOption = "recommended" | "newest" | "verified" | "price_low" | "price_high";

const getRecencyScore = (date?: Date) => {
  if (!date) return 0;
  const ageHours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
  if (ageHours <= 24) return 3;
  if (ageHours <= 72) return 2;
  if (ageHours <= 168) return 1;
  return 0;
};

const getTopPickScore = (item: UnifiedCard, searchTerm: string) => {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const title = item.title.toLowerCase();
  const description = item.description.toLowerCase();
  const location = item.locationLabel.toLowerCase();
  const exactTitleMatch = normalizedSearch && title.includes(normalizedSearch) ? 3 : 0;
  const textMatch =
    normalizedSearch && !exactTitleMatch && `${description} ${location}`.includes(normalizedSearch)
      ? 1
      : 0;

  return getScore(item) + exactTitleMatch * 6 + textMatch * 3;
};

const ROUTE_CATEGORY_MAP: Record<string, Category> = {
  all: "all",
  produce: "produce",
  livestock: "livestock",
  inputs: "inputs",
  agrovets: "inputs",
  services: "service",
  service: "service",
};

const normalizeRouteCategory = (value?: string): Category =>
  (value && ROUTE_CATEGORY_MAP[value.toLowerCase()]) || "all";

const getBrowsePathForCategory = (category: Category) =>
  category === "all" ? "/browse" : `/browse/${category === "service" ? "services" : category}`;

const formatLastActive = (value?: string | Date) => {
  if (!value) return "Active recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Active recently";
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMins < 60) return `Active ${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Active ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Active ${diffDays}d ago`;
  return `Active ${date.toLocaleDateString()}`;
};

const HIDDEN_LISTING_STATUSES = new Set([
  "draft",
  "rejected",
  "deleted",
  "removed",
  "archived",
  "inactive",
  "delisted",
]);

const isServiceVisible = (service: any) => {
  const status = String(service.publishStatus || service.status || "").toLowerCase();
  if (status && HIDDEN_LISTING_STATUSES.has(status)) return false;
  if (service.isDeleted === true) return false;
  if (service.deletedAt) return false;
  if (service.active === false || service.isActive === false) return false;
  if (typeof service.isPublished === "boolean" && !service.isPublished) return false;
  return true;
};

const BrowseListings: React.FC = () => {
  const navigate = useNavigate();
  const { category: categoryParam } = useParams<{ category?: string }>();
  const { serviceListings, productListings, loading } = useProperties();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isCompact } = useAdaptiveLayout();

  const category = useMemo(() => normalizeRouteCategory(categoryParam), [categoryParam]);
  const [serviceSub, setServiceSub] = useState<ServiceSubType>("all");
  const [county, setCounty] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [showRaffle, setShowRaffle] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [trendingItems, setTrendingItems] = useState<TrendingCard[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [engagementById, setEngagementById] = useState<Record<string, EngagementMetrics>>({});

  useEffect(() => {
    if (categoryParam && normalizeRouteCategory(categoryParam) === "all" && categoryParam.toLowerCase() !== "all") {
      navigate("/browse", { replace: true });
    }
  }, [categoryParam, navigate]);

  useEffect(() => {
    if (category !== "service" && serviceSub !== "all") {
      setServiceSub("all");
    }
  }, [category, serviceSub]);

  useEffect(() => {
    let cancelled = false;

    const loadTrending = async () => {
      setTrendingLoading(true);
      try {
        const response = await apiRequest(API_ENDPOINTS.unifiedListings.trending(category, 6), {
          cache: "no-store",
        });
        if (!cancelled) {
          const items = Array.isArray(response?.data) ? response.data : [];
          setTrendingItems(
            items.map((item: any) => ({
              ...item,
              deliveryScope: normalizeDeliveryScope(item?.deliveryScope),
            }))
          );
        }
      } catch (error) {
        if (!cancelled) {
          setTrendingItems([]);
        }
      } finally {
        if (!cancelled) {
          setTrendingLoading(false);
        }
      }
    };

    void loadTrending();

    return () => {
      cancelled = true;
    };
  }, [category]);

  const cards = useMemo<UnifiedCard[]>(() => {
    // Product listings: Produce, Livestock, Inputs
    const productCards =
      (productListings as any[])?.map((p: any) => {
        const boostFlag = p.monetization?.premiumBadge;
        const paidFlag = p.payment?.paymentStatus === "paid" || p.monetization?.subscriptionActive;
        const verifiedFlag = !!p.isVerified;
        
        let categoryLabel: Category = "produce";
        let typeLabel = "Produce";
        if (p.category === "livestock") {
          categoryLabel = "livestock";
          typeLabel = "Livestock";
        } else if (p.category === "inputs") {
          categoryLabel = "inputs";
          typeLabel = "Inputs";
        }
        
        const ownerLastActive =
          p.owner?.lastActive || p.owner?.updatedAt || p.updatedAt || p.createdAt;
        const ownerResponseTime =
          p.owner?.responseTime || p.owner?.responseTimeLabel || "Responds within a day";

        return {
          id: p._id || p.id,
          category: categoryLabel,
          subCategory: p.subcategory,
          title: p.title,
          description: p.description,
          county: p.location?.county || "",
          locationLabel: buildLocation(p.location || {}),
          priceLabel: formatPrice(p.price),
          priceValue: typeof p.price === "number" ? p.price : undefined,
          typeLabel,
          verified: verifiedFlag,
          paid: !!paidFlag,
          boosted: !!boostFlag,
          isDemo: !!p.isDemo,
          createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
          image: p.images?.[0],
          ownerId: p.owner?._id || p.ownerId || p.owner,
          ownerName: p.owner?.fullName || p.owner?.name || p.ownerName,
          contact: p.contact || p.owner?.phone || p.owner?.email,
          ownerResponseTime,
          ownerLastActive: ownerLastActive ? formatLastActive(ownerLastActive) : undefined,
          ownerTrustScore:
            typeof p.owner?.trustScore === "number" ? p.owner.trustScore : undefined,
          ownerFollowerCount:
            typeof p.owner?.followerCount === "number" ? p.owner.followerCount : 0,
          ownerRatingAverage:
            typeof p.owner?.ratings?.average === "number" ? p.owner.ratings.average : undefined,
          ownerRatingCount:
            typeof p.owner?.ratings?.count === "number" ? p.owner.ratings.count : undefined,
          ownerCreatedAt: p.owner?.createdAt ? new Date(p.owner.createdAt) : undefined,
          deliveryScope: normalizeDeliveryScope(p.deliveryScope),
        } as UnifiedCard;
      }) || [];

    // Service listings
    const serviceCards =
      (serviceListings as any[])?.map((s: any) => {
        if (!isServiceVisible(s)) return null;
        const firstServiceImage =
          (Array.isArray(s.images) ? s.images[0] : undefined) ||
          (Array.isArray(s.photos) ? s.photos[0] : undefined);
        const boostFlag =
          s.monetization?.boostOption &&
          s.monetization?.boostOption !== "none";
        const paidFlag = s.payment?.paymentStatus === "paid";
        const verifiedFlag = !!s.isVerified || !!s.verified;
        const locationLabel = buildLocation(s.location || {});
        const ownerLastActive =
          s.owner?.lastActive || s.owner?.updatedAt || s.updatedAt || s.createdAt;
        const ownerResponseTime =
          s.owner?.responseTime || s.owner?.responseTimeLabel || "Responds within a day";

        return {
          id: s._id || s.id,
          category: "service" as Category,
          subCategory: s.type,
          title: s.name,
          description: s.description,
          county: s.location?.county || "",
          locationLabel,
          priceValue: typeof s.price === "number" ? s.price : undefined,
          typeLabel: s.type === "equipment"
            ? "Equipment Hire"
            : "Professional Service",
          verified: verifiedFlag,
          paid: !!paidFlag,
          boosted: !!boostFlag,
          createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
          image: firstServiceImage,
          ownerId: s.owner?._id || s.ownerId || s.owner,
          ownerName: s.owner?.fullName || s.owner?.name || s.ownerName,
          contact: s.contact || s.owner?.phone || s.owner?.email,
          ownerResponseTime,
          ownerLastActive: ownerLastActive ? formatLastActive(ownerLastActive) : undefined,
          ownerTrustScore:
            typeof s.owner?.trustScore === "number" ? s.owner.trustScore : undefined,
          ownerFollowerCount:
            typeof s.owner?.followerCount === "number" ? s.owner.followerCount : 0,
          ownerRatingAverage:
            typeof s.owner?.ratings?.average === "number" ? s.owner.ratings.average : undefined,
          ownerRatingCount:
            typeof s.owner?.ratings?.count === "number" ? s.owner.ratings.count : undefined,
          ownerCreatedAt: s.owner?.createdAt ? new Date(s.owner.createdAt) : undefined,
          deliveryScope: normalizeDeliveryScope(s.deliveryScope),
        } as UnifiedCard;
      }) || [];

    return [...productCards, ...serviceCards].filter(
      (c): c is UnifiedCard => !!c && !!c.id
    );
  }, [productListings, serviceListings]);

  useEffect(() => {
    let cancelled = false;
    const listingIds = cards.map((card) => card.id).filter(Boolean);

    if (listingIds.length === 0) {
      setEngagementById({});
      return () => {
        cancelled = true;
      };
    }

    const loadEngagement = async () => {
      try {
        const response = await apiRequest(
          API_ENDPOINTS.unifiedListings.engagement(listingIds),
          { cache: "no-store" }
        );
        if (!cancelled) {
          setEngagementById(response?.data || {});
        }
      } catch {
        if (!cancelled) {
          setEngagementById({});
        }
      }
    };

    void loadEngagement();

    return () => {
      cancelled = true;
    };
  }, [cards]);

  const filtered = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    const nextCards = cards
      .filter((card) => {
        if (category !== "all" && card.category !== category) return false;
        if (
          category === "service" &&
          serviceSub !== "all" &&
          card.subCategory !== serviceSub
        )
          return false;
        if (verifiedOnly && !card.verified) return false;
        if (county && card.county?.toLowerCase() !== county.toLowerCase())
          return false;
        if (searchTerm) {
          const haystack = `${card.title} ${card.description} ${card.locationLabel}`.toLowerCase();
          if (!haystack.includes(searchTerm)) return false;
        }
        return true;
      });

    return nextCards.sort((a, b) => {
      if (sortBy === "verified") {
        const verifiedDiff = Number(b.verified) - Number(a.verified);
        if (verifiedDiff !== 0) return verifiedDiff;
      }

      if (sortBy === "price_low") {
        const aPrice = typeof a.priceValue === "number" ? a.priceValue : Number.POSITIVE_INFINITY;
        const bPrice = typeof b.priceValue === "number" ? b.priceValue : Number.POSITIVE_INFINITY;
        if (aPrice !== bPrice) return aPrice - bPrice;
      }

      if (sortBy === "price_high") {
        const aPrice = typeof a.priceValue === "number" ? a.priceValue : Number.NEGATIVE_INFINITY;
        const bPrice = typeof b.priceValue === "number" ? b.priceValue : Number.NEGATIVE_INFINITY;
        if (aPrice !== bPrice) return bPrice - aPrice;
      }

      if (sortBy === "newest") {
        const timeA = a.createdAt ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      }

      const scoreDiff = getTopPickScore(b, searchTerm) - getTopPickScore(a, searchTerm);
      if (scoreDiff !== 0) return scoreDiff;
      const timeA = a.createdAt ? a.createdAt.getTime() : 0;
      const timeB = b.createdAt ? b.createdAt.getTime() : 0;
      return timeB - timeA;
    });
  }, [cards, category, serviceSub, county, search, sortBy, verifiedOnly]);

  const stats = useMemo(() => {
    const total = cards.length;
    const verifiedCount = cards.filter((card) => card.verified).length;
    const boostedCount = cards.filter((card) => card.boosted).length;
    return { total, verifiedCount, boostedCount };
  }, [cards]);
  const hasActiveFilters = Boolean(
    county || search || category !== "all" || serviceSub !== "all" || verifiedOnly
  );
  const activeFilterCount = [
    Boolean(county),
    category !== "all",
    serviceSub !== "all",
    verifiedOnly,
    sortBy !== "recommended",
  ].filter(Boolean).length;
  const sortSummary = useMemo(() => {
    switch (sortBy) {
      case "newest":
        return "Showing newest listings first.";
      case "verified":
        return "Verified sellers appear first.";
      case "price_low":
        return "Showing lowest prices first.";
      case "price_high":
        return "Showing highest prices first.";
      default:
        return "Results prioritize trust, visibility, and recency.";
    }
  }, [sortBy]);

  const categoryPills: Array<{ id: Category; label: string; icon?: string }> = [
    { id: "all", label: "All" },
    { id: "produce", label: "Produce" },
    { id: "livestock", label: "Livestock" },
    { id: "inputs", label: "Inputs" },
    { id: "service", label: "Services" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .fade-up { animation: fadeUp 600ms ease-out both; }
        .fade-in { animation: fadeIn 500ms ease-out both; }
      `}</style>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-[#F3C9BE]/45 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-0 h-72 w-72 rounded-full bg-[#FFF0C8]/55 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 top-16 h-72 w-72 rounded-full bg-white/70 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 py-10 md:py-14 space-y-6">
          {!user && (
            <div className="fade-in rounded-3xl border border-stone-200 bg-white/90 px-5 py-4 shadow-sm backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900">
                    Sign in to call, save, and contact sellers
                  </p>
                  <p className="text-xs text-stone-500">
                    Listing details stay public. Sign in for direct contact and saved listings.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="ui-btn-primary px-4 py-2 text-sm"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}

          <div className="fade-up rounded-[2rem] border border-stone-200 bg-white/88 p-5 shadow-[0_16px_40px_rgba(28,25,23,0.08)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A0452E]">
              Marketplace
            </p>
            <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight text-stone-900 md:text-4xl">
              Browse and buy with confidence
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 md:text-base">
              Discover produce, livestock, farm inputs, and agricultural services from verified sellers across Kenya.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to={
                  user
                    ? "/create-listing?compact=1"
                    : `/login?mode=signup&next=${encodeURIComponent("/create-listing?compact=1")}`
                }
                className="ui-btn-primary px-4 py-2 text-sm"
              >
                List free today
              </Link>
              <Link
                to="/about"
                className="ui-btn-secondary px-4 py-2 text-sm"
              >
                Learn about Agrisoko
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-stone-600">
              <span className="ui-chip-soft">{loading ? "--" : stats.total.toLocaleString()} listings</span>
              <span className="ui-chip-soft">{loading ? "--" : stats.verifiedCount.toLocaleString()} verified</span>
              <span className="ui-chip-soft">{loading ? "--" : stats.boostedCount.toLocaleString()} boosted</span>
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1">Direct contact</span>
            </div>
          </div>

          <div className="fade-up overflow-hidden rounded-3xl border border-[#F3C9BE] bg-[#FFF8F1]/92 p-3 md:p-4 shadow-sm backdrop-blur">
            <button
              type="button"
              onClick={() => setShowRaffle((prev) => !prev)}
              className="relative flex w-full flex-col gap-2 text-left md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2 rounded-full border border-[#F3C9BE] bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#A0452E]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Campaign live
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-sm font-semibold text-stone-900 md:text-base">
                    {showRaffle ? "Hide raffle details" : "Open raffle details"}
                  </p>
                  <p className="text-sm text-stone-600">Free listings. Invite rewards. KSh 20,000 top prize.</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <span className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#8B3525] bg-[#8B3525] px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-sm">
                  {showRaffle ? (
                    <>
                      <ChevronUp className="mr-1 h-4 w-4" />
                      Collapse
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-1 h-4 w-4" />
                      Expand
                    </>
                  )}
                </span>
              </div>
            </button>

            {showRaffle && (
              <div className="mt-3">
                <RaffleCampaign />
              </div>
            )}
          </div>

          <MarketplaceSupportStrip
            title="Need help before you contact a seller?"
            subtitle="Support is available on WhatsApp, by email, and through the Agrisoko app."
          />

          <div className="fade-up rounded-[2rem] border border-stone-200 bg-white/92 p-4 md:p-5 shadow-sm">
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                  Search listings
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 h-5 w-5 text-stone-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title, location, or description"
                    className="ui-input pl-10 pr-4 py-3"
                  />
                </div>
              </div>

              {isCompact ? (
                <>
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-[#FAF7F2] px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-stone-900">
                        {filtered.length} listing{filtered.length === 1 ? "" : "s"} found
                      </p>
                      <p className="text-xs text-stone-500">
                        {activeFilterCount > 0
                          ? `${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active`
                          : "All listings"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMobileFilters((prev) => !prev)}
                      className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 transition hover:border-[#E8A08E] hover:bg-[#FDF5F3]"
                    >
                      <Filter className="h-4 w-4" />
                      Filters
                      {showMobileFilters ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {showMobileFilters && (
                    <div className="space-y-4 rounded-2xl border border-stone-200 bg-[#FAF7F2] p-3">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                          County
                        </label>
                        <select
                          value={county}
                          onChange={(e) => setCounty(e.target.value)}
                          className="ui-input py-3"
                        >
                          <option value="">All counties</option>
                          {[...kenyaCounties]
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((c) => (
                              <option key={c.code} value={c.name.toLowerCase()}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                          Sort
                        </label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as SortOption)}
                          className="ui-input py-3 font-semibold text-stone-700"
                        >
                          <option value="recommended">Top picks</option>
                          <option value="newest">Newest</option>
                          <option value="verified">Verified first</option>
                          <option value="price_low">Price: low to high</option>
                          <option value="price_high">Price: high to low</option>
                        </select>
                      </div>

                      {category === "service" && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                            Service type
                          </label>
                          <select
                            value={serviceSub}
                            onChange={(e) =>
                              setServiceSub(e.target.value as ServiceSubType)
                            }
                            className="ui-input py-3"
                          >
                            <option value="all">All services</option>
                            <option value="equipment">Equipment Hire</option>
                            <option value="professional_services">Professional Services</option>
                          </select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                          Category
                        </label>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {categoryPills.map((pill) => {
                            const active = category === pill.id;
                            return (
                              <button
                                key={pill.id}
                                type="button"
                                onClick={() => {
                                  navigate(getBrowsePathForCategory(pill.id));
                                  setServiceSub("all");
                                }}
                                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold border transition ${
                                  active
                                    ? "border-[#A0452E] bg-[#A0452E] text-white shadow-sm"
                                    : "border-stone-200 bg-white text-stone-700 hover:border-[#E8A08E] hover:bg-[#FDF5F3]"
                                }`}
                              >
                                {pill.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <label className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[#A0452E]"
                          checked={verifiedOnly}
                          onChange={() => setVerifiedOnly((prev) => !prev)}
                        />
                        Verified only
                      </label>

                      {hasActiveFilters && (
                        <button
                          onClick={() => {
                            setCounty("");
                            setSearch("");
                            navigate("/browse");
                            setServiceSub("all");
                            setVerifiedOnly(false);
                            setSortBy("recommended");
                          }}
                          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-white transition"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr] items-end">
                    <div />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                          County
                        </label>
                        <select
                          value={county}
                          onChange={(e) => setCounty(e.target.value)}
                          className="ui-input py-3"
                        >
                          <option value="">All counties</option>
                          {[...kenyaCounties]
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((c) => (
                              <option key={c.code} value={c.name.toLowerCase()}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      {category === "service" ? (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                            Service type
                          </label>
                          <select
                            value={serviceSub}
                            onChange={(e) =>
                              setServiceSub(e.target.value as ServiceSubType)
                            }
                            className="ui-input py-3"
                          >
                            <option value="all">All services</option>
                            <option value="equipment">Equipment Hire</option>
                            <option value="professional_services">Professional Services</option>
                          </select>
                        </div>
                      ) : (
                        <div className="hidden sm:block" />
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                      Category
                    </span>
                    {categoryPills.map((pill) => {
                      const active = category === pill.id;
                      return (
                        <button
                          key={pill.id}
                          type="button"
                          onClick={() => {
                            navigate(getBrowsePathForCategory(pill.id));
                            setServiceSub("all");
                          }}
                          className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${
                            active
                              ? "border-[#A0452E] bg-[#A0452E] text-white shadow-sm"
                              : "border-stone-200 bg-white text-stone-700 hover:border-[#E8A08E] hover:bg-[#FDF5F3]"
                          }`}
                        >
                          {pill.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                    <label className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#A0452E]"
                        checked={verifiedOnly}
                        onChange={() => setVerifiedOnly((prev) => !prev)}
                      />
                      Verified only
                    </label>
                  </div>

                  {hasActiveFilters && (
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <Filter className="h-4 w-4" />
                        Filters active
                      </div>
                      <button
                        onClick={() => {
                          setCounty("");
                          setSearch("");
                          navigate("/browse");
                          setServiceSub("all");
                          setVerifiedOnly(false);
                          setSortBy("recommended");
                        }}
                        className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="fade-up flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-stone-200 bg-white/92 px-4 py-3 text-sm text-stone-600 shadow-sm">
            <div>
              <span className="font-semibold text-stone-900">
                {filtered.length} listing{filtered.length === 1 ? "" : "s"} found
              </span>
              <p className="mt-1 text-xs text-stone-500">
                {sortSummary}
              </p>
            </div>
            <div className={`flex items-center gap-2 ${isCompact ? "hidden" : ""}`}>
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Sort
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="ui-input py-2 text-sm font-semibold text-stone-700"
              >
                <option value="recommended">Top picks</option>
                <option value="newest">Newest</option>
                <option value="verified">Verified first</option>
                <option value="price_low">Price: low to high</option>
                <option value="price_high">Price: high to low</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pb-16 space-y-6">
        {loading && (
          <>
            <div className="rounded-3xl border border-dashed border-stone-200 bg-white py-6 text-center">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-stone-600">
                <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-stone-200 border-t-[#A0452E]" />
                Loading listings...
              </div>
            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-3xl border border-stone-100 bg-white shadow-sm"
                >
                  <div className="h-52 sm:h-56 animate-pulse bg-stone-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-2/5 rounded bg-stone-100 animate-pulse" />
                    <div className="h-5 w-4/5 rounded bg-stone-100 animate-pulse" />
                    <div className="h-4 w-full rounded bg-stone-100 animate-pulse" />
                    <div className="h-4 w-3/4 rounded bg-stone-100 animate-pulse" />
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="h-10 rounded-xl bg-stone-100 animate-pulse" />
                      <div className="h-10 rounded-xl bg-stone-100 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && filtered.length === 0 && (
          <div className="rounded-3xl border border-dashed border-stone-200 bg-white py-16 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
              <Search className="h-5 w-5 text-stone-400" />
            </div>
            <h3 className="font-display mb-2 text-2xl font-semibold text-stone-800">
              {hasActiveFilters ? "No listings found" : "No listings yet"}
            </h3>
            <p className="mx-auto mb-6 max-w-md text-stone-600">
              {hasActiveFilters
                ? "Try a different search term, county, or category."
                : "No listings are available right now. Check back soon or post your own listing."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  navigate("/browse");
                  setServiceSub("all");
                  setCounty("");
                  setSearch("");
                  setVerifiedOnly(false);
                }}
                className="ui-btn-primary px-6 py-3"
              >
                Browse all listings
              </button>
              <Link
                to={
                  user
                    ? "/create-listing?compact=1"
                    : `/login?mode=signup&next=${encodeURIComponent("/create-listing?compact=1")}`
                }
                className="ui-btn-ghost px-6 py-3"
              >
                {user ? "List free today" : "Sign in to list"}
              </Link>
            </div>
          </div>
        )}

        {!loading && !trendingLoading && trendingItems.length > 0 && (
          <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A0452E]">
                  Trending now
                </p>
                <h2 className="font-display mt-1 text-xl font-semibold text-stone-900">
                  Listings buyers are engaging with most
                </h2>
              </div>
              <p className="text-sm text-stone-500">
                Based on views, saves, and recent inquiries.
              </p>
            </div>

            <div className="flex items-start gap-4 overflow-x-auto pb-2">
              {trendingItems.map((card) => (
                <Link
                  key={`trending-${card.id}`}
                  to={`/listings/${card.id}`}
                  className="card-lift min-w-[250px] max-w-[280px] flex-[0_0_270px] overflow-hidden rounded-3xl border border-stone-200 bg-white transition lg:flex-[0_0_255px] lg:max-w-[255px]"
                >
                  <div className="h-36 overflow-hidden bg-stone-100">
                    {card.image ? (
                      <img
                        src={getOptimizedImageUrl(card.image, {
                          width: 560,
                          height: 360,
                          fit: "fill",
                        })}
                        alt={card.title}
                        onError={handleImageError}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-medium text-stone-400">
                        No image available
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2.5 p-3">
                    <div className="flex items-start justify-between gap-2">
                        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-700">
                        {card.typeLabel}
                      </span>
                      {card.priceLabel && (
                        <span className="text-xs font-semibold text-[#A0452E]">
                          {card.priceLabel}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="line-clamp-2 text-sm font-semibold text-stone-900">
                        {card.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-stone-500">
                        {card.description}
                      </p>
                    </div>

                    <div className="space-y-1 text-[11px] text-stone-500">
                      <div className="flex flex-wrap gap-2">
                        {card.verified && (
                          <span className="rounded-full bg-[#FDF5F3] px-2 py-1 font-semibold text-[#A0452E]">
                            Verified
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-1 font-semibold text-stone-700">
                          <Truck className="h-3 w-3" />
                          {getDeliveryScopeLabel(card.deliveryScope)}
                        </span>
                      </div>
                      {card.ownerName && (
                        <p className="line-clamp-1 text-[11px] text-stone-500">
                          By {card.ownerName}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 border-t border-stone-100 pt-2.5 text-[10px] font-semibold text-stone-600 lg:text-[9px]">
                      <span className="inline-flex items-center justify-center gap-1 rounded-lg bg-stone-50 px-2 py-1.5 lg:px-1.5 lg:gap-0.5 whitespace-nowrap">
                        <Eye className="h-3.5 w-3.5 text-stone-400" />
                        {card.engagement.views} views
                      </span>
                      <span className="inline-flex items-center justify-center gap-1 rounded-lg bg-stone-50 px-2 py-1.5 lg:px-1.5 lg:gap-0.5 whitespace-nowrap">
                        <Bookmark className="h-3.5 w-3.5 text-stone-400" />
                        {card.engagement.saves} saves
                      </span>
                      <span className="inline-flex items-center justify-center gap-1 rounded-lg bg-stone-50 px-2 py-1.5 lg:px-1.5 lg:gap-0.5 whitespace-nowrap text-[9px] lg:text-[8px]">
                        <MessageCircle className="h-3.5 w-3.5 text-stone-400" />
                        {card.engagement.recentInquiries} reach-outs
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {!loading && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((card, index) => {
            const canCheckoutOnline =
              card.category !== "service" &&
              typeof card.priceValue === "number" &&
              card.priceValue > 0;
            const normalizedCardPhone = card.contact
              ? normalizeKenyanPhone(card.contact)
              : null;
            const engagement = engagementById[card.id] || {
              views: 0,
              saves: 0,
              reachOuts: 0,
            };
            const marketTrustScore = Math.round(getMarketTrustScore(toTrustInput(card)));
            const categoryColors: Record<Category, string> = {
              all: "bg-stone-100 text-stone-700",
              produce: "bg-[#FDF5F3] text-[#A0452E]",
              livestock: "bg-[#FDF5F3] text-[#A0452E]",
              inputs: "bg-[#FFF9EC] text-[#8A5A12]",
              service: "bg-[#F1F7F2] text-[#1A7A4A]",
            };
            const badgeColor = categoryColors[card.category] || categoryColors.produce;

            return (
              <div
                key={card.id}
                className="card-lift group relative flex flex-col overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm fade-up"
                style={{ animationDelay: `${Math.min(index * 40, 360)}ms` }}
              >
                <div className="relative h-52 sm:h-56 bg-stone-100">
                  {card.image ? (
                    <img
                      src={getOptimizedImageUrl(card.image, {
                        width: 720,
                        height: 540,
                        fit: "fill",
                      })}
                      alt={card.title}
                      onError={handleImageError}
                      className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-stone-400 text-sm font-medium">
                      No image available
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />

                  <div className="absolute top-3 left-3 inline-flex items-center gap-2 flex-wrap max-w-[calc(100%-1.5rem)]">
                    {card.isDemo && (
                      <span className="rounded-full bg-stone-900/80 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-white">
                        Sample listing
                      </span>
                    )}
                    {card.boosted && (
                      <span className="rounded-full bg-[#FDF5F3] text-[#A0452E] text-[11px] font-semibold px-2.5 py-1 whitespace-nowrap">
                        Boosted
                      </span>
                    )}
                    {card.verified && (
                      <span className="rounded-full bg-[#FDF5F3] text-[#A0452E] text-[11px] font-semibold px-2.5 py-1 whitespace-nowrap">
                        Verified
                      </span>
                    )}
                  </div>

                  {card.priceLabel && (
                    <div className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-sm font-semibold text-[#A0452E] shadow-sm">
                      {card.priceLabel}
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold text-stone-500">
                    <span className={`rounded-full px-3 py-1 ${badgeColor}`}>
                      {card.typeLabel}
                    </span>
                    <div className="flex items-center gap-2">
                      {TRUST_SCORE_VISIBLE && marketTrustScore > 0 && (
                        <span className="rounded-full bg-[#FFF9EC] px-2.5 py-1 text-[11px] font-semibold text-[#8A5A12]">
                          Trust score {marketTrustScore}
                        </span>
                      )}
                      {card.paid && <span className="text-[#A0452E]">Priority</span>}
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-stone-900 line-clamp-2 leading-tight">
                    {card.title}
                  </h3>

                  <p className="text-sm text-stone-600 line-clamp-2">
                    {card.description || "No description provided."}
                  </p>

                  <div className="pt-2 border-t border-stone-100">
                    {card.ownerId && card.ownerName && (
                      <Link
                        to={`/sellers/${card.ownerId}`}
                        className="inline-flex items-center text-xs font-semibold text-[#A0452E] hover:text-[#8B3525]"
                      >
                        By {card.ownerName}
                      </Link>
                    )}
                    <p className="text-xs text-stone-500 font-medium">
                      Location: {card.locationLabel || "Location pending"}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-700">
                      <Truck className="h-3.5 w-3.5" />
                      {getDeliveryScopeLabel(card.deliveryScope)}
                    </p>
                    {(card.ownerResponseTime || card.ownerLastActive) && (
                      <p className="mt-1 text-xs text-stone-500">
                        {[card.ownerResponseTime, card.ownerLastActive].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-stone-600">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-stone-400" />
                        {engagement.views} views
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Bookmark className="h-3.5 w-3.5 text-stone-400" />
                        {engagement.saves} saves
                      </span>
                      <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        <MessageCircle className="h-3.5 w-3.5 text-stone-400" />
                        {engagement.reachOuts} reach-outs
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      to={`/listings/${card.id}`}
                      className="ui-btn-primary flex-1 px-3 py-2.5 text-sm"
                    >
                      View details
                    </Link>
                    {canCheckoutOnline && (
                      <button
                        type="button"
                        onClick={() =>
                          addItem({
                            listingId: card.id,
                            listingType: "product",
                            title: card.title,
                            image: card.image,
                            category: card.category,
                            county: card.county,
                            deliveryScope: card.deliveryScope,
                            sellerId: card.ownerId,
                            sellerName: card.ownerName,
                            price: Number(card.priceValue),
                            quantity: 1,
                          })
                        }
                        className="ui-btn-secondary flex-1 px-3 py-2.5 text-sm"
                      >
                        Add to cart
                      </button>
                    )}
                    {normalizedCardPhone ? (
                      user ? (
                        <a
                          href={`tel:${normalizedCardPhone}`}
                          className="ui-btn-ghost flex-1 px-3 py-2.5 text-sm"
                        >
                          Call
                        </a>
                      ) : (
                        <Link
                          to="/login"
                          className="ui-btn-ghost flex-1 px-3 py-2.5 text-sm"
                        >
                          Call
                        </Link>
                      )
                    ) : !user ? (
                      <Link
                        to={`/login?next=${encodeURIComponent(`/listings/${card.id}`)}`}
                        className="ui-btn-ghost flex-1 px-3 py-2.5 text-sm"
                      >
                        Log in to call
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="py-8 text-center text-sm text-stone-500">
            Showing {filtered.length} of {cards.length} listings
          </div>
        )}

        <div className="mt-16 rounded-3xl border border-stone-200 bg-white/88 p-8 shadow-sm">
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] items-center">
            <div>
              <h3 className="font-display mb-3 text-2xl font-semibold text-stone-900">
                Looking to sell instead?
              </h3>
              <p className="text-stone-600">
                Find buyers actively looking for what you offer. Browse requests from customers across Kenya who need your products or services.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:justify-end">
              <Link
                to="/request"
                className="ui-btn-primary px-6 py-3"
              >
                View buy requests
              </Link>
              <Link
                to={
                  user
                    ? "/create-listing?compact=1"
                    : `/login?mode=signup&next=${encodeURIComponent("/create-listing?compact=1")}`
                }
                className="ui-btn-secondary px-6 py-3"
              >
                Post your products
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

};

export default BrowseListings;
