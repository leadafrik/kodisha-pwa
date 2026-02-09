import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';
import * as Sentry from '@sentry/react';
import { handleImageError } from "../utils/imageFallback";

type BudgetRange = {
  min?: number;
  max?: number;
  currency?: string;
};

type BuyerRequestResponse = {
  _id: string;
  sellerId: string;
  sellerName: string;
  sellerPhone?: string;
  sellerEmail?: string;
  message: string;
  createdAt: string;
};

interface BuyerRequest {
  _id: string;
  title: string;
  description: string;
  category: string;
  productType?: string;
  contactPhone?: string;
  budget?: number | BudgetRange;
  quantity?: number;
  unit?: string;
  location: {
    county: string;
    constituency?: string;
    ward?: string;
  };
  urgency: string;
  status: string;
  images?: string[];
  userId: {
    _id: string;
    fullName: string;
    ratings?: number;
    phone?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
  responses?: BuyerRequestResponse[];
}

const CONTACT_POLL_INTERVAL_MS = 8000;

const normalizePhoneForTel = (phone?: string) =>
  (phone || "").replace(/\s+/g, "");

const formatCurrencyAmount = (value: number, currency = "KES") =>
  `${currency} ${value.toLocaleString()}`;

const formatBudget = (budget?: number | BudgetRange, unit?: string) => {
  if (budget === undefined || budget === null) return "Negotiable";

  if (typeof budget === "number") {
    return `${formatCurrencyAmount(budget)}${unit ? `/${unit}` : ""}`;
  }

  const minValue = Number(budget.min);
  const maxValue = Number(budget.max);
  const currency = budget.currency || "KES";
  const hasMin = Number.isFinite(minValue) && minValue > 0;
  const hasMax = Number.isFinite(maxValue) && maxValue > 0;

  if (hasMin && hasMax) {
    return `${formatCurrencyAmount(minValue, currency)} - ${formatCurrencyAmount(maxValue, currency)}${unit ? `/${unit}` : ""}`;
  }

  if (hasMin) {
    return `From ${formatCurrencyAmount(minValue, currency)}${unit ? `/${unit}` : ""}`;
  }

  if (hasMax) {
    return `Up to ${formatCurrencyAmount(maxValue, currency)}${unit ? `/${unit}` : ""}`;
  }

  return "Negotiable";
};

const BuyerRequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [request, setRequest] = useState<BuyerRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [markingFulfilled, setMarkingFulfilled] = useState(false);

  // Try to get request from route state for instant paint, then hydrate from API.
  const initialRequest = (location.state as any)?.request;

  const getAuthToken = (): string | null => {
    return localStorage.getItem("kodisha_token") || localStorage.getItem("kodisha_admin_token");
  };

  const buildAuthHeaders = useCallback((): Record<string, string> => {
    const token = getAuthToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, []);

  const fetchRequestDetails = useCallback(
    async (showLoader: boolean) => {
      if (!id) {
        setError("Invalid request ID");
        if (showLoader) setLoading(false);
        return;
      }

      try {
        if (showLoader) setLoading(true);

        const response = await fetch(`${API_BASE_URL}/buyer-requests/${id}`, {
          headers: buildAuthHeaders(),
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError("Buy request not found");
          } else {
            setError(`Failed to load request: ${response.statusText}`);
          }
          if (showLoader) setLoading(false);
          return;
        }

        const data = await response.json();
        setRequest(data.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching buyer request:", err);
        setError(err instanceof Error ? err.message : "Failed to load request");
        try {
          Sentry.captureException(err);
        } catch {
          // Ignore telemetry issues
        }
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [buildAuthHeaders, id]
  );

  useEffect(() => {
    if (initialRequest) {
      setRequest(initialRequest);
      setLoading(false);
    }
  }, [initialRequest]);

  useEffect(() => {
    void fetchRequestDetails(!initialRequest);
    const intervalId = window.setInterval(() => {
      void fetchRequestDetails(false);
    }, CONTACT_POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [fetchRequestDetails, initialRequest]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!replyMessage.trim()) {
      setError('Please enter a message');
      return;
    }

    if (!request?._id) {
      setError('Request ID is missing');
      return;
    }

    try {
      setSubmitting(true);
      const messageToSend = replyMessage.trim();

      const response = await fetch(
        `${API_BASE_URL}/buyer-requests/${request._id}/respond`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...buildAuthHeaders(),
          },
          body: JSON.stringify({
            message: messageToSend,
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to submit reply: ${response.statusText}`);
      }

      const result = await response.json();
      const createdResponse = result?.data as BuyerRequestResponse | undefined;

      if (createdResponse?._id) {
        setRequest((prev) => {
          if (!prev) return prev;
          const existing = prev.responses || [];
          const alreadyExists = existing.some((item) => item._id === createdResponse._id);
          return alreadyExists
            ? prev
            : { ...prev, responses: [createdResponse, ...existing] };
        });
      }

      // Success
      setSubmitted(true);
      setReplyMessage('');
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);

      // Refresh in the background so server data stays canonical.
      await fetchRequestDetails(false);
    } catch (err) {
      console.error('Error submitting reply:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit reply');
      Sentry.captureException(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkFulfilled = async () => {
    if (!request) return;

    setError(null);
    setMarkingFulfilled(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/buyer-requests/${request._id}/mark-fulfilled`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...buildAuthHeaders(),
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark as fulfilled');
      }

      await response.json();
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);

      // Navigate back to requests page
      setTimeout(() => {
        navigate('/request');
      }, 2000);
    } catch (err) {
      console.error('Error marking as fulfilled:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark as fulfilled');
      try {
        Sentry.captureException(err);
      } catch {
        // Sentry error - ignore
      }
    } finally {
      setMarkingFulfilled(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading request details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error || 'Request not found'}</p>
            <button
              onClick={() => navigate('/request')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
            >
              Back to Buy Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentUserId = user?._id || user?.id;
  const isOwnRequest = !!currentUserId && currentUserId === request.userId._id;
  const buyerPhone = request.contactPhone || request.userId.phone;
  const budgetLabel = formatBudget(request.budget, request.unit);
  const messageBuyerPath = `/messages?userId=${request.userId._id}`;

  return (
    <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => navigate('/request')}
            className="mb-6 flex items-center text-green-600 hover:text-green-700 font-semibold transition"
          >
            <span className="mr-2">&lt;</span> Back to Buy Requests
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Request Header Card */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{request.title}</h1>
                    <div className="flex gap-3 flex-wrap">
                      <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {request.category}
                      </span>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        request.urgency === 'urgent' ? 'bg-red-100 text-red-800' :
                        request.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {request.urgency?.charAt(0).toUpperCase() + request.urgency?.slice(1) || 'Normal'}
                      </span>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    request.status === 'active' ? 'bg-green-100 text-green-800' :
                    request.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-200 mb-4">
                  <div>
                    <p className="text-gray-500 text-sm">Location</p>
                    <p className="text-gray-800 font-semibold">
                      {request.location.county}
                      {request.location.constituency && `, ${request.location.constituency}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Budget</p>
                    <p className="text-gray-800 font-semibold">{budgetLabel}</p>
                  </div>
                  {request.quantity && (
                    <div>
                      <p className="text-gray-500 text-sm">Quantity Needed</p>
                      <p className="text-gray-800 font-semibold">
                        {request.quantity} {request.unit || 'units'}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500 text-sm">Posted</p>
                    <p className="text-gray-800 font-semibold">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Description</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {request.description}
                  </p>
                </div>

                {/* Images */}
                {request.images && request.images.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Images</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {request.images.map((image, idx) => (
                        <img
                          key={idx}
                          src={image}
                          alt={`Request ${idx + 1}`}
                          onError={handleImageError}
                          className="rounded-lg max-h-48 object-cover"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Requester Info Card */}
              <div className="bg-blue-50 rounded-lg shadow-md p-6 mb-6 border-l-4 border-blue-600">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Posted By</h3>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xl font-bold text-gray-800">{request.userId.fullName}</p>
                    {typeof request.userId.ratings === 'number' && (
                      <p className="text-sm text-gray-600 mt-1">
                        ⭐ Rating: {request.userId.ratings.toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>
                {(buyerPhone || request.userId.email) && (
                  <div className="mt-3 text-sm text-gray-700">
                    {buyerPhone && <p>Phone: {buyerPhone}</p>}
                    {!buyerPhone && request.userId.email && <p>Email: {request.userId.email}</p>}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {buyerPhone && (
                    <a
                      href={`tel:${normalizePhoneForTel(buyerPhone)}`}
                      className="flex-1 min-w-[140px] px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 text-center"
                    >
                      Call Buyer
                    </a>
                  )}
                  {user && !isOwnRequest && (
                    <Link
                      to={messageBuyerPath}
                      className="flex-1 min-w-[140px] px-3 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100 text-center"
                    >
                      Message Buyer
                    </Link>
                  )}
                </div>
              </div>

              {/* Mark as Fulfilled Button */}
              {(isOwnRequest || user?.role === 'admin') && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-orange-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Order Status</h3>
                      <p className="text-sm text-gray-600 mt-1">Mark this order as fulfilled when complete</p>
                    </div>
                                        <button
                      onClick={handleMarkFulfilled}
                      disabled={markingFulfilled || request.status !== "active"}
                      className={`${
                        markingFulfilled || request.status !== "active"
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-orange-600 hover:bg-orange-700'
                      } text-white font-semibold py-2 px-6 rounded-lg transition flex items-center gap-2`}
                    >
                      {markingFulfilled ? (
                        <>
                          <span className="animate-spin">...</span> Marking...
                        </>
                      ) : request.status !== "active" ? (
                        <>Fulfilled</>
                      ) : (
                        <>Mark as Fulfilled</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Responses Section */}
              {request.responses && request.responses.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Responses ({request.responses.length})
                  </h3>
                  <div className="space-y-4">
                    {request.responses.map((response) => (
                      <div
                        key={response._id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-gray-800">{response.sellerName}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(response.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                          {response.message}
                        </p>
                        {(response.sellerPhone || response.sellerId) && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {response.sellerPhone && (
                              <a
                                href={`tel:${normalizePhoneForTel(response.sellerPhone)}`}
                                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                Call seller
                              </a>
                            )}
                            {user && response.sellerId && response.sellerId !== currentUserId && (
                              <Link
                                to={`/messages?userId=${response.sellerId}`}
                                className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                              >
                                Message seller
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Reply Form */}
            <div className="lg:col-span-1">
              {isOwnRequest ? (
                <div className="bg-blue-50 rounded-lg shadow-md p-6 border-l-4 border-blue-600">
                  <p className="text-gray-700 font-semibold">
                    This is your buy request. You cannot reply to your own request.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    New responses refresh automatically every few seconds. Use the response cards to call or message sellers.
                  </p>
                  <Link
                    to="/messages"
                    className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    Open Messages
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Reply to Request</h3>

                  {submitted && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-semibold">Reply submitted successfully.</p>
                    </div>
                  )}

                  {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  {!user ? (
                    <div>
                      <p className="text-gray-700 mb-4">
                        Please log in to reply to this buy request.
                      </p>
                      <button
                        onClick={() => navigate(`/login?next=/request/${request._id}`)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
                      >
                        Log In
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleReplySubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Your Message
                        </label>
                        <textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Tell the buyer about your product/service, pricing, availability, etc..."
                          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-vertical"
                          rows={6}
                          disabled={submitting}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting || !replyMessage.trim()}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
                      >
                        {submitting ? 'Submitting...' : 'Submit Reply'}
                      </button>

                      <p className="text-xs text-gray-500 text-center">
                        Replies are saved here and also start a direct message thread.
                      </p>
                      <Link
                        to={messageBuyerPath}
                        className="block text-center text-sm font-semibold text-blue-700 hover:text-blue-800"
                      >
                        Open chat with buyer
                      </Link>
                    </form>
                  )}
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerRequestDetails;


