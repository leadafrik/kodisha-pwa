import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, TrendingUp, AlertCircle, Plus, Clock3 } from "lucide-react";
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

// Use all 47 Kenyan counties from data source
const COUNTIES = ["All Counties", ...kenyaCounties.map(c => c.name)];
const REQUEST_CACHE_KEY = "agrisoko_buyer_requests_cache_v1";

const URGENCY_COLORS: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

const URGENCY_LABELS: Record<string, string> = {
  low: "Can Wait",
  medium: "Within a Week",
  high: "Urgent",
};

const CATEGORY_LABELS: Record<string, string> = {
  produce: "Produce",
  livestock: "Livestock",
  inputs: "Inputs",
  service: "Services",
};

const CATEGORY_PILL_STYLES: Record<string, string> = {
  produce: "bg-orange-100 text-orange-800",
  livestock: "bg-[#e6f0e0] text-[#586f58]",
  inputs: "bg-sky-100 text-sky-800",
  service: "bg-emerald-100 text-emerald-800",
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

  const sortedRequests = [...requests].sort((a, b) => {
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

  const topRequests = sortedRequests.slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Manrope:wght@400;600;700&display=swap');
        :root {
          --ink: #0f172a;
          --muted: #64748b;
          --accent: #586f58;
          --accent-soft: #edf4e9;
        }
        .buy-requests-shell {
          font-family: "Manrope", "Segoe UI", "Tahoma", sans-serif;
        }
        .buy-hero-title {
          font-family: "DM Serif Display", "Georgia", serif;
        }
        .fade-rise {
          animation: fadeRise 0.7s ease both;
        }
        @keyframes fadeRise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="relative overflow-hidden buy-requests-shell">
        <div className="absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-[#d8e8d4]/55 blur-3xl" />
        <div className="absolute -bottom-16 right-0 h-72 w-72 rounded-full bg-[#e8f0e3]/75 blur-3xl" />

        <div className="max-w-6xl mx-auto px-4 pt-10 md:pt-12 pb-8">
          {!user && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-white/90 px-4 py-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Sign in to reply and contact buyers
                  </p>
                  <p className="text-xs text-slate-500">
                    Buy request details stay public. Sign in only when you want to respond.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-lg bg-[#6b856b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#586f58]"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-center">
            <div className="space-y-4 fade-rise">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-700 font-semibold">
                {isB2B ? "Agrisoko B2B Demand Board" : "Agrisoko Demand Board"}
              </p>
              <h1 className="buy-hero-title text-3xl sm:text-4xl md:text-5xl text-slate-900">
                {isB2B ? "Institutional demand from active buyers" : "Find buyers ready to buy"}
              </h1>
              <p className="text-base text-slate-600 max-w-xl">
                {isB2B
                  ? "Demand-first procurement for restaurants, schools, processors, and distributors."
                  : "Browse live demand and respond quickly."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
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
                  className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-xl bg-[#6b856b] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#586f58] transition"
                >
                  <Plus size={18} />
                  {isB2B ? "Post B2B Demand" : "Post Demand"}
                </button>
                <Link
                  to="/browse"
                  className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-xl border border-[#c9d7c4] bg-white px-5 py-3 text-sm font-semibold text-[#586f58] hover:bg-[#f2f7ef] transition"
                >
                  Browse Listings
                </Link>
              </div>
            </div>

            <div className="fade-rise rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Active</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <p className="text-lg font-semibold text-slate-900">{pagination.total}</p>
                    <p className="text-[11px] text-slate-500">Nationwide</p>
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Urgent</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <p className="text-lg font-semibold text-slate-900">
                      {requests.filter((req) => req.urgency === "high").length}
                    </p>
                    <p className="text-[11px] text-slate-500">High priority</p>
                  </div>
                </div>
                <div className="col-span-2 rounded-xl bg-slate-50 px-3 py-2 sm:col-span-1">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Focus</p>
                  <p className="mt-1 truncate text-sm font-medium text-slate-700">
                    {activeFilters.length ? activeFilters.join(" - ") : "All requests"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm -mt-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  handleFilterChange("category", e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <option value="">All Categories</option>
                <option value="produce">Produce</option>
                <option value="livestock">Livestock</option>
                <option value="inputs">Inputs</option>
                <option value="service">Services</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                County
              </label>
              <select
                value={filters.county}
                onChange={(e) =>
                  handleFilterChange("county", e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                {COUNTIES.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Urgency
              </label>
              <select
                value={filters.urgency}
                onChange={(e) =>
                  handleFilterChange("urgency", e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <option value="">All Urgency Levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Sort
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <option value="recommended">Top picks</option>
                <option value="newest">Newest</option>
                <option value="urgent">Urgent first</option>
                <option value="budget_high">Highest budget</option>
              </select>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:block">
              <div className="flex items-center justify-between gap-3 md:block">
                <p className="text-xs uppercase tracking-widest text-slate-500">Showing</p>
                <p className="text-sm font-semibold text-slate-900 md:mt-1 md:text-lg">
                  {requests.length} on this page
                </p>
              </div>
              <p className="mt-1 text-xs text-slate-500">{pagination.total} total active</p>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold uppercase tracking-widest text-slate-400">Filters</span>
              {activeFilters.map((filter) => (
                <span
                  key={filter}
                  className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-emerald-700 font-semibold"
                >
                  {filter}
                </span>
              ))}
              <button
                type="button"
                onClick={() => {
                  setFilters({ category: "", county: "All Counties", urgency: "" });
                  setPage(1);
                }}
                className="text-emerald-700 font-semibold hover:text-emerald-800"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex flex-wrap items-center gap-3">
            <AlertCircle size={20} />
            <span className="flex-1">
              {error}
              {cachedAt && (
                <span className="block text-xs text-red-600 mt-1">
                  Cached at: {new Date(cachedAt).toLocaleString("en-KE")}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={fetchRequests}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {bulkAccessRequired && isB2B && (
          <div className="mb-6 rounded-2xl border border-[#c9d7c4] bg-[#edf4e9] px-4 py-4 text-[#4d6250]">
            <p className="text-sm font-semibold">
              Bulk demand access requires approval first.
            </p>
            <p className="mt-1 text-xs">
              Apply as a bulk buyer or seller, then return after admin approval.
            </p>
            <div className="mt-3">
              <Link
                to={user ? "/bulk" : "/login?mode=signup&next=/bulk"}
                className="inline-flex rounded-lg bg-[#6b856b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#586f58]"
              >
                Open bulk application
              </Link>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`request-skeleton-${index}`}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="h-20 animate-pulse bg-slate-100" />
                <div className="space-y-4 p-4">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
                  <div className="rounded-2xl bg-slate-50 p-3 space-y-2">
                    <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-10 flex-1 animate-pulse rounded-xl bg-slate-100" />
                    <div className="h-10 flex-1 animate-pulse rounded-xl bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-600 text-lg">No matching requests.</p>
            <p className="text-slate-500">Try different filters.</p>
          </div>
        ) : !Array.isArray(requests) ? (
          <div className="text-center py-16">
            <p className="text-red-600 text-lg">
              Error: Invalid data format received from server
            </p>
            <p className="text-slate-500">
              Please refresh the page or contact support
            </p>
          </div>
        ) : (
          <>
            {topRequests.length > 0 && (
              <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      Top requests
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">
                      Best demand opportunities right now
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 sm:text-sm">
                    Ranked by urgency, detail, budget, and freshness.
                  </p>
                </div>

                <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4">
                  {topRequests.map((request) => (
                    <Link
                      key={`top-request-${request._id}`}
                      to={`/request/${request._id}`}
                      state={{ request }}
                      className="min-w-[250px] max-w-[280px] flex-1 snap-start rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md md:min-w-0 md:max-w-none"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${CATEGORY_PILL_STYLES[request.category]}`}>
                          {CATEGORY_LABELS[request.category]}
                        </span>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${URGENCY_COLORS[request.urgency]}`}>
                          {URGENCY_LABELS[request.urgency]}
                        </span>
                      </div>

                      <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-slate-900">
                        {request.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {request.description}
                      </p>

                      <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp size={13} className="text-[#6b856b]" />
                          {formatBudget(request.budget)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={13} className="text-slate-400" />
                          {request.location.county}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 size={13} className="text-slate-400" />
                          {formatDate(request.createdAt)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {sortedRequests.map((request) => (
                <div
                  key={request._id}
                  onClick={() => onSelectRequest?.(request)}
                  className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition overflow-hidden cursor-pointer"
                >
                  <div className="bg-[#f3f8f0] p-4 border-b border-slate-200">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex gap-2 flex-wrap">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full capitalize ${CATEGORY_PILL_STYLES[request.category]}`}>
                          {CATEGORY_LABELS[request.category]}
                        </span>
                        <span
                          className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${URGENCY_COLORS[request.urgency]}`}
                        >
                          {URGENCY_LABELS[request.urgency]}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-2">
                      {request.title}
                    </h3>
                  </div>

                  <div className="p-4 space-y-4">
                    <p className="text-slate-600 text-sm line-clamp-2">
                      {request.description}
                    </p>

                    {request.location && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <MapPin size={16} className="text-emerald-600 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          {request.location.county}
                          {request.location.constituency &&
                            `, ${request.location.constituency}`}
                        </span>
                      </div>
                    )}

                    <div className="rounded-2xl bg-slate-50 p-3 space-y-2">
                      {request.quantity && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Quantity</span>
                          <span className="font-semibold text-slate-900">
                            {request.quantity} {request.unit}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Budget</span>
                        <span className="font-semibold text-emerald-700">
                          {formatBudget(request.budget)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      <div className="w-9 h-9 bg-emerald-200 rounded-full flex items-center justify-center text-sm font-bold text-emerald-800">
                        {(request.userId && request.userId.fullName?.charAt(0)) || "U"}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {request.userId?.fullName || "Anonymous"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Posted {formatDate(request.createdAt)}
                        </p>
                      </div>
                      {request.userId?.ratings && typeof request.userId.ratings === 'number' && (
                        <div className="flex items-center gap-1">
                          <TrendingUp size={14} className="text-[#6b856b]" />
                          <span className="text-sm font-semibold">
                            {request.userId.ratings.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#edf4e9] px-4 py-3 border-t border-slate-200">
                    <Link
                      to={`/request/${request._id}`}
                      state={{ request }}
                      className="block text-center bg-[#6b856b] hover:bg-[#586f58] text-white font-semibold py-2 rounded-lg transition text-sm"
                      aria-label={`View details for ${request.title}`}
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-100 transition"
                >
                  Previous
                </button>
                <span className="text-slate-700 font-medium">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                  disabled={page === pagination.pages}
                  className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-100 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        <div className="mt-16 rounded-3xl border border-[#d6e2d1] bg-[#f7faf5] p-8">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              {isB2B ? "Need open marketplace offers instead?" : "Need products instead?"}
            </h3>
            <p className="text-slate-600 mb-6">
              {isB2B
                ? "Switch to live listings and contact verified sellers directly."
                : "Switch to marketplace listings and contact sellers directly."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/browse"
                className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-[#6b856b] text-white font-semibold transition hover:bg-[#586f58]"
              >
                Browse Listings
              </Link>
              <Link
                to={
                  user
                    ? "/create-listing?compact=1"
                    : `/login?mode=signup&next=${encodeURIComponent("/create-listing?compact=1")}`
                }
                className="inline-flex justify-center items-center px-6 py-3 rounded-xl border-2 border-[#6b856b] text-[#586f58] font-semibold transition hover:bg-[#f2f7ef]"
              >
                Create Listing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default BrowseBuyerRequests;
