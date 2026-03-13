import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL, ensureValidAccessToken } from "../config/api";
import * as Sentry from "@sentry/react";
import { handleImageError } from "../utils/imageFallback";
import { normalizeKenyanPhone } from "../utils/phone";

interface BuyerRequest {
  _id: string;
  title: string;
  description: string;
  category: string;
  productType?: string;
  contactPhone?: string;
  budget?: {
    min?: number;
    max?: number;
    currency?: string;
  };
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
  };
  createdAt: string;
  updatedAt: string;
  canViewDirectContact?: boolean;
  isOwner?: boolean;
  responses?: Array<{
    _id: string;
    sellerId: string;
    sellerName: string;
    message: string;
    createdAt: string;
  }>;
}

const getUrgencyBadgeStyles = (urgency?: string) => {
  if (urgency === "high") return "bg-[#FDE7E4] text-[#A0452E]";
  if (urgency === "medium") return "bg-amber-100 text-amber-800";
  return "bg-stone-100 text-stone-700";
};

const getUrgencyLabel = (urgency?: string) => {
  if (urgency === "high") return "High";
  if (urgency === "medium") return "Medium";
  return "Low";
};

const getStatusBadgeStyles = (status?: string) => {
  if (status === "active") return "bg-[#FDF5F3] text-[#A0452E]";
  if (status === "closed") return "bg-stone-100 text-stone-700";
  return "bg-amber-100 text-amber-800";
};

const formatBudgetRange = (budget?: { min?: number; max?: number; currency?: string }) => {
  if (!budget) return "Negotiable";
  const currency = budget.currency || "KES";
  const min = typeof budget.min === "number" ? budget.min.toLocaleString() : "-";
  const max = typeof budget.max === "number" ? budget.max.toLocaleString() : "-";
  if (min === "-" && max === "-") return "Negotiable";
  return `${currency} ${min} - ${max}`;
};

const BuyerRequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [request, setRequest] = useState<BuyerRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [markingFulfilled, setMarkingFulfilled] = useState(false);
  const [shareFeedback, setShareFeedback] = useState("");

  const initialRequest = (location.state as { request?: BuyerRequest } | null)?.request;
  const getAuthToken = async (): Promise<string | null> => ensureValidAccessToken();

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);

        if (initialRequest) {
          setRequest(initialRequest);
          setLoading(false);
          return;
        }

        if (!id) {
          setError("Invalid request ID");
          setLoading(false);
          return;
        }

        const token = await getAuthToken();
        const response = await fetch(`${API_BASE_URL}/buyer-requests/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError("Buy request not found");
          } else {
            setError(`Failed to load request: ${response.statusText}`);
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setRequest(data.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching buyer request:", err);
        setError(err instanceof Error ? err.message : "Failed to load request");
        setLoading(false);
        try {
          Sentry.captureException(err);
        } catch {
          // Ignore Sentry issues in UI flow.
        }
      }
    };

    void fetchRequest();
  }, [id, initialRequest]);

  const refreshRequest = async (requestId: string) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/buyer-requests/${requestId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (response.ok) {
      const data = await response.json();
      setRequest(data.data);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyMessage.trim()) {
      setError("Please enter a message");
      return;
    }

    if (!request?._id) {
      setError("Request ID is missing");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Please log in again to respond.");
      }

      const response = await fetch(`${API_BASE_URL}/buyer-requests/${request._id}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: replyMessage.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to submit reply: ${response.statusText}`);
      }

      setSubmitted(true);
      setReplyMessage("");
      window.setTimeout(() => setSubmitted(false), 3000);
      await refreshRequest(request._id);
    } catch (err) {
      console.error("Error submitting reply:", err);
      setError(err instanceof Error ? err.message : "Failed to submit reply");
      Sentry.captureException(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkFulfilled = async () => {
    if (!request) return;

    setMarkingFulfilled(true);
    try {
      setError(null);
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Please log in again to update this request.");
      }
      const response = await fetch(`${API_BASE_URL}/buyer-requests/${request._id}/mark-fulfilled`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to mark as fulfilled");
      }

      setSubmitted(true);
      window.setTimeout(() => setSubmitted(false), 3000);
      window.setTimeout(() => {
        navigate("/request");
      }, 1800);
    } catch (err) {
      console.error("Error marking as fulfilled:", err);
      setError(err instanceof Error ? err.message : "Failed to mark as fulfilled");
      try {
        Sentry.captureException(err);
      } catch {
        // Ignore Sentry issues in UI flow.
      }
    } finally {
      setMarkingFulfilled(false);
    }
  };

  if (loading) {
    return (
      <div className="ui-page-shell py-10">
        <div className="mx-auto flex min-h-[40vh] max-w-5xl items-center justify-center px-4">
          <div className="ui-card w-full max-w-md px-8 py-10 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#A0452E]" />
            <p className="text-sm font-medium text-stone-600">Loading request details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="ui-page-shell py-10">
        <div className="mx-auto flex min-h-[40vh] max-w-5xl items-center justify-center px-4">
          <div className="ui-card w-full max-w-md px-8 py-10">
            <h2 className="text-2xl font-semibold text-red-700">Unable to load this request</h2>
            <p className="mt-3 text-sm text-stone-600">{error || "Request not found"}</p>
            <button onClick={() => navigate("/request")} className="ui-btn-primary mt-6 w-full">
              Back to Buy Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwnRequest = user?._id === request.userId._id;
  const directContactPhone = normalizeKenyanPhone(request.contactPhone || request.userId.phone);
  const signInNext = `/login?next=${encodeURIComponent(`/request/${request._id}`)}`;
  const shareUrl = `${window.location.origin}/r/${request._id}`;

  const handleShareRequest = async () => {
    try {
      if ((navigator as Navigator & { share?: (data: ShareData) => Promise<void> }).share) {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
          title: request.title,
          text: `Buy request on Agrisoko: ${request.title}`,
          url: shareUrl,
        });
        setShareFeedback("Request link shared.");
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setShareFeedback("Request link copied.");
    } catch {
      window.prompt("Copy this buy request link", shareUrl);
      setShareFeedback("Share canceled.");
    } finally {
      window.setTimeout(() => setShareFeedback(""), 2500);
    }
  };

  return (
    <div className="ui-page-shell py-10">
      <div className="mx-auto max-w-5xl space-y-6 px-4">
        <button onClick={() => navigate("/request")} className="ui-btn-ghost gap-2 px-4 py-2 text-sm">
          <span aria-hidden="true">&larr;</span>
          Back to Buy Requests
        </button>

        <section className="ui-card overflow-hidden p-6 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="ui-chip-soft">{request.category}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getUrgencyBadgeStyles(request.urgency)}`}>
                  {getUrgencyLabel(request.urgency)}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeStyles(request.status)}`}>
                  {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                </span>
              </div>
              <div>
                <p className="ui-section-kicker">Agrisoko demand request</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
                  {request.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600 md:text-base">
                  {request.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => void handleShareRequest()} className="ui-btn-ghost px-4 py-2 text-sm">
                Share request
              </button>
              {shareFeedback && <p className="text-sm font-medium text-[#A0452E]">{shareFeedback}</p>}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <div className="ui-card-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Location</p>
              <p className="mt-2 text-sm font-semibold text-stone-900">
                {request.location.county}
                {request.location.constituency && `, ${request.location.constituency}`}
                {request.location.ward && `, ${request.location.ward}`}
              </p>
            </div>
            <div className="ui-card-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Budget</p>
              <p className="mt-2 text-sm font-semibold text-stone-900">{formatBudgetRange(request.budget)}</p>
            </div>
            <div className="ui-card-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Quantity needed</p>
              <p className="mt-2 text-sm font-semibold text-stone-900">
                {request.quantity ? `${request.quantity} ${request.unit || "units"}` : "Not specified"}
              </p>
            </div>
            <div className="ui-card-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Posted</p>
              <p className="mt-2 text-sm font-semibold text-stone-900">
                {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            {request.images && request.images.length > 0 && (
              <section className="ui-card p-5">
                <p className="ui-section-kicker">Reference images</p>
                <h2 className="mt-2 text-xl font-semibold text-stone-900">Buyer attachments</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {request.images.map((image, idx) => (
                    <img
                      key={idx}
                      src={image}
                      alt={`Request ${idx + 1}`}
                      onError={handleImageError}
                      className="h-52 w-full rounded-2xl object-cover"
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="ui-card-soft p-5">
              <p className="ui-section-kicker">Buyer</p>
              <h2 className="mt-2 text-xl font-semibold text-stone-900">Posted by {request.userId.fullName}</h2>
              {typeof request.userId.ratings === "number" && (
                <p className="mt-2 text-sm text-stone-600">Rating: {request.userId.ratings.toFixed(1)}</p>
              )}

              {!user ? (
                <div className="mt-4 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                  Sign in to reveal direct contact and reply to this request.
                </div>
              ) : directContactPhone ? (
                <div className="mt-4 flex gap-2">
                  <a href={`tel:${directContactPhone}`} className="ui-btn-primary flex-1">
                    Call Buyer
                  </a>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                  Buyer phone is not available yet. Use the reply form to connect.
                </div>
              )}
            </section>

            {(isOwnRequest || user?.role === "admin") && (
              <section className="ui-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="ui-section-kicker">Order status</p>
                    <h2 className="mt-2 text-xl font-semibold text-stone-900">Mark this request complete</h2>
                    <p className="mt-2 text-sm text-stone-600">
                      Close the request once the buyer has been served or the order has been fulfilled.
                    </p>
                  </div>
                  <button onClick={handleMarkFulfilled} disabled={markingFulfilled} className="ui-btn-primary min-w-[200px]">
                    {markingFulfilled ? "Marking..." : "Mark as Fulfilled"}
                  </button>
                </div>
              </section>
            )}

            {request.responses && request.responses.length > 0 && (
              <section className="ui-card p-5">
                <p className="ui-section-kicker">Responses</p>
                <h2 className="mt-2 text-xl font-semibold text-stone-900">Seller replies ({request.responses.length})</h2>
                <div className="mt-4 space-y-3">
                  {request.responses.map((response) => (
                    <div key={response._id} className="ui-card-soft p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-stone-900">{response.sellerName}</p>
                        <p className="text-xs text-stone-500">{new Date(response.createdAt).toLocaleDateString()}</p>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-stone-700">{response.message}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            {isOwnRequest ? (
              <section className="ui-card-soft p-5">
                <p className="ui-section-kicker">Your request</p>
                <h2 className="mt-2 text-xl font-semibold text-stone-900">You posted this demand</h2>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  You cannot reply to your own buy request. Manage responses from your requests dashboard.
                </p>
              </section>
            ) : (
              <section className="ui-card sticky top-24 p-5">
                <p className="ui-section-kicker">Reply to buyer</p>
                <h2 className="mt-2 text-xl font-semibold text-stone-900">Send your offer</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Reply when you are ready to confirm pricing, availability, and delivery.
                </p>

                {submitted && (
                  <div className="mt-4 rounded-2xl border border-[#F3C9BE] bg-[#FDF5F3] px-4 py-3">
                    <p className="text-sm font-semibold text-[#A0452E]">Reply submitted successfully.</p>
                  </div>
                )}

                {error && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {!user ? (
                  <div className="mt-5 space-y-4">
                    <p className="text-sm text-stone-700">
                      Sign in to respond to this request and unlock direct buyer contact.
                    </p>
                    <button onClick={() => navigate(signInNext)} className="ui-btn-primary w-full">
                      Sign In to Reply
                    </button>
                    <p className="text-center text-xs text-stone-500">
                      Request details stay public. Direct contact unlocks after sign-in.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleReplySubmit} className="mt-5 space-y-4">
                    <div>
                      <label className="ui-label">Your Message</label>
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Tell the buyer about your product, pricing, availability, and delivery terms."
                        className="ui-input min-h-[160px] resize-y"
                        rows={6}
                        disabled={submitting}
                      />
                    </div>

                    <button type="submit" disabled={submitting || !replyMessage.trim()} className="ui-btn-primary w-full">
                      {submitting ? "Submitting..." : "Submit Reply"}
                    </button>

                    <p className="text-center text-xs text-stone-500">
                      The buyer will review your message and can contact you directly.
                    </p>
                  </form>
                )}
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BuyerRequestDetails;
