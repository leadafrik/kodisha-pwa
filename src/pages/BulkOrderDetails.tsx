import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  BulkOrderInvoice,
  BulkOrder,
  BulkOrderBid,
  acceptAwardedBulkOrder,
  acceptBulkOrderBid,
  closeBulkOrder,
  getBulkOrderDetails,
  placeBulkOrderBid,
  rejectBulkOrderBid,
} from "../services/bulkOrdersService";

interface BulkOrderDetailsPayload {
  order: BulkOrder;
  bids: BulkOrderBid[];
  bidCount: number;
  myBid: BulkOrderBid | null;
  invoice?: BulkOrderInvoice | null;
  isOwner: boolean;
  canBid: boolean;
}

const formatCurrency = (value?: number) => {
  if (typeof value !== "number") return "-";
  return `KES ${value.toLocaleString()}`;
};

const BulkOrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [payload, setPayload] = useState<BulkOrderDetailsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [note, setNote] = useState("");

  const order = payload?.order || null;
  const isOwner = Boolean(payload?.isOwner);
  const canBid = Boolean(payload?.canBid);
  const myBid = payload?.myBid || null;
  const invoice = payload?.invoice || null;
  const canAcceptAwardedOrder =
    Boolean(
      !isOwner &&
        order?.status === "awarded" &&
        myBid?.status === "accepted" &&
        !order?.sellerAcceptedAt
    );

  const budgetLabel = useMemo(() => {
    if (!order?.budget) return "Not set";
    if (typeof order.budget.min === "number" && typeof order.budget.max === "number") {
      return `${formatCurrency(order.budget.min)} - ${formatCurrency(order.budget.max)}`;
    }
    if (typeof order.budget.min === "number") return `From ${formatCurrency(order.budget.min)}`;
    if (typeof order.budget.max === "number") return `Up to ${formatCurrency(order.budget.max)}`;
    return "Not set";
  }, [order?.budget]);

  const loadDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");
      const response = await getBulkOrderDetails(id);
      setPayload(response?.data || null);
    } catch (err: any) {
      setError(err?.message || "Failed to load bulk order details.");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handlePlaceBid = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;
    const amount = Number(quoteAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Quote amount must be greater than zero.");
      return;
    }
    if (!deliveryDate) {
      setError("Delivery date is required.");
      return;
    }
    try {
      setSubmittingBid(true);
      setError("");
      setNotice("");
      await placeBulkOrderBid(id, {
        quoteAmount: amount,
        deliveryDate,
        note: note.trim() || undefined,
      });
      setNotice("Bid submitted successfully.");
      setQuoteAmount("");
      setDeliveryDate("");
      setNote("");
      await loadDetails();
    } catch (err: any) {
      setError(err?.message || "Unable to submit bid.");
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    if (!id) return;
    const reason = window.prompt("Reason for acceptance (optional):") || undefined;
    const rejectReason =
      window.prompt("Reason for non-selected bids (optional):") ||
      "Another bid was accepted.";
    try {
      setError("");
      setNotice("");
      await acceptBulkOrderBid(id, bidId, reason, rejectReason);
      setNotice("Bid accepted and order awarded.");
      await loadDetails();
    } catch (err: any) {
      setError(err?.message || "Unable to accept bid.");
    }
  };

  const handleRejectBid = async (bidId: string) => {
    if (!id) return;
    const reason = window.prompt("Reason for rejection:");
    if (!reason || !reason.trim()) return;
    try {
      setError("");
      setNotice("");
      await rejectBulkOrderBid(id, bidId, reason.trim());
      setNotice("Bid rejected.");
      await loadDetails();
    } catch (err: any) {
      setError(err?.message || "Unable to reject bid.");
    }
  };

  const handleCloseOrder = async (status: "closed" | "cancelled") => {
    if (!id) return;
    const reason =
      status === "cancelled" ? window.prompt("Cancellation reason (optional):") : undefined;
    try {
      setError("");
      setNotice("");
      await closeBulkOrder(id, status, reason || undefined);
      setNotice(`Order ${status}.`);
      await loadDetails();
    } catch (err: any) {
      setError(err?.message || "Unable to update order status.");
    }
  };

  const handleAcceptAwardedOrder = async () => {
    if (!id) return;
    const note = window.prompt("Optional note before accepting this order:");
    try {
      setError("");
      setNotice("");
      await acceptAwardedBulkOrder(id, note || undefined);
      setNotice("Order accepted. Invoice has been issued.");
      await loadDetails();
    } catch (err: any) {
      setError(err?.message || "Unable to accept awarded order.");
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Bulk order details</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to continue.</p>
          <Link
            to={`/login?mode=signup&next=${encodeURIComponent(`/bulk/orders/${id || ""}`)}`}
            className="mt-5 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/bulk/orders"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to bulk board
          </Link>
          <Link
            to="/bulk"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Bulk access
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        {notice && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading bulk order details...
          </div>
        ) : !order ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Bulk order not found.
          </div>
        ) : (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    Bulk order
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold text-slate-900">{order.title}</h1>
                  <p className="mt-1 text-sm text-slate-600">{order.itemName}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    order.status === "open"
                      ? "bg-emerald-100 text-emerald-700"
                      : order.status === "awarded"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {order.status}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p><strong>Category:</strong> {order.category}</p>
                  <p><strong>Quantity:</strong> {order.quantity} {order.unit}</p>
                  <p><strong>Budget:</strong> {budgetLabel}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p><strong>County:</strong> {order.deliveryLocation?.county}</p>
                  <p><strong>Delivery scope:</strong> {order.deliveryScope}</p>
                  <p>
                    <strong>Deadline:</strong>{" "}
                    {order.deliveryDeadline
                      ? new Date(order.deliveryDeadline).toLocaleDateString()
                      : "Not specified"}
                  </p>
                </div>
              </div>

              {order.description && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  {order.description}
                </div>
              )}

              <div className="mt-4 text-sm text-slate-700">
                <p><strong>Total bids:</strong> {payload?.bidCount || 0}</p>
              </div>

              {invoice && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                  <p><strong>Invoice:</strong> {invoice.invoiceNumber}</p>
                  <p>
                    <strong>Buyer total:</strong> {formatCurrency(invoice.totalBuyerAmount)}{" "}
                    (Quote {formatCurrency(invoice.quoteAmount)} + Fee {formatCurrency(invoice.platformFeeAmount)})
                  </p>
                  <p><strong>Status:</strong> {invoice.status}</p>
                </div>
              )}

              {isOwner && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {order.status !== "closed" && (
                    <button
                      type="button"
                      onClick={() => handleCloseOrder("closed")}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Mark closed
                    </button>
                  )}
                  {order.status !== "cancelled" && (
                    <button
                      type="button"
                      onClick={() => handleCloseOrder("cancelled")}
                      className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Cancel order
                    </button>
                  )}
                </div>
              )}
            </section>

            {canBid && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Place your bid</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Quote total amount (include delivery) and proposed delivery date.
                </p>
                <form onSubmit={handlePlaceBid} className="mt-4 grid gap-3 md:grid-cols-3">
                  <input
                    type="number"
                    min={1}
                    value={quoteAmount}
                    onChange={(event) => setQuoteAmount(event.target.value)}
                    placeholder="Quote amount (KES)"
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  />
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(event) => setDeliveryDate(event.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={submittingBid}
                    className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-300"
                  >
                    {submittingBid ? "Submitting..." : "Submit bid"}
                  </button>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Optional note"
                    className="md:col-span-3 rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    rows={3}
                  />
                </form>
              </section>
            )}

            {payload?.myBid && !isOwner && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Your bid</h2>
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p><strong>Quote:</strong> {formatCurrency(payload.myBid.quoteAmount)}</p>
                  <p>
                    <strong>Delivery date:</strong>{" "}
                    {new Date(payload.myBid.deliveryDate).toLocaleDateString()}
                  </p>
                  <p><strong>Status:</strong> {payload.myBid.status}</p>
                  {payload.myBid.buyerDecisionReason && (
                    <p><strong>Buyer note:</strong> {payload.myBid.buyerDecisionReason}</p>
                  )}
                </div>
                {canAcceptAwardedOrder && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleAcceptAwardedOrder}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Accept order and issue invoice
                    </button>
                  </div>
                )}
              </section>
            )}

            {isOwner && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Incoming bids</h2>
                {payload?.bids?.length ? (
                  <div className="mt-4 space-y-3">
                    {payload.bids.map((bid) => (
                      <article
                        key={bid._id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900">
                            {bid.sellerId?.fullName || "Seller"}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              bid.status === "accepted"
                                ? "bg-emerald-100 text-emerald-700"
                                : bid.status === "rejected"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {bid.status}
                          </span>
                        </div>
                        <p className="mt-2"><strong>Quote:</strong> {formatCurrency(bid.quoteAmount)}</p>
                        <p>
                          <strong>Delivery date:</strong>{" "}
                          {new Date(bid.deliveryDate).toLocaleDateString()}
                        </p>
                        {bid.note && <p><strong>Note:</strong> {bid.note}</p>}
                        {bid.buyerDecisionReason && (
                          <p><strong>Decision note:</strong> {bid.buyerDecisionReason}</p>
                        )}

                        {order.status === "open" && bid.status === "pending" && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleAcceptBid(bid._id)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              Accept bid
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectBid(bid._id)}
                              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                            >
                              Reject with reason
                            </button>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">No bids yet.</p>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default BulkOrderDetails;
