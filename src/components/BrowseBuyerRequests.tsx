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
      if (filters.category) params.append("category", filters.category);
      if (filters.county !== "All Counties")
        params.append("county", filters.county);
      if (filters.urgency) params.append("urgency", filters.urgency);

      if (process.env.NODE_ENV === 'development') {
        console.log('[Dev] Fetching buyer requests:', { page, filters });
      }
      
      const response = await fetch(
        `${API_BASE_URL}/buyer-requests?${params}`
      );

      if (!response.ok) {
        const errorText = await response.text();
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Browse Buy Requests
            </h2>
            <p className="text-gray-600">
              See what buyers are looking for and connect with new customers
            </p>
          </div>
          <button
            onClick={() =>
              navigate(user ? "/request/new" : "/login?next=/request/new")
            }
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition whitespace-nowrap"
          >
            <Plus size={20} />
            Post a Request
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  handleFilterChange("category", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="produce">Agricultural Produce</option>
                <option value="inputs">Farm Inputs</option>
                <option value="service">Agricultural Services</option>
              </select>
            </div>

            {/* County Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                County
              </label>
              <select
                value={filters.county}
                onChange={(e) =>
                  handleFilterChange("county", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {COUNTIES.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </div>

            {/* Urgency Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency
              </label>
              <select
                value={filters.urgency}
                onChange={(e) =>
                  handleFilterChange("urgency", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Urgency Levels</option>
                <option value="low">Low - Can Wait</option>
                <option value="medium">Medium - Within a Week</option>
                <option value="high">High - Urgent</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <p className="text-sm text-gray-600">
                <span className="font-bold text-lg text-gray-900">
                  {pagination.total}
                </span>
                <br />
                active requests
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="animate-spin text-green-600" size={40} />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              No buyer requests found matching your filters.
            </p>
            <p className="text-gray-500">
              Try adjusting your filters or check back later!
            </p>
          </div>
        ) : !Array.isArray(requests) ? (
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">
              Error: Invalid data format received from server
            </p>
            <p className="text-gray-500">
              Please refresh the page or contact support
            </p>
          </div>
        ) : (
          <>
            {/* Request Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {requests.map((request) => (
                <div
                  key={request._id}
                  onClick={() => onSelectRequest?.(request)}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden cursor-pointer"
                >
                  {/* Header with Category & Urgency */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 border-b border-gray-200">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full capitalize">
                        {request.category === "produce"
                          ? "Produce"
                          : request.category === "inputs"
                          ? "Farm Inputs"
                          : "Services"}
                      </span>
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${URGENCY_COLORS[request.urgency]}`}
                      >
                        {URGENCY_LABELS[request.urgency]}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                      {request.title}
                    </h3>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    {/* Description */}
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {request.description}
                    </p>

                    {/* Location */}
                    {request.location && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin size={16} className="text-green-600 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          {request.location.county}
                          {request.location.constituency &&
                            `, ${request.location.constituency}`}
                        </span>
                      </div>
                    )}

                    {/* Quantity & Budget */}
                    <div className="bg-gray-50 rounded p-3 space-y-2">
                      {request.quantity && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-semibold text-gray-900">
                            {request.quantity} {request.unit}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Budget:</span>
                        <span className="font-semibold text-green-600">
                          {formatBudget(request.budget)}
                        </span>
                      </div>
                    </div>

                    {/* Buyer Info */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                      <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center text-sm font-bold text-green-800">
                        {request.userId && request.userId.fullName?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {request.userId?.fullName || "Anonymous"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Posted {formatDate(request.createdAt)}
                        </p>
                      </div>
                      {request.userId?.ratings && typeof request.userId.ratings === 'number' && (
                        <div className="flex items-center gap-1">
                          <TrendingUp size={14} className="text-yellow-500" />
                          <span className="text-sm font-semibold">
                            {request.userId.ratings.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-green-50 px-4 py-3 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Navigate to detail page for full view and response options
                        navigate(`/request/${request._id}`, { state: { request } });
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition text-sm"
                    >
                      View Details & Reply
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100 transition"
                >
                  Previous
                </button>
                <span className="text-gray-700 font-medium">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                  disabled={page === pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Alternative Action - For Buyers */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Looking to Buy Instead?</h3>
            <p className="text-gray-600 mb-6">
              Browse thousands of products and services from verified sellers across Kenya. Find exactly what you need with direct connections to farmers and producers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/browse"
                className="inline-flex justify-center items-center px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition"
              >
                Browse Listings
              </Link>
              <Link
                to={user ? "/create-listing" : "/login?next=/create-listing"}
                className="inline-flex justify-center items-center px-6 py-3 rounded-lg border-2 border-green-600 text-green-600 font-semibold hover:bg-green-50 transition"
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
