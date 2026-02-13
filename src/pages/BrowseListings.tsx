import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useProperties } from "../contexts/PropertyContext";
import { useAuth } from "../contexts/AuthContext";
import { kenyaCounties } from "../data/kenyaCounties";
import { handleImageError } from "../utils/imageFallback";
import { Search, Filter } from "lucide-react";
import RaffleCampaign from "../components/RaffleCampaign";

type Category = "all" | "produce" | "livestock" | "inputs" | "service";
type ServiceSubType = "all" | "equipment" | "professional_services";

type UnifiedCard = {
  id: string;
  category: Category;
  subCategory?: string;
  title: string;
  description: string;
  county: string;
  locationLabel: string;
  priceLabel?: string;
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
  image?: string;
};

const formatPrice = (value?: number) =>
  typeof value === "number"
    ? `KSh ${value.toLocaleString()}`
    : undefined;

const buildLocation = (loc: any) =>
  [loc?.ward, loc?.constituency, loc?.county, loc?.approximateLocation]
    .filter(Boolean)
    .join(", ");

const getScore = (item: UnifiedCard) => {
  // Sort priority: boosted first, then verified, then paid.
  const boost = item.boosted ? 4 : 0;
  const verified = item.verified ? 2 : 0;
  const paid = item.paid ? 1 : 0;
  return boost + paid + verified;
};

/**
 * Format phone number for tel: URI
 * Removes spaces, hyphens, and other non-alphanumeric characters
 * Preserves international + prefix
 */
const formatPhoneForUri = (contact: string): string => {
  if (!contact) return "";
  // Remove spaces, hyphens, parentheses, periods
  return contact.replace(/[\s\-().\s]/g, "");
};

const highValueCategories: Category[] = ["livestock", "inputs", "service"];

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
  const { serviceListings, productListings, loading } = useProperties();
  const { user } = useAuth();

  const [category, setCategory] = useState<Category>("all");
  const [serviceSub, setServiceSub] = useState<ServiceSubType>("all");
  const [county, setCounty] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [verifiedOnlyManual, setVerifiedOnlyManual] = useState(false);
  const isHighValueCategory =
    category !== "all" && highValueCategories.includes(category);

  useEffect(() => {
    if (verifiedOnlyManual) return;
    setVerifiedOnly(isHighValueCategory);
  }, [isHighValueCategory, verifiedOnlyManual]);

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
          typeLabel = "Farm Inputs";
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
          typeLabel,
          verified: verifiedFlag,
          paid: !!paidFlag,
          boosted: !!boostFlag,
          isDemo: !!p.isDemo,
          createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
          image: p.images?.[0],
          ownerId: p.owner?._id || p.ownerId || p.owner,
          contact: p.contact || p.owner?.phone || p.owner?.email,
          ownerResponseTime,
          ownerLastActive: ownerLastActive ? formatLastActive(ownerLastActive) : undefined,
        } as UnifiedCard;
      }) || [];

    // Service listings
    const serviceCards =
      (serviceListings as any[])?.map((s: any) => {
        if (!isServiceVisible(s)) return null;
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
          typeLabel: s.type === "equipment"
            ? "Equipment Hire"
            : "Professional Service",
          verified: verifiedFlag,
          paid: !!paidFlag,
          boosted: !!boostFlag,
          createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
          image: s.images?.[0],
          ownerId: s.owner?._id || s.ownerId || s.owner,
          contact: s.contact || s.owner?.phone || s.owner?.email,
          ownerResponseTime,
          ownerLastActive: ownerLastActive ? formatLastActive(ownerLastActive) : undefined,
        } as UnifiedCard;
      }) || [];

    return [...productCards, ...serviceCards].filter(
      (c): c is UnifiedCard => !!c && !!c.id
    );
  }, [productListings, serviceListings]);

  const filtered = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    return cards
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
      })
      .sort((a, b) => {
        const scoreDiff = getScore(b) - getScore(a);
        if (scoreDiff !== 0) return scoreDiff;
        const timeA = a.createdAt ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      });
  }, [cards, category, serviceSub, county, search, verifiedOnly]);

  const stats = useMemo(() => {
    const total = cards.length;
    const verifiedCount = cards.filter((card) => card.verified).length;
    const boostedCount = cards.filter((card) => card.boosted).length;
    return { total, verifiedCount, boostedCount };
  }, [cards]);
  const hasActiveFilters = Boolean(
    county || search || category !== "all" || serviceSub !== "all" || verifiedOnly
  );

  const categoryPills: Array<{ id: Category; label: string; icon?: string }> = [
    { id: "all", label: "All" },
    { id: "produce", label: "Produce" },
    { id: "livestock", label: "Livestock" },
    { id: "inputs", label: "Farm Inputs" },
    { id: "service", label: "Services" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
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
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-0 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 py-10 md:py-14 space-y-6">
          {!user && (
            <div className="rounded-2xl border border-emerald-200 bg-white/90 px-4 py-3 shadow-sm fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Sign in to view details and contact sellers
                  </p>
                  <p className="text-xs text-slate-500">
                    Save listings and message verified sellers directly.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] items-stretch">
            <div className="rounded-3xl border border-emerald-100 bg-white/90 p-6 md:p-8 shadow-lg fade-up">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Marketplace
              </p>
              <h1 className="mt-3 text-4xl md:text-5xl font-serif font-semibold text-slate-900 tracking-tight">
                Browse and buy with confidence
              </h1>
              <p className="mt-4 text-slate-600 text-base leading-relaxed max-w-2xl">
                Discover fresh produce, livestock, farm inputs, and professional agricultural services.
                Connect with verified sellers across Kenya and compare listings in seconds.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/about"
                  className="inline-flex items-center rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition"
                >
                  Learn about Agrisoko
                </Link>
                <Link
                  to={user ? "/create-listing" : "/login?next=/create-listing"}
                  className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
                >
                  Post a listing
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                  Verified sellers
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                  Boosted listings first
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                  Direct contact
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 md:p-8 shadow-lg fade-up">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Market pulse
              </p>
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-semibold text-slate-900">
                    {loading ? "--" : stats.total.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">Listings</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">
                    {loading ? "--" : stats.verifiedCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">Verified</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">
                    {loading ? "--" : stats.boostedCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">Boosted</p>
                </div>
              </div>
              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                Browse the latest inventory and contact sellers instantly. New listings are added daily.
              </div>
            </div>
          </div>

          <div className="fade-up">
            <RaffleCampaign />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm fade-up">
            <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr] items-end">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Search listings
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title, location, or description"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    County
                  </label>
                  <select
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
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
                    <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Service type
                    </label>
                    <select
                      value={serviceSub}
                      onChange={(e) =>
                        setServiceSub(e.target.value as ServiceSubType)
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
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
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Category
              </span>
              {categoryPills.map((pill) => {
                const active = category === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => {
                      setCategory(pill.id);
                      setServiceSub("all");
                      setVerifiedOnlyManual(false);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${
                      active
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-emerald-600"
                  checked={verifiedOnly}
                  onChange={() => {
                    setVerifiedOnly((prev) => !prev);
                    setVerifiedOnlyManual(true);
                  }}
                />
                Verified only
              </label>
              {!verifiedOnlyManual && isHighValueCategory && (
                <span className="text-xs text-emerald-600 font-semibold">
                  Recommended for this category
                </span>
              )}
              {verifiedOnlyManual && isHighValueCategory && !verifiedOnly && (
                <button
                  type="button"
                  onClick={() => {
                    setVerifiedOnly(true);
                    setVerifiedOnlyManual(false);
                  }}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Use recommended
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Filter className="h-4 w-4" />
                  Filters active
                </div>
                <button
                  onClick={() => {
                    setCounty("");
                    setSearch("");
                    setCategory("all");
                    setServiceSub("all");
                    setVerifiedOnly(false);
                    setVerifiedOnlyManual(false);
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 fade-up">
            <span className="font-semibold text-slate-900">
              {filtered.length} listing{filtered.length === 1 ? "" : "s"} found
            </span>
            <span className="text-xs text-slate-500">
              Sorted by boost, verification, and recency
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pb-16 space-y-6">
        {loading && (
          <>
            <div className="text-center py-6 bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="inline-flex items-center gap-2 text-slate-600 text-sm font-medium">
                <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
                Loading listings...
              </div>
            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
                >
                  <div className="aspect-[4/3] animate-pulse bg-slate-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-2/5 rounded bg-slate-100 animate-pulse" />
                    <div className="h-5 w-4/5 rounded bg-slate-100 animate-pulse" />
                    <div className="h-4 w-full rounded bg-slate-100 animate-pulse" />
                    <div className="h-4 w-3/4 rounded bg-slate-100 animate-pulse" />
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
                      <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-800 mb-2">
              {hasActiveFilters ? "No listings found" : "No listings yet"}
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {hasActiveFilters
                ? "Try a different search term, county, or category."
                : "No listings are available right now. Check back soon or post your own listing."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setCategory("all");
                  setServiceSub("all");
                  setCounty("");
                  setSearch("");
                  setVerifiedOnly(false);
                  setVerifiedOnlyManual(false);
                }}
                className="inline-flex min-h-[44px] items-center justify-center px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition shadow-sm"
              >
                Browse all listings
              </button>
              <Link
                to={user ? "/create-listing" : "/login?next=/create-listing"}
                className="inline-flex min-h-[44px] items-center justify-center px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                {user ? "Post a listing" : "Sign in to post"}
              </Link>
            </div>
          </div>
        )}

        {!loading && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((card, index) => {
            const categoryColors: Record<Category, string> = {
              all: "bg-slate-100 text-slate-700",
              produce: "bg-orange-50 text-orange-700",
              livestock: "bg-rose-50 text-rose-700",
              inputs: "bg-blue-50 text-blue-700",
              service: "bg-amber-50 text-amber-700",
            };
            const badgeColor = categoryColors[card.category] || categoryColors.produce;

            return (
              <div
                key={card.id}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg fade-up"
                style={{ animationDelay: `${Math.min(index * 40, 360)}ms` }}
              >
                <div className="relative aspect-[4/3] bg-slate-100">
                  {card.image ? (
                    <img
                      src={card.image}
                      alt={card.title}
                      onError={handleImageError}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400 text-sm font-medium">
                      No image available
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />

                  <div className="absolute top-3 left-3 inline-flex items-center gap-2 flex-wrap max-w-[calc(100%-1.5rem)]">
                    {card.isDemo && (
                      <span className="rounded-full bg-slate-900/80 text-white text-[11px] font-semibold px-2.5 py-1 whitespace-nowrap">
                        Sample listing
                      </span>
                    )}
                    {card.boosted && (
                      <span className="rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold px-2.5 py-1 whitespace-nowrap">
                        Boosted
                      </span>
                    )}
                    {card.verified && (
                      <span className="rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold px-2.5 py-1 whitespace-nowrap">
                        Verified
                      </span>
                    )}
                  </div>

                  {card.priceLabel && (
                    <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-emerald-700">
                      {card.priceLabel}
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
                    <span className={`rounded-full px-3 py-1 ${badgeColor}`}>
                      {card.typeLabel}
                    </span>
                    {card.paid && <span className="text-emerald-600">Priority</span>}
                  </div>

                  <h3 className="text-lg font-semibold text-slate-900 line-clamp-2 leading-tight">
                    {card.title}
                  </h3>

                  <p className="text-sm text-slate-600 line-clamp-2">
                    {card.description || "No description provided."}
                  </p>

                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-500 font-medium">
                      Location: {card.locationLabel || "Location pending"}
                    </p>
                    {(card.ownerResponseTime || card.ownerLastActive) && (
                      <p className="mt-1 text-xs text-slate-500">
                        {[card.ownerResponseTime, card.ownerLastActive].filter(Boolean).join(" - ")}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Link
                      to={user ? `/listings/${card.id}` : "/login"}
                      className="flex-1 min-h-[44px] inline-flex items-center justify-center text-center rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
                    >
                      View details
                    </Link>
                    {card.contact && (
                      user ? (
                        <a
                          href={`tel:${formatPhoneForUri(card.contact)}`}
                          className="flex-1 min-h-[44px] inline-flex items-center justify-center text-center rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Call
                        </a>
                      ) : (
                        <Link
                          to="/login"
                          className="flex-1 min-h-[44px] inline-flex items-center justify-center text-center rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Call
                        </Link>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            Showing {filtered.length} of {cards.length} listings
          </div>
        )}

        <div className="mt-16 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50 p-8 shadow-sm">
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] items-center">
            <div>
              <h3 className="text-2xl font-serif font-semibold text-slate-900 mb-3">
                Looking to sell instead?
              </h3>
              <p className="text-slate-600">
                Find buyers actively looking for what you offer. Browse requests from customers across Kenya who need your products or services.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:justify-end">
              <Link
                to="/request"
                className="inline-flex justify-center items-center rounded-xl bg-slate-900 px-6 py-3 text-white font-semibold hover:bg-slate-800 transition"
              >
                View buy requests
              </Link>
              <Link
                to={user ? "/create-listing" : "/login?next=/create-listing"}
                className="inline-flex justify-center items-center rounded-xl border border-slate-300 px-6 py-3 text-slate-700 font-semibold hover:bg-white transition"
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
