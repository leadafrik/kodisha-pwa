import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  BulkOrderInvoice,
  BulkOrder,
  BulkOrderBid,
  acceptBulkOrderBid,
  closeBulkOrder,
  getBulkOrderDetails,
  markBulkOrderComplete,
  placeBulkOrderBid,
  rejectBulkOrderBid,
  sendBulkOrderCounterOffer,
  respondToBulkOrderCounterOffer,
} from "../services/bulkOrdersService";
import DeliveryOfferModal from "../components/DeliveryOfferModal";

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

const completionMeta = (status?: string) => {
  switch (status) {
    case "buyer_marked":
      return {
        label: "Buyer confirmed complete",
        className: "bg-sky-100 text-sky-700",
      };
    case "seller_marked":
      return {
        label: "Seller confirmed complete",
        className: "bg-violet-100 text-violet-700",
      };
    case "completed":
      return {
        label: "Completed by both parties",
        className: "bg-[#FDF5F3] text-[#A0452E]",
      };
    case "presumed_complete":
      return {
        label: "Presumed complete",
        className: "bg-amber-100 text-amber-700",
      };
    default:
      return {
        label: "Pending completion",
        className: "bg-slate-100 text-slate-700",
      };
  }
};

const BulkOrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payload, setPayload] = useState<BulkOrderDetailsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null);
  const [counterOfferBidId, setCounterOfferBidId] = useState<string | null>(null);
  const [counterOfferAmount, setCounterOfferAmount] = useState<string>("");
  const [counterOfferNote, setCounterOfferNote] = useState<string>("");
  const [sendingCounter, setSendingCounter] = useState(false);
  const [respondingCounterId, setRespondingCounterId] = useState<string | null>(null);

  const order = payload?.order || null;
  const isOwner = Boolean(payload?.isOwner);
  const canBid = Boolean(payload?.canBid);
  const myBid = payload?.myBid || null;
  const invoice = payload?.invoice || null;
  const completionState = completionMeta(order?.completionStatus);
  const sellerConfirmed = Boolean(order?.sellerMarkedCompleteAt);
  const buyerConfirmed = Boolean(order?.buyerMarkedCompleteAt);
  const canMarkComplete =
    Boolean(
      order &&
        order.sellerAcceptedAt &&
        (order.status === "awarded" || order.status === "closed") &&
        (isOwner || myBid?.status === "accepted") &&
        order.completionStatus !== "completed" &&
        order.completionStatus !== "presumed_complete"
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

  const handlePlaceBid = async (payload: {
    quoteAmount: number;
    deliveryDate: string;
    message: string;
  }) => {
    if (!id) return;
    try {
      setSubmittingBid(true);
      setError("");
      setNotice("");
      await placeBulkOrderBid(id, {
        quoteAmount: payload.quoteAmount,
        deliveryDate: payload.deliveryDate,
        note: payload.message.trim() || undefined,
      });
      setOfferModalOpen(false);
      setNotice("Delivery offer submitted successfully.");
      await loadDetails();
    } catch (err: any) {
      setError(err?.message || "Unable to submit delivery offer.");
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    if (!id) return;
    try {
      setAcceptingBidId(bidId);
      setError("");
      setNotice("");
      await acceptBulkOrderBid(id, bidId, "Offer accepted for payment.", "Another offer was selected.");
      navigate(`/checkout?source=bulk-offer&orderId=${encodeURIComponent(id)}`);
    } catch (err: any) {
      setError(err?.message || "Unable to accept bid.");
    } finally {
      setAcceptingBidId(null);
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

  const handleSendCounterOffer = async (bidId: string) => {
    if (!id) return;
    const amount = Number(counterOfferAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid counter-offer amount.");
      return;
    }
    try {
      setSendingCounter(true);
      setError("");
      setNotice("");
      await sendBulkOrderCounterOffer(id, bidId, amount, counterOfferNote.trim() || undefined);
      setCounterOfferBidId(null);
      setCounterOfferAmount("");
      setCounterOfferNote("");
      setNotice("Counter-offer sent to seller.");
      await loadDetails();
    } catch (err: any) {
      setError(err?.message || "Unable to send counter-offer.");
    } finally {
      setSendingCounter(false);
    }
  };

  const handleCounterOfferResponse = async (bidId: string, decision: "accepted" | "rejected") => {
    if (!id) return;
    try {
      setRespondingCounterId(bidId);
      setError("");
      setNotice("");
      await respondToBulkOrderCounterOffer(id, bidId, decision);
      setNotice(decision === "accepted" ? "Counter-offer accepted. The buyer can now accept your bid." : "Counter-offer declined.");
      await loadDetails();
    } catch (err: any) {
      setError(err?.message || "Unable to respond to counter-offer.");
    } finally {
      setRespondingCounterId(null);
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

  const handleMarkComplete = async () => {
    if (!id) return;
    try {
      setError("");
      setNotice("");
      await markBulkOrderComplete(id);
      setNotice("Completion update saved.");
      await loadDetails();
    } catch (err: any) {
      setError(err?.message || "Unable to mark order completion.");
    }
  };

  if (!user) {
    return (
      <main className="ui-page-shell px-4 py-10">
        <div className="ui-card mx-auto max-w-2xl p-8">
          <p className="ui-section-kicker">Bulk order</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">Bulk order details</h1>
          <p className="mt-2 text-sm text-stone-600">Sign in to continue.</p>
          <Link
            to={`/login?mode=signup&next=${encodeURIComponent(`/bulk/orders/${id || ""}`)}`}
            className="ui-btn-primary mt-5 px-5 py-3 text-sm"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="ui-page-shell px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/bulk/orders"
            className="ui-btn-ghost px-3 py-1.5 text-xs"
          >
            Back to bulk board
          </Link>
          <Link
            to="/bulk"
            className="ui-btn-ghost px-3 py-1.5 text-xs"
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
          <div className="rounded-xl border border-forest-100 bg-forest-50 px-4 py-3 text-sm text-forest-700">
            {notice}
          </div>
        )}

        {loading ? (
          <div className="ui-card p-6 text-sm text-stone-500">
            Loading bulk order details...
          </div>
        ) : !order ? (
          <div className="ui-card p-6 text-sm text-stone-500">
            Bulk order not found.
          </div>
        ) : (
          <>
            <section className="ui-hero-panel p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="ui-section-kicker">
                    Bulk order
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">{order.title}</h1>
                  <p className="mt-1 text-sm text-stone-600">{order.itemName}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      order.status === "open"
                        ? "bg-[#FDF5F3] text-[#A0452E]"
                        : order.status === "awarded"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {order.status}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${completionState.className}`}
                  >
                    {completionState.label}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="ui-card-soft p-3 text-sm text-stone-700">
                  <p><strong>Category:</strong> {order.category}</p>
                  <p><strong>Quantity:</strong> {order.quantity} {order.unit}</p>
                  <p><strong>Budget:</strong> {budgetLabel}</p>
                </div>
                <div className="ui-card-soft p-3 text-sm text-stone-700">
                  <p><strong>County:</strong> {order.deliveryLocation?.county}</p>
                  <p><strong>Constituency:</strong> {order.deliveryLocation?.constituency || "-"}</p>
                  <p><strong>Ward:</strong> {order.deliveryLocation?.ward || "-"}</p>
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
                <div className="mt-4 rounded-xl border border-stone-200 bg-white/80 p-3 text-sm text-stone-700">
                  {order.description}
                </div>
              )}

              <div className="mt-4 text-sm text-stone-700">
                <p><strong>Total bids:</strong> {payload?.bidCount || 0}</p>
              </div>

              {invoice && (
                <div className="mt-4 rounded-xl border border-forest-100 bg-forest-50 p-3 text-sm text-forest-900">
                  <p><strong>Invoice:</strong> {invoice.invoiceNumber}</p>
                  <p>
                    <strong>Buyer total:</strong> {formatCurrency(invoice.totalBuyerAmount)}{" "}
                    (Quote {formatCurrency(invoice.quoteAmount)} + Fee {formatCurrency(invoice.platformFeeAmount)})
                  </p>
                  <p><strong>Status:</strong> {invoice.status}</p>
                  <p>
                    <strong>Email delivery:</strong>{" "}
                    {invoice.emailSentAt
                      ? `Sent on ${new Date(invoice.emailSentAt).toLocaleString()}`
                      : "Pending"}
                  </p>
                </div>
              )}

              {order.checkoutOrderId && (
                <div className="mt-4 rounded-xl border border-[#F3C9BE] bg-[#FDF5F3] p-4 text-sm text-stone-700">
                  <p className="font-semibold text-stone-900">Payment order already opened</p>
                  <p className="mt-2">
                    The accepted delivery offer is already in checkout with Agrisoko money-back guarantee cover.
                  </p>
                  {isOwner && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/orders/${order.checkoutOrderId}`)}
                        className="ui-btn-primary px-4 py-2 text-sm"
                      >
                        Open payment order
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 rounded-xl border border-stone-200 bg-[#FAF7F2] p-3 text-sm text-stone-700">
                <p>
                  <strong>Buyer confirmation:</strong>{" "}
                  {buyerConfirmed
                    ? `Done on ${new Date(order.buyerMarkedCompleteAt as string).toLocaleString()}`
                    : "Pending"}
                </p>
                <p>
                  <strong>Seller confirmation:</strong>{" "}
                  {sellerConfirmed
                    ? `Done on ${new Date(order.sellerMarkedCompleteAt as string).toLocaleString()}`
                    : "Pending"}
                </p>
                {order.completionReminderSentAt && (
                  <p>
                    <strong>Reminder sent:</strong>{" "}
                    {new Date(order.completionReminderSentAt).toLocaleString()}
                  </p>
                )}
                {order.presumedCompletedAt && (
                  <p>
                    <strong>Presumed complete:</strong>{" "}
                    {new Date(order.presumedCompletedAt).toLocaleString()}
                  </p>
                )}
              </div>

              {isOwner && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {canMarkComplete && (
                    <button
                      type="button"
                      onClick={handleMarkComplete}
                      className="ui-btn-primary px-4 py-2 text-sm"
                    >
                      Mark complete
                    </button>
                  )}
                  {order.status !== "cancelled" && order.status !== "closed" && (
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
              <section className="ui-card p-6">
                <h2 className="text-lg font-semibold text-stone-900">Offer delivery</h2>
                <p className="mt-1 text-sm text-stone-600">
                  Send one clear delivery offer with your total price, delivery date, and notes.
                </p>
                <button
                  type="button"
                  onClick={() => setOfferModalOpen(true)}
                  className="ui-btn-primary mt-4 px-4 py-3 text-sm"
                >
                  I can deliver
                </button>
              </section>
            )}

            {payload?.myBid && !isOwner && (
              <section className="ui-card p-6">
                <h2 className="text-lg font-semibold text-stone-900">Your bid</h2>
                <div className="mt-3 rounded-xl border border-stone-200 bg-[#FAF7F2] p-3 text-sm text-stone-700">
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

                {/* Counter-offer response for seller */}
                {payload.myBid.counterOfferStatus === "pending" && payload.myBid.counterOfferAmount && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
                    <p className="font-semibold text-amber-800">Buyer sent a counter-offer</p>
                    <p className="mt-1 text-amber-700">
                      Proposed amount: <strong>{formatCurrency(payload.myBid.counterOfferAmount)}</strong>
                      {payload.myBid.counterOfferNote && ` — "${payload.myBid.counterOfferNote}"`}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleCounterOfferResponse(payload.myBid!._id, "accepted")}
                        disabled={respondingCounterId === payload.myBid._id}
                        className="ui-btn-primary px-3 py-1.5 text-xs"
                      >
                        Accept counter-offer
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCounterOfferResponse(payload.myBid!._id, "rejected")}
                        disabled={respondingCounterId === payload.myBid._id}
                        className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}

                {payload.myBid.status === "accepted" && !order?.checkoutOrderId && (
                  <p className="mt-4 text-sm text-[#A0452E]">
                    The buyer selected your offer. Agrisoko is waiting for payment before delivery starts.
                  </p>
                )}
                {canMarkComplete && order?.sellerAcceptedAt && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={handleMarkComplete}
                      className="ui-btn-secondary px-4 py-2 text-sm"
                    >
                      Mark complete
                    </button>
                  </div>
                )}
              </section>
            )}

            {isOwner && (
              <section className="ui-card p-6">
                <h2 className="text-lg font-semibold text-stone-900">Incoming bids</h2>
                {payload?.bids?.length ? (
                  <div className="mt-4 space-y-3">
                    {payload.bids.map((bid) => (
                      <article
                        key={bid._id}
                        className="rounded-xl border border-stone-200 bg-[#FAF7F2] p-4 text-sm text-stone-700"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-stone-900">
                            {bid.sellerId?.fullName || "Seller"}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              bid.status === "accepted"
                                ? "bg-[#FDF5F3] text-[#A0452E]"
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

                        {/* Counter-offer status display */}
                        {bid.counterOfferAmount && (
                          <p className="mt-2 text-xs text-amber-700">
                            Counter-offer sent: <strong>{formatCurrency(bid.counterOfferAmount)}</strong>
                            {" "}— {bid.counterOfferStatus === "pending" ? "awaiting seller response" : bid.counterOfferStatus}
                          </p>
                        )}

                        {order.status === "open" && bid.status === "pending" && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleAcceptBid(bid._id)}
                              disabled={acceptingBidId === bid._id}
                              className="ui-btn-primary px-3 py-1.5 text-xs"
                            >
                              {acceptingBidId === bid._id
                                ? "Opening payment..."
                                : "Accept and proceed to payment"}
                            </button>
                            {/* Counter-offer — only if no pending counter-offer yet */}
                            {(!bid.counterOfferStatus || bid.counterOfferStatus === "rejected") && (
                              <button
                                type="button"
                                onClick={() => setCounterOfferBidId(counterOfferBidId === bid._id ? null : bid._id)}
                                className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                              >
                                Counter-offer
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRejectBid(bid._id)}
                              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                            >
                              Reject with reason
                            </button>
                          </div>
                        )}

                        {/* Inline counter-offer form */}
                        {counterOfferBidId === bid._id && (
                          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                            <p className="text-xs font-semibold text-amber-800">Propose a different price</p>
                            <input
                              type="number"
                              min={1}
                              value={counterOfferAmount}
                              onChange={(e) => setCounterOfferAmount(e.target.value)}
                              placeholder="Your offer (KES)"
                              className="ui-input py-2 text-sm w-full"
                            />
                            <input
                              type="text"
                              value={counterOfferNote}
                              onChange={(e) => setCounterOfferNote(e.target.value)}
                              placeholder="Optional note to seller"
                              className="ui-input py-2 text-sm w-full"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleSendCounterOffer(bid._id)}
                                disabled={sendingCounter}
                                className="ui-btn-primary px-3 py-1.5 text-xs"
                              >
                                {sendingCounter ? "Sending..." : "Send counter-offer"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setCounterOfferBidId(null)}
                                className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-stone-500">No bids yet.</p>
                )}
              </section>
            )}
          </>
        )}
      </div>
      <DeliveryOfferModal
        open={offerModalOpen}
        title="Send your delivery offer"
        description="Quote the full amount you want the buyer to pay, set your delivery date, and explain how you will fulfill this bulk demand."
        submitLabel="Send delivery offer"
        submitting={submittingBid}
        onClose={() => setOfferModalOpen(false)}
        onSubmit={handlePlaceBid}
      />
    </main>
  );
};

export default BulkOrderDetails;
