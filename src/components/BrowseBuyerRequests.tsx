import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, TrendingUp, AlertCircle, Loader, Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../config/api";
import { kenyaCounties } from "../data/kenyaCounties";

interface BuyerRequest {
  _id: string;
  title: string;
  description: string;
  category: "produce" | "service" | "inputs";
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
}

// Use all 47 Kenyan counties from data source
const COUNTIES = ["All Counties", ...kenyaCounties.map(c => c.name)];

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
  inputs: "Farm Inputs",
  service: "Services",
};

const CATEGORY_PILL_STYLES: Record<string, string> = {
  produce: "bg-orange-100 text-orange-800",
  inputs: "bg-sky-100 text-sky-800",
  service: "bg-emerald-100 text-emerald-800",
};

export const BrowseBuyerRequests: React.FC<BrowseBuyerRequestsProps> = ({
  onSelectRequest,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    category: "",
    county: "All Counties",
    urgency: "",
  });

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0, page: 1 });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "12");
      params.append("status", "active"); // Only show active requests, not fulfilled
      if (filters.category) params.append("category", filters.category);
      if (filters.county !== "All Counties")
        params.append("county", filters.county);
      if (filters.urgency) params.append("urgency", filters.urgency);

      const response = await fetch(
        `${API_BASE_URL}/buyer-requests?${params}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch buyer requests: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
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
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching buyer requests");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchRequests();
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
    return `${budget.currency} ${budget.min.toLocaleString()} - ${budget.max.toLocaleString()}`;
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

  return (
    <div className=\"min-h-screen bg-slate-50 text-slate-900\">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Manrope:wght@400;600;700&display=swap');
        :root {
          --ink: #0f172a;
          --muted: #64748b;
          --accent: #0f766e;
          --accent-soft: #ccfbf1;
          --sun: #fbbf24;
          --sand: #fef3c7;
        }
        .buy-requests-shell {
          font-family: \"Manrope\", \"Segoe UI\", \"Tahoma\", sans-serif;
        }
        .buy-hero-title {
          font-family: \"DM Serif Display\", \"Georgia\", serif;
        }
        .fade-rise {
          animation: fadeRise 0.7s ease both;
        }
        @keyframes fadeRise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className=\"relative overflow-hidden buy-requests-shell\">
        <div className=\"absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl\" />
        <div className=\"absolute -bottom-16 right-0 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl\" />

        <div className=\"max-w-6xl mx-auto px-4 pt-12 pb-8\">
          <div className=\"grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-center\">
            <div className=\"space-y-4 fade-rise\">
              <p className=\"text-xs uppercase tracking-[0.3em] text-emerald-700 font-semibold\">
                Agrisoko Buy Requests
              </p>
              <h1 className=\"buy-hero-title text-4xl md:text-5xl text-slate-900\">
                Connect with buyers who are ready to purchase now
              </h1>
              <p className=\"text-base text-slate-600 max-w-xl\">
                Scan real demand, reply fast, and win repeat business. Filter by county, urgency,
                or category to find the right match today.
              </p>
              <div className=\"flex flex-wrap gap-3\">
                <button
                  onClick={() =>
                    navigate(user ? \"/request/new\" : \"/login?next=/request/new\")
                  }
                  className=\"inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition\"
                >
                  <Plus size={18} />
                  Post a Request
                </button>
                <Link
                  to=\"/browse\"
                  className=\"inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition\"
                >
                  Browse Listings
                </Link>
              </div>
            </div>

            <div className=\"grid gap-4 sm:grid-cols-2 fade-rise\">
              <div className=\"rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm\">
                <p className=\"text-xs text-slate-500 uppercase tracking-wider\">Active requests</p>
                <p className=\"text-2xl font-semibold text-slate-900\">{pagination.total}</p>
                <p className=\"text-xs text-slate-500\">Across Kenya</p>
              </div>
              <div className=\"rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm\">
                <p className=\"text-xs text-slate-500 uppercase tracking-wider\">Urgent this week</p>
                <p className=\"text-2xl font-semibold text-slate-900\">
                  {requests.filter((req) => req.urgency === \"high\").length}
                </p>
                <p className=\"text-xs text-slate-500\">Ready to close fast</p>
              </div>
              <div className=\"rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:col-span-2\">
                <p className=\"text-xs text-slate-500 uppercase tracking-wider\">Your filter focus</p>
                <p className=\"text-sm text-slate-700\">
                  {activeFilters.length ? activeFilters.join(\" - \") : \"All categories, all counties, all urgency\"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className=\"max-w-6xl mx-auto px-4 pb-16\">
        <div className=\"rounded-3xl border border-slate-200 bg-white p-6 shadow-sm -mt-6 relative z-10\">
          <div className=\"grid grid-cols-1 md:grid-cols-4 gap-4 items-end\">
            <div>
              <label className=\"block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2\">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  handleFilterChange(\"category\", e.target.value)
                }
                className=\"w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200\"
              >
                <option value=\"\">All Categories</option>
                <option value=\"produce\">Agricultural Produce</option>
                <option value=\"inputs\">Farm Inputs</option>
                <option value=\"service\">Agricultural Services</option>
              </select>
            </div>

            <div>
              <label className=\"block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2\">
                County
              </label>
              <select
                value={filters.county}
                onChange={(e) =>
                  handleFilterChange(\"county\", e.target.value)
                }
                className=\"w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200\"
              >
                {COUNTIES.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className=\"block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2\">
                Urgency
              </label>
              <select
                value={filters.urgency}
                onChange={(e) =>
                  handleFilterChange(\"urgency\", e.target.value)
                }
                className=\"w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200\"
              >
                <option value=\"\">All Urgency Levels</option>
                <option value=\"low\">Low - Can Wait</option>
                <option value=\"medium\">Medium - Within a Week</option>
                <option value=\"high\">High - Urgent</option>
              </select>
            </div>

            <div className=\"rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3\">
              <p className=\"text-xs uppercase tracking-widest text-slate-500\">Showing</p>
              <p className=\"text-lg font-semibold text-slate-900\">{requests.length} on this page</p>
              <p className=\"text-xs text-slate-500\">{pagination.total} total active</p>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className=\"mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600\">
              <span className=\"font-semibold uppercase tracking-widest text-slate-400\">Filters</span>
              {activeFilters.map((filter) => (
                <span
                  key={filter}
                  className=\"rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-emerald-700 font-semibold\"
                >
                  {filter}
                </span>
              ))}
              <button
                type=\"button\"
                onClick={() => {
                  setFilters({ category: \"\", county: \"All Counties\", urgency: \"\" });
                  setPage(1);
                }}
                className=\"text-emerald-700 font-semibold hover:text-emerald-800\"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className=\"mb-6 mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2\">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className=\"flex justify-center items-center py-16\">
            <Loader className=\"animate-spin text-emerald-600\" size={40} />
          </div>
        ) : requests.length === 0 ? (
          <div className=\"text-center py-16\">
            <p className=\"text-slate-600 text-lg\">
              No buyer requests found matching your filters.
            </p>
            <p className=\"text-slate-500\">
              Try adjusting your filters or check back later.
            </p>
          </div>
        ) : !Array.isArray(requests) ? (
          <div className=\"text-center py-16\">
            <p className=\"text-red-600 text-lg\">
              Error: Invalid data format received from server
            </p>
            <p className=\"text-slate-500\">
              Please refresh the page or contact support
            </p>
          </div>
        ) : (
          <>
            <div className=\"mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10\">
              {requests.map((request) => (
                <div
                  key={request._id}
                  onClick={() => onSelectRequest?.(request)}
                  className=\"group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition overflow-hidden cursor-pointer\"
                >
                  <div className=\"bg-gradient-to-r from-emerald-50 via-white to-amber-50 p-4 border-b border-slate-200\">
                    <div className=\"flex items-start justify-between gap-2 mb-2\">
                      <div className=\"flex gap-2 flex-wrap\">
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
                    <h3 className=\"text-lg font-bold text-slate-900 line-clamp-2\">
                      {request.title}
                    </h3>
                  </div>

                  <div className=\"p-4 space-y-4\">
                    <p className=\"text-slate-600 text-sm line-clamp-2\">
                      {request.description}
                    </p>

                    {request.location && (
                      <div className=\"flex items-center gap-2 text-slate-700\">
                        <MapPin size={16} className=\"text-emerald-600 flex-shrink-0\" />
                        <span className=\"text-sm font-medium\">
                          {request.location.county}
                          {request.location.constituency &&
                            `, ${request.location.constituency}`}
                        </span>
                      </div>
                    )}

                    <div className=\"rounded-2xl bg-slate-50 p-3 space-y-2\">
                      {request.quantity && (
                        <div className=\"flex justify-between text-sm\">
                          <span className=\"text-slate-500\">Quantity</span>
                          <span className=\"font-semibold text-slate-900\">
                            {request.quantity} {request.unit}
                          </span>
                        </div>
                      )}
                      <div className=\"flex justify-between text-sm\">
                        <span className=\"text-slate-500\">Budget</span>
                        <span className=\"font-semibold text-emerald-700\">
                          {formatBudget(request.budget)}
                        </span>
                      </div>
                    </div>

                    <div className=\"flex items-center gap-2 pt-2 border-t border-slate-200\">
                      <div className=\"w-9 h-9 bg-emerald-200 rounded-full flex items-center justify-center text-sm font-bold text-emerald-800\">
                        {(request.userId && request.userId.fullName?.charAt(0)) || \"U\"}
                      </div>
                      <div className=\"flex-1\">
                        <p className=\"text-sm font-medium text-slate-900\">
                          {request.userId?.fullName || \"Anonymous\"}
                        </p>
                        <p className=\"text-xs text-slate-500\">
                          Posted {formatDate(request.createdAt)}
                        </p>
                      </div>
                      {request.userId?.ratings && typeof request.userId.ratings === 'number' && (
                        <div className=\"flex items-center gap-1\">
                          <TrendingUp size={14} className=\"text-amber-500\" />
                          <span className=\"text-sm font-semibold\">
                            {request.userId.ratings.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className=\"bg-emerald-50 px-4 py-3 border-t border-slate-200\">
                    <Link
                      to={`/request/${request._id}`}
                      state={{ request }}
                      className=\"block text-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition text-sm\"
                      aria-label={`View details and reply to ${request.title}`}
                    >
                      View Details and Reply
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className=\"flex justify-center items-center gap-2\">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className=\"px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-100 transition\"
                >
                  Previous
                </button>
                <span className=\"text-slate-700 font-medium\">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                  disabled={page === pagination.pages}
                  className=\"px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-100 transition\"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        <div className=\"mt-16 p-8 rounded-3xl bg-gradient-to-r from-white via-emerald-50 to-amber-50 border border-emerald-100\">
          <div className=\"max-w-4xl mx-auto text-center\">
            <h3 className=\"text-2xl font-bold text-slate-900 mb-3\">Looking to Buy Instead?</h3>
            <p className=\"text-slate-600 mb-6\">
              Browse thousands of products and services from verified sellers across Kenya. Find exactly what you need with direct connections to farmers and producers.
            </p>
            <div className=\"flex flex-col sm:flex-row gap-4 justify-center\">
              <Link
                to=\"/browse\"
                className=\"inline-flex justify-center items-center px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition\"
              >
                Browse Listings
              </Link>
              <Link
                to={user ? \"/create-listing\" : \"/login?next=/create-listing\"}
                className=\"inline-flex justify-center items-center px-6 py-3 rounded-xl border-2 border-emerald-600 text-emerald-700 font-semibold hover:bg-emerald-50 transition\"
              >
                Post a Buy Request
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default BrowseBuyerRequests;
