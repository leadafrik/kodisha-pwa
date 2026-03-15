import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  BOOST_PRICE_KES,
  BOOST_TILL_NUMBER,
  listAdminBoostRequests,
  reviewAdminBoostRequest,
  type BoostRequestStatus,
  type ListingBoostRequest,
} from "../../services/boostsService";

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString() : "-";

const getStatusTone = (status: BoostRequestStatus) => {
  if (status === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "rejected") return "border-red-200 bg-red-50 text-red-700";
  if (status === "refunded") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-[#F3C9BE] bg-[#FDF5F3] text-[#A0452E]";
};

const getOwnerMeta = (owner: ListingBoostRequest["ownerId"]) => {
  if (owner && typeof owner === "object") {
    return {
      name: owner.fullName || owner.name || "Listing owner",
      email: owner.email || "",
      phone: owner.phone || "",
    };
  }

  return {
    name: "Listing owner",
    email: "",
    phone: "",
  };
};

const AdminBoostRequests: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ListingBoostRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BoostRequestStatus | "">("");
  const [workingId, setWorkingId] = useState("");
  const [stats, setStats] = useState({ total: 0, submitted: 0, approved: 0 });

  const isAdmin =
    user?.role === "admin" || user?.role === "super_admin" || user?.role === "moderator";

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listAdminBoostRequests({
        status,
        search: search.trim() || undefined,
      });
      setItems(Array.isArray(response.data) ? response.data : []);
      setStats(
        response.stats || {
          total: 0,
          submitted: 0,
          approved: 0,
        }
      );
    } catch (loadError: any) {
      setError(loadError?.message || "Unable to load boost requests.");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const highlighted = useMemo(
    () => items.find((item) => item.status === "submitted") || items[0],
    [items]
  );

  const handleReview = async (
    boostId: string,
    action: "approve" | "reject" | "refund"
  ) => {
    setWorkingId(boostId);
    setError("");
    try {
      const note = window.prompt("Admin note (optional):") || undefined;
      await reviewAdminBoostRequest(boostId, action, note);
      await loadItems();
    } catch (actionError: any) {
      setError(actionError?.message || "Unable to update boost request.");
    } finally {
      setWorkingId("");
    }
  };

  if (!isAdmin) {
    return (
      <div className="ui-page-shell">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <div className="ui-card p-8 text-center">
            <p className="ui-section-kicker">Access restricted</p>
            <h1 className="mt-2 text-3xl font-bold text-stone-900">Admin access only</h1>
            <p className="mt-3 text-sm text-stone-600">
              Listing boost review is restricted to admin roles.
            </p>
            <Link to="/" className="ui-btn-primary mt-5 px-5 py-2.5">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ui-page-shell">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        <div className="ui-hero-panel p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="ui-section-kicker">Admin boost review</p>
              <h1 className="text-3xl font-bold text-stone-900">Free listings, optional paid boosting</h1>
              <p className="mt-2 max-w-3xl text-sm text-stone-600">
                Listings stay free. Review manual boost payments of KES {BOOST_PRICE_KES}, confirm the payer phone against till {BOOST_TILL_NUMBER}, then activate the boost.
              </p>
            </div>
            <button type="button" onClick={() => void loadItems()} className="ui-btn-secondary px-4 py-2.5">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh queue
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="ui-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Total</p>
            <p className="mt-2 text-2xl font-bold text-stone-900">{stats.total}</p>
          </div>
          <div className="ui-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Pending review</p>
            <p className="mt-2 text-2xl font-bold text-[#A0452E]">{stats.submitted}</p>
          </div>
          <div className="ui-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Approved</p>
            <p className="mt-2 text-2xl font-bold text-stone-900">{stats.approved}</p>
          </div>
        </div>

        <div className="ui-card mt-6 p-5">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr_auto]">
            <label>
              <span className="ui-label">Search</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="ui-input"
                placeholder="Listing title, county, or payer phone"
              />
            </label>
            <label>
              <span className="ui-label">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as BoostRequestStatus | "")}
                className="ui-input"
              >
                <option value="">All statuses</option>
                <option value="submitted">Pending review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="refunded">Refunded</option>
              </select>
            </label>
            <div className="flex items-end">
              <button type="button" onClick={() => void loadItems()} className="ui-btn-primary w-full px-4 py-2.5">
                Apply filters
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {highlighted && (
          <div className="ui-accent-panel mt-6 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A0452E]">Current focus</p>
            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-lg font-semibold text-stone-900">{highlighted.listingTitle}</p>
                <p className="mt-1 text-sm text-stone-700">
                  Payer {highlighted.payerPhone} | submitted {formatDateTime(highlighted.submittedAt)}
                </p>
              </div>
              <Link to={`/listings/${highlighted.listingId}`} className="ui-btn-primary px-4 py-2.5">
                Open listing
              </Link>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="ui-card p-6 text-sm text-stone-500">Loading boost requests...</div>
          ) : items.length === 0 ? (
            <div className="ui-card p-6 text-sm text-stone-500">No boost requests match the current filters.</div>
          ) : (
            items.map((item) => {
              const busy = workingId === item._id;
              const owner = getOwnerMeta(item.ownerId);
              const canApprove = item.status === "submitted";
              const canRefund = item.status === "approved";

              return (
                <div key={item._id} className="ui-card p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-stone-900">{item.listingTitle}</p>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(item.status)}`}>
                          {item.status === "submitted"
                            ? "Pending review"
                            : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                        <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-700">
                          {item.listingType}
                        </span>
                      </div>
                      <div className="grid gap-2 text-sm text-stone-600 md:grid-cols-2 xl:grid-cols-3">
                        <p><span className="font-semibold text-stone-900">Owner:</span> {owner.name}</p>
                        <p><span className="font-semibold text-stone-900">Owner email:</span> {owner.email || "-"}</p>
                        <p><span className="font-semibold text-stone-900">Owner phone:</span> {owner.phone || "-"}</p>
                        <p><span className="font-semibold text-stone-900">County:</span> {item.listingCounty || "-"}</p>
                        <p><span className="font-semibold text-stone-900">Payer phone:</span> {item.payerPhone}</p>
                        <p><span className="font-semibold text-stone-900">Till:</span> {item.tillNumber}</p>
                        <p><span className="font-semibold text-stone-900">Amount:</span> KES {item.amount.toLocaleString()}</p>
                        <p><span className="font-semibold text-stone-900">Submitted:</span> {formatDateTime(item.submittedAt)}</p>
                        <p><span className="font-semibold text-stone-900">Reviewed:</span> {formatDateTime(item.reviewedAt)}</p>
                      </div>
                      {item.adminNote && (
                        <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
                          <span className="font-semibold text-stone-900">Admin note:</span> {item.adminNote}
                        </div>
                      )}
                    </div>

                    <div className="w-full max-w-xl space-y-3 xl:w-[360px]">
                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                        <span className="text-sm text-stone-600">Boost fee</span>
                        <span className="text-lg font-semibold text-[#A0452E]">KES {item.amount.toLocaleString()}</span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          disabled={!canApprove || busy}
                          onClick={() => void handleReview(item._id, "approve")}
                          className="ui-btn-primary px-4 py-2.5 disabled:opacity-60"
                        >
                          Approve boost
                        </button>
                        <button
                          type="button"
                          disabled={!canApprove || busy}
                          onClick={() => void handleReview(item._id, "reject")}
                          className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={!canRefund || busy}
                          onClick={() => void handleReview(item._id, "refund")}
                          className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60"
                        >
                          Refund
                        </button>
                        <Link to={`/listings/${item.listingId}`} className="ui-btn-ghost px-4 py-2.5 text-center">
                          Open listing
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBoostRequests;
