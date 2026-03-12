import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Clock3,
  Filter,
  MapPin,
  Plus,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL, ensureValidAccessToken } from "../config/api";
import { kenyaCounties } from "../data/kenyaCounties";

interface BuyerRequest {
  _id: string;
  title: string;
  description: string;
  category: "produce" | "livestock" | "service" | "inputs";
  productType?: string;
  budget?: { min: number; max: number; currency: string };
  quantity?: number;
  unit?: string;
  location: { county: string; constituency?: string; ward?: string };
  urgency: "low" | "medium" | "high";
  status: "active" | "fulfilled" | "closed";
  userId: {
    _id: string;
    fullName: string;
    ratings?: number;
  };
  createdAt: string;
  expiresAt?: string;
}

interface BrowseBuyerRequestsProps {
  onSelectRequest?: (request: BuyerRequest) => void;
  marketType?: "standard" | "b2b";
}

interface BuyerRequestCache {
  data: BuyerRequest[];
  pagination: { pages: number; total: number; page: number };
  savedAt: string;
}

type SortOption = "recommended" | "newest" | "urgent" | "budget_high";

const COUNTIES = ["All Counties", ...kenyaCounties.map((c) => c.name)];
const REQUEST_CACHE_KEY = "agrisoko_buyer_requests_cache_v1";

const URGENCY_COLORS: Record<string, string> = {
  low: "bg-sky-100 text-sky-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

const URGENCY_LABELS: Record<string, string> = {
  low: "Can wait",
  medium: "Within a week",
  high: "Urgent",
};

const CATEGORY_LABELS: Record<string, string> = {
  produce: "Produce",
  livestock: "Livestock",
  inputs: "Inputs",
  service: "Services",
};

const CATEGORY_PILL_STYLES: Record<string, string> = {
  produce: "bg-[#FDF5F3] text-[#A0452E]",
  livestock: "bg-forest-100 text-forest-700",
  inputs: "bg-sky-100 text-sky-800",
  service: "bg-stone-100 text-stone-700",
};

const getBudgetScore = (request: BuyerRequest) => {
  const max = typeof request.budget?.max === "number" ? request.budget.max : 0;
  const min = typeof request.budget?.min === "number" ? request.budget.min : 0;
  return Math.max(max, min);
};

const getUrgencyScore = (request: BuyerRequest) => {
  if (request.urgency === "high") return 3;
  if (request.urgency === "medium") return 2;
  return 1;
};

const getRecencyScore = (request: BuyerRequest) => {
  const createdAt = new Date(request.createdAt).getTime();
  if (!Number.isFinite(createdAt)) return 0;
  const ageHours = (Date.now() - createdAt) / (1000 * 60 * 60);
  if (ageHours <= 24) return 4;
  if (ageHours <= 72) return 3;
  if (ageHours <= 24 * 7) return 2;
  return 1;
};

const getRequestScore = (request: BuyerRequest) => {
  const urgencyScore = getUrgencyScore(request) * 4;
  const budgetScore = Math.min(getBudgetScore(request), 500000) / 100000;
  const detailScore =
    (request.productType ? 1 : 0) +
    (request.quantity ? 1 : 0) +
    (request.location?.constituency ? 0.5 : 0);
  return urgencyScore + budgetScore + getRecencyScore(request) + detailScore;
};

export const BrowseBuyerRequests: React.FC<BrowseBuyerRequestsProps> = ({
  onSelectRequest,
  marketType = "standard",
}) => {
  const activeMarketType = marketType === "b2b" ? "b2b" : "standard";
  const isB2B = activeMarketType === "b2b";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bulkAccessRequired, setBulkAccessRequired] = useState(false);

  const [filters, setFilters] = useState({
    category: "",
    county: "All Counties",
    urgency: "",
  });
  const [sortBy, setSortBy] = useState<SortOption>("recommended");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0, page: 1 });
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  const getCachedRequests = (): BuyerRequestCache | null => {
    try {
      const raw = localStorage.getItem(REQUEST_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed?.data)) return null;
      if (!parsed?.pagination || typeof parsed.pagination !== "object") return null;
      return parsed as BuyerRequestCache;
    } catch {
      return null;
    }
  };

  const setCachedRequests = (
    items: BuyerRequest[],
    pageData: { pages: number; total: number; page: number }
  ) => {
    const payload: BuyerRequestCache = {
      data: items,
      pagination: pageData,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(REQUEST_CACHE_KEY, JSON.stringify(payload));
    setCachedAt(payload.savedAt);
  };

  const applyCachedRequests = (cached: BuyerRequestCache, message: string) => {
    setRequests(cached.data);
    setPagination(cached.pagination);
    setCachedAt(cached.savedAt);
    setError(message);
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    setBulkAccessRequired(false);

    const cached = getCachedRequests();

    if (!navigator.onLine) {
      if (cached) {
        applyCachedRequests(
          cached,
          "You are offline. Showing the last synced buy requests."
        );
      } else {
        setError("You are offline. Reconnect and try again.");
      }
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "12");
      params.append("status", "active"); // Only show active requests, not fulfilled
      params.append("marketType", activeMarketType);
      if (filters.category) params.append("category", filters.category);
      if (filters.county !== "All Counties")
        params.append("county", filters.county);
      if (filters.urgency) params.append("urgency", filters.urgency);

      const token = isB2B ? await ensureValidAccessToken() : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/buyer-requests?${params}`,
        {
          headers,
          credentials: "include",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (isB2B && (response.status === 401 || response.status === 403)) {
          setBulkAccessRequired(true);
        }
        throw new Error(
          data?.message ||
            `Failed to fetch buyer requests: ${response.status} ${response.statusText}`
        );
      }

      // Validate API response structure
      if (!data.success) {
        throw new Error(data.message || "API returned unsuccessful response");
      }
      
      if (!Array.isArray(data.data)) {
        throw new Error("Invalid response data: expected array of requests");
      }
      
      if (!data.pagination || typeof data.pagination !== 'object') {
        throw new Error("Invalid response structure: missing or malformed pagination");
      }
      
      setRequests(data.data);
      setPagination(data.pagination || { total: 0, pages: 1, page: 1 });
      setCachedRequests(data.data, data.pagination || { total: 0, pages: 1, page: 1 });
    } catch (err: any) {
      const message = err.message || "An error occurred while fetching buyer requests";
      if (cached) {
        applyCachedRequests(
          cached,
          "Live updates failed. Showing saved buy requests."
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [activeMarketType, filters, isB2B, page]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    const handleOnline = () => {
      fetchRequests();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [fetchRequests]);

  const handleFilterChange = (
    filterName: string,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
    setPage(1);
  };

  const formatBudget = (budget?: { min: number; max: number; currency: string }) => {
    if (!budget) return "Negotiable";

    const currency = budget.currency || "KES";
    const hasMin = typeof budget.min === "number" && Number.isFinite(budget.min);
    const hasMax = typeof budget.max === "number" && Number.isFinite(budget.max);

    if (hasMin && hasMax) {
      return `${currency} ${budget.min.toLocaleString()} - ${budget.max.toLocaleString()}`;
    }

    if (hasMin) {
      return `From ${currency} ${budget.min.toLocaleString()}`;
    }

    if (hasMax) {
      return `Up to ${currency} ${budget.max.toLocaleString()}`;
    }

    return "Negotiable";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const activeFilters: string[] = [];
  if (filters.category) {
    activeFilters.push(`Category: ${CATEGORY_LABELS[filters.category] || filters.category}`);
  }
  if (filters.county !== "All Counties") {
    activeFilters.push(`County: ${filters.county}`);
  }
  if (filters.urgency) {
    activeFilters.push(`Urgency: ${URGENCY_LABELS[filters.urgency] || filters.urgency}`);
  }

  const focusLabel = activeFilters.length ? activeFilters.join(" | ") : "All requests";

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      if (sortBy === "urgent") {
        const urgencyDiff = getUrgencyScore(b) - getUrgencyScore(a);
        if (urgencyDiff !== 0) return urgencyDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      if (sortBy === "budget_high") {
        const budgetDiff = getBudgetScore(b) - getBudgetScore(a);
        if (budgetDiff !== 0) return budgetDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      const scoreDiff = getRequestScore(b) - getRequestScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [requests, sortBy]);

  const topRequests = useMemo(
    () => sortedRequests.slice(0, Math.min(4, sortedRequests.length)),
    [sortedRequests]
  );

  const urgentCount = requests.filter((req) => req.urgency === "high").length;
  const countyCount = new Set(
    requests.map((req) => (req.location?.county || "").trim().toLowerCase()).filter(Boolean)
  ).size;
  const showTopRequests = sortedRequests.length > 4;
  const displayRequests = sortedRequests;

  const clearFilters = () => {
    setFilters({ category: "", county: "All Counties", urgency: "" });
    setPage(1);
  };

  return (
    <div className="ui-page-shell">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-[#F3C9BE]/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-0 h-72 w-72 rounded-full bg-[#FFF0C8]/50 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 top-20 h-72 w-72 rounded-full bg-white/80 blur-3xl" />

        <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 md:py-14">
          {!user && (
            <div className="ui-card px-5 py-4 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900">
                    Sign in only when you are ready to reply to buyers
                  </p>
                  <p className="text-xs text-stone-500">
                    Demand details stay public. Sign in for direct replies and contact access.
                  </p>
                </div>
                <Link to="/login" className="ui-btn-primary px-4 py-2 text-sm">
                  Sign In
                </Link>
              </div>
            </div>
          )}

          <section className="ui-hero-panel p-5 md:p-7">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div>
                <p className="ui-section-kicker">
                  {isB2B ? "Agrisoko B2B demand board" : "Agrisoko demand board"}
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 md:text-4xl">
                  {isB2B ? "Institutional demand from active buyers" : "Find buyers ready to buy across Kenya"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 md:text-base">
                  {isB2B
                    ? "Demand-first procurement for restaurants, schools, processors, and distributors that need reliable supply."
                    : "Browse active demand, respond quickly, and close direct deals without extra broker friction."}
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() =>
                      navigate(
                        user
                          ? `/request/new?marketType=${activeMarketType}`
                          : `/login?mode=signup&next=${encodeURIComponent(
                              `/request/new?marketType=${activeMarketType}`
                            )}`
                      )
                    }
                    className="ui-btn-primary gap-2 px-5 py-3 text-sm"
                  >
                    <Plus size={18} />
                    {isB2B ? "Post bulk demand" : "Post demand"}
                  </button>
                  <Link to="/browse" className="ui-btn-secondary px-5 py-3 text-sm">
                    Browse listings
                  </Link>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-stone-600">
                  <span className="ui-chip-soft">{pagination.total} active requests</span>
                  <span className="ui-chip-soft">{urgentCount} urgent</span>
                  <span className="ui-chip-soft">{countyCount || 1} counties active</span>
                </div>
              </div>

              <div className="ui-card-soft p-4 md:p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#A0452E]">
                  <TrendingUp className="h-4 w-4" />
                  Demand focus
                </div>
                <p className="mt-3 text-lg font-semibold text-stone-900">
                  Where buyers need supply now
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  Ranked by urgency, budget, request detail, and freshness so you can respond faster.
                </p>
                <div className="mt-4 space-y-3 text-sm text-stone-700">
                  <div className="flex items-center justify-between gap-3 border-b border-stone-200 pb-3">
                    <span className="text-stone-500">Current focus</span>
                    <span className="font-semibold text-stone-900">{focusLabel}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-stone-200 pb-3">
                    <span className="text-stone-500">Sort order</span>
                    <span className="font-semibold text-stone-900">
                      {sortBy === "recommended"
                        ? "Top picks"
                        : sortBy === "newest"
                          ? "Newest first"
                          : sortBy === "urgent"
                            ? "Urgent first"
                            : "Highest budget"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 rounded-2xl border border-[#F3C9BE] bg-white px-3 py-3 text-xs text-stone-600">
                    <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#A0452E]" />
                    Reply only when ready. Buyers can review your offer after you sign in and open the request.
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="ui-card p-4 md:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="ui-section-kicker">Filter and sort</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-stone-900">
                  Find the best demand to respond to
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Narrow by category, county, urgency, or budget priority.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-stone-200 bg-[#FAF7F2] px-3 py-1.5 text-xs font-semibold text-stone-700">
                <Filter className="h-4 w-4 text-[#A0452E]" />
                {requests.length} on this page | {pagination.total} total active
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div>
                <label className="ui-label">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                  className="ui-input"
                >
                  <option value="">All categories</option>
                  <option value="produce">Produce</option>
                  <option value="livestock">Livestock</option>
                  <option value="inputs">Inputs</option>
                  <option value="service">Services</option>
                </select>
              </div>

              <div>
                <label className="ui-label">County</label>
                <select
                  value={filters.county}
                  onChange={(e) => handleFilterChange("county", e.target.value)}
                  className="ui-input"
                >
                  {COUNTIES.map((county) => (
                    <option key={county} value={county}>
                      {county}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="ui-label">Urgency</label>
                <select
                  value={filters.urgency}
                  onChange={(e) => handleFilterChange("urgency", e.target.value)}
                  className="ui-input"
                >
                  <option value="">All urgency levels</option>
                  <option value="low">Can wait</option>
                  <option value="medium">Within a week</option>
                  <option value="high">Urgent</option>
                </select>
              </div>

              <div>
                <label className="ui-label">Sort</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="ui-input"
                >
                  <option value="recommended">Top picks</option>
                  <option value="newest">Newest</option>
                  <option value="urgent">Urgent first</option>
                  <option value="budget_high">Highest budget</option>
                </select>
              </div>

              <div className="flex items-end">
                <button type="button" onClick={clearFilters} className="ui-btn-ghost w-full">
                  Clear filters
                </button>
              </div>
            </div>

            {activeFilters.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {activeFilters.map((filter) => (
                  <span key={filter} className="ui-chip-soft">
                    {filter}
                  </span>
                ))}
              </div>
            )}
          </section>

          {error && (
            <div className="ui-card border-red-200 bg-red-50 px-4 py-4 text-red-700">
              <div className="flex flex-wrap items-start gap-3">
                <AlertCircle size={20} className="mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{error}</p>
                  {cachedAt && (
                    <p className="mt-1 text-xs text-red-600">
                      Cached at: {new Date(cachedAt).toLocaleString("en-KE")}
                    </p>
                  )}
                </div>
                <button type="button" onClick={fetchRequests} className="ui-btn-primary px-4 py-2 text-sm">
                  Retry
                </button>
              </div>
            </div>
          )}

          {bulkAccessRequired && isB2B && (
            <div className="ui-accent-panel px-4 py-4 text-stone-800">
              <p className="text-sm font-semibold">Bulk demand access requires approval first.</p>
              <p className="mt-1 text-xs text-stone-600">
                Apply as a bulk buyer or seller, then return after admin approval.
              </p>
              <div className="mt-3">
                <Link
                  to={user ? "/bulk" : "/login?mode=signup&next=/bulk"}
                  className="ui-btn-primary px-4 py-2 text-sm"
                >
                  Open bulk application
                </Link>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={`request-skeleton-${index}`} className="ui-card overflow-hidden">
                  <div className="h-24 animate-pulse bg-[#FAF7F2]" />
                  <div className="space-y-4 p-5">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-stone-100" />
                    <div className="h-4 w-full animate-pulse rounded bg-stone-100" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-stone-100" />
                    <div className="ui-card-soft space-y-2 p-3">
                      <div className="h-4 w-1/2 animate-pulse rounded bg-stone-100" />
                      <div className="h-4 w-2/3 animate-pulse rounded bg-stone-100" />
                    </div>
                    <div className="h-11 animate-pulse rounded-xl bg-stone-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="ui-card px-6 py-14 text-center">
              <p className="text-lg font-semibold text-stone-900">
                {activeFilters.length > 0 ? "No requests match these filters" : "No active requests yet"}
              </p>
              <p className="mt-2 text-sm text-stone-500">
                {activeFilters.length > 0
                  ? "Try a broader county, category, or urgency setting."
                  : "Check back soon or post demand to start the market."}
              </p>
            </div>
          ) : !Array.isArray(requests) ? (
            <div className="ui-card px-6 py-14 text-center">
              <p className="text-lg font-semibold text-red-700">
                Invalid data format received from the server
              </p>
              <p className="mt-2 text-sm text-stone-500">
                Refresh the page or contact support if the issue continues.
              </p>
            </div>
          ) : (
            <>
              {showTopRequests && (
                <section className="ui-card p-4 md:p-5">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="ui-section-kicker">Top requests</p>
                      <h2 className="mt-2 text-xl font-semibold tracking-tight text-stone-900">
                        Best demand opportunities right now
                      </h2>
                    </div>
                    <p className="text-sm text-stone-500">
                      Ranked by urgency, detail, budget, and freshness.
                    </p>
                  </div>

                  <div className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 xl:grid xl:grid-cols-4 xl:overflow-visible">
                    {topRequests.map((request) => (
                      <Link
                        key={`top-request-${request._id}`}
                        to={`/request/${request._id}`}
                        state={{ request }}
                        className="ui-card min-w-[260px] max-w-[300px] flex-1 p-4 transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(28,25,23,0.08)] xl:min-w-0 xl:max-w-none"
                      >
                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${CATEGORY_PILL_STYLES[request.category]}`}>
                            {CATEGORY_LABELS[request.category]}
                          </span>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${URGENCY_COLORS[request.urgency]}`}>
                            {URGENCY_LABELS[request.urgency]}
                          </span>
                        </div>
                        <h3 className="mt-3 line-clamp-2 text-base font-semibold text-stone-900">
                          {request.title}
                        </h3>
                        <p className="mt-2 line-clamp-3 text-sm text-stone-600">
                          {request.description}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-stone-700">
                          <span className="inline-flex items-center gap-1">
                            <TrendingUp size={14} className="text-[#A0452E]" />
                            {formatBudget(request.budget)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={14} className="text-stone-400" />
                            {request.location.county}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 size={14} className="text-stone-400" />
                            {formatDate(request.createdAt)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="ui-section-kicker">Demand buyers can respond to now</p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-stone-900">
                      Active requests across the marketplace
                    </h2>
                  </div>
                  <p className="text-sm text-stone-500">
                    {displayRequests.length} request{displayRequests.length === 1 ? "" : "s"} on this page
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {displayRequests.map((request) => (
                    <div
                      key={request._id}
                      className="ui-card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(28,25,23,0.08)]"
                    >
                      <div className="border-b border-stone-200 bg-[#FAF7F2] px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${CATEGORY_PILL_STYLES[request.category]}`}>
                            {CATEGORY_LABELS[request.category]}
                          </span>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${URGENCY_COLORS[request.urgency]}`}>
                            {URGENCY_LABELS[request.urgency]}
                          </span>
                        </div>
                        <h3 className="mt-3 line-clamp-2 text-xl font-semibold tracking-tight text-stone-900">
                          {request.title}
                        </h3>
                        {request.productType && (
                          <p className="mt-1 text-sm font-medium text-stone-600">
                            {request.productType}
                          </p>
                        )}
                      </div>

                      <div
                        className="flex h-full flex-col gap-4 px-5 py-5"
                        onClick={() => onSelectRequest?.(request)}
                      >
                        <p className="line-clamp-3 text-sm leading-relaxed text-stone-600">
                          {request.description}
                        </p>

                        <div className="flex items-start gap-2 text-sm text-stone-700">
                          <MapPin size={16} className="mt-0.5 flex-shrink-0 text-[#A0452E]" />
                          <span>
                            {request.location.county}
                            {request.location.constituency ? `, ${request.location.constituency}` : ""}
                            {request.location.ward ? `, ${request.location.ward}` : ""}
                          </span>
                        </div>

                        <div className="ui-card-soft space-y-2 p-3">
                          {request.quantity && (
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className="text-stone-500">Quantity</span>
                              <span className="font-semibold text-stone-900">
                                {request.quantity} {request.unit}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-stone-500">Budget</span>
                            <span className="font-semibold text-[#A0452E]">
                              {formatBudget(request.budget)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 border-t border-stone-200 pt-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAE9E4] text-sm font-semibold uppercase text-[#A0452E]">
                            {(request.userId?.fullName || "U").charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-stone-900">
                              {request.userId?.fullName || "Anonymous"}
                            </p>
                            <p className="text-xs text-stone-500">Posted {formatDate(request.createdAt)}</p>
                          </div>
                          {typeof request.userId?.ratings === "number" && (
                            <div className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700">
                              <TrendingUp size={13} className="text-[#A0452E]" />
                              {request.userId.ratings.toFixed(1)}
                            </div>
                          )}
                        </div>

                        <Link
                          to={`/request/${request._id}`}
                          state={{ request }}
                          className="ui-btn-primary mt-auto w-full justify-between px-4 py-3 text-sm"
                          aria-label={`View details for ${request.title}`}
                        >
                          View details
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {pagination.pages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="ui-btn-ghost px-4 py-2 text-sm"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-semibold text-stone-700">
                    Page {page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                    disabled={page === pagination.pages}
                    className="ui-btn-ghost px-4 py-2 text-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          <section className="overflow-hidden rounded-[2rem] border border-[#F3C9BE] bg-gradient-to-r from-[#A0452E] to-[#72281A] px-6 py-8 text-white shadow-[0_18px_40px_rgba(160,69,46,0.2)]">
            <div className="mx-auto flex max-w-5xl flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                  Need products instead?
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                  {isB2B ? "Switch to open marketplace supply" : "Browse live listings and contact sellers directly"}
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-white/80">
                  {isB2B
                    ? "Use open listings when you want to compare live supply before posting bulk procurement needs."
                    : "Move from demand to supply in one click, or post your own listing if you want buyers to come to you."}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/browse" className="ui-btn-secondary border-white/30 bg-white text-[#A0452E] hover:bg-[#FDF5F3]">
                  Browse listings
                </Link>
                <Link
                  to={
                    user
                      ? "/create-listing?compact=1"
                      : `/login?mode=signup&next=${encodeURIComponent("/create-listing?compact=1")}`
                  }
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/40 bg-transparent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Create listing
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};


export default BrowseBuyerRequests;
