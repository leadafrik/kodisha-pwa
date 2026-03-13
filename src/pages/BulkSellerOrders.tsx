import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getMyBulkAccessStatus } from "../services/bulkApplicationsService";
import {
  BulkOrder,
  acceptAwardedBulkOrder,
  getSellerAwardedBulkOrders,
} from "../services/bulkOrdersService";

type SellerAwardedOrder = BulkOrder & {
  acceptedBid?: {
    _id: string;
    quoteAmount: number;
    deliveryDate: string;
    status: string;
  } | null;
  invoice?: {
    _id: string;
    invoiceNumber: string;
    quoteAmount: number;
    platformFeeAmount: number;
    totalBuyerAmount: number;
    status: string;
    emailSentAt?: string;
  } | null;
};

type SellerView = "all" | "needs_action" | "accepted" | "invoiced";

const formatCurrency = (value?: number) =>
  typeof value === "number" ? `KES ${value.toLocaleString()}` : "-";

const formatDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString();
};

const CATEGORY_LABELS: Record<string, string> = {
  produce: "Produce",
  livestock: "Livestock",
  inputs: "Inputs",
  service: "Services",
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  awarded: {
    label: "Awarded",
    className: "bg-amber-100 text-amber-700",
  },
  closed: {
    label: "Closed",
    className: "bg-slate-200 text-slate-700",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-rose-100 text-rose-700",
  },
};

const COMPLETION_META: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending completion", className: "bg-slate-100 text-slate-700" },
  buyer_marked: { label: "Buyer confirmed", className: "bg-sky-100 text-sky-700" },
  seller_marked: { label: "Seller confirmed", className: "bg-violet-100 text-violet-700" },
  completed: { label: "Completed", className: "bg-[#FDF5F3] text-[#A0452E]" },
  presumed_complete: { label: "Presumed complete", className: "bg-amber-100 text-amber-700" },
};

const VIEW_LABELS: Record<SellerView, string> = {
  all: "All orders",
  needs_action: "Needs action",
  accepted: "Accepted",
  invoiced: "Invoiced",
};

const BulkSellerOrders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<SellerAwardedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [canRespond, setCanRespond] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [view, setView] = useState<SellerView>("all");

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getSellerAwardedBulkOrders();
      setOrders(Array.isArray(response?.data) ? response.data : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load awarded orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setAccessLoading(false);
      return;
    }
    let active = true;
    setAccessLoading(true);
    getMyBulkAccessStatus()
      .then((status) => {
        if (!active) return;
        setCanRespond(Boolean(status?.canRespondToB2BDemand || status?.isAdmin));
      })
      .catch((err: any) => {
        if (!active) return;
        setError(err?.message || "Unable to verify bulk seller access.");
      })
      .finally(() => {
        if (active) setAccessLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!canRespond) return;
    loadOrders();
  }, [canRespond, loadOrders]);

  const orderStats = useMemo(() => {
    let needsAction = 0;
    let accepted = 0;
    let invoiced = 0;

    orders.forEach((order) => {
      const acceptedBid = order.acceptedBid || null;
      const hasInvoice = Boolean(order.invoice);
      const isSellerAccepted = Boolean(order.sellerAcceptedAt);
      const isActionable =
        order.status === "awarded" &&
        acceptedBid?.status === "accepted" &&
        !isSellerAccepted;

      if (isActionable) needsAction += 1;
      if (isSellerAccepted) accepted += 1;
      if (hasInvoice) invoiced += 1;
    });

    return {
      total: orders.length,
      needsAction,
      accepted,
      invoiced,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const isOrderActionable = (order: SellerAwardedOrder) =>
      Boolean(
        order.status === "awarded" &&
          order.acceptedBid?.status === "accepted" &&
          !order.sellerAcceptedAt
      );

    const matchesView = (order: SellerAwardedOrder) => {
      if (view === "needs_action") return isOrderActionable(order);
      if (view === "accepted") return Boolean(order.sellerAcceptedAt);
      if (view === "invoiced") return Boolean(order.invoice);
      return true;
    };

    return [...orders]
      .filter(matchesView)
      .sort((a, b) => {
        const aActionable = isOrderActionable(a) ? 1 : 0;
        const bActionable = isOrderActionable(b) ? 1 : 0;
        if (aActionable !== bActionable) return bActionable - aActionable;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [orders, view]);

  const handleAcceptOrder = async (orderId: string) => {
    const note = window.prompt("Optional note for order acceptance:");
    try {
      setError("");
      setNotice("");
      await acceptAwardedBulkOrder(orderId, note || undefined);
      setNotice("Order accepted and invoice issued.");
      await loadOrders();
      setView("invoiced");
    } catch (err: any) {
      setError(err?.message || "Failed to accept order.");
    }
  };

  if (!user) {
    return (
      <main className="ui-page-shell px-4 py-10">
        <div className="ui-card mx-auto max-w-2xl p-8">
          <p className="ui-section-kicker">Bulk seller portal</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">Bulk seller orders</h1>
          <p className="mt-2 text-sm text-stone-600">Sign in first to continue.</p>
          <Link
            to="/login?mode=signup&next=/bulk/seller/orders"
            className="ui-btn-primary mt-5 px-5 py-3 text-sm"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  if (!accessLoading && !canRespond) {
    return (
      <main className="ui-page-shell px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-amber-900">Bulk seller approval required</h1>
          <p className="mt-2 text-sm text-amber-800">
            Apply as a bulk seller first. This page unlocks after admin approval.
          </p>
          <Link
            to="/bulk?role=seller"
            className="mt-5 inline-flex rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Apply as seller
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="ui-page-shell px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <section className="ui-hero-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="ui-section-kicker">
                Seller portal
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">Bulk seller workflow</h1>
              <p className="mt-1 text-sm text-stone-600">
                Review awarded orders, accept fast, and issue invoices cleanly.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/bulk/orders"
                className="ui-btn-secondary px-4 py-2 text-sm"
              >
                Open demand board
              </Link>
              <button
                type="button"
                onClick={loadOrders}
                className="ui-btn-ghost px-4 py-2 text-sm"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <div className="ui-card-soft px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500">Total</p>
              <p className="text-lg font-semibold text-stone-900">{orderStats.total}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-amber-700">Needs action</p>
              <p className="text-lg font-semibold text-amber-900">{orderStats.needsAction}</p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-sky-700">Accepted</p>
              <p className="text-lg font-semibold text-sky-900">{orderStats.accepted}</p>
            </div>
            <div className="rounded-xl border border-[#F3C9BE] bg-[#FDF5F3] px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#A0452E]">Invoiced</p>
              <p className="text-lg font-semibold text-[#7A2F21]">{orderStats.invoiced}</p>
            </div>
          </div>
        </section>

        <section className="ui-card p-3">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(VIEW_LABELS) as SellerView[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setView(option)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  view === option
                    ? "bg-[#A0452E] text-white"
                    : "border border-stone-200 bg-white text-stone-700 hover:bg-[#FDF5F3]"
                }`}
              >
                {VIEW_LABELS[option]}
              </button>
            ))}
          </div>
        </section>

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
          <section className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <article
                key={`seller-order-skeleton-${index}`}
                className="ui-card p-5"
              >
                <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-slate-100" />
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                <div className="mt-4 space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                </div>
              </article>
            ))}
          </section>
        ) : filteredOrders.length === 0 ? (
          <div className="ui-card p-6 text-sm text-stone-500">
            {view === "all"
              ? "No awarded orders yet."
              : `No orders in "${VIEW_LABELS[view]}" right now.`}
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {filteredOrders.map((order) => {
              const invoice = order.invoice || null;
              const acceptedBid = order.acceptedBid || null;
              const needsSellerAcceptance = Boolean(
                order.status === "awarded" &&
                  acceptedBid?.status === "accepted" &&
                  !order.sellerAcceptedAt
              );
              const statusMeta = STATUS_META[order.status] || {
                label: order.status,
                className: "bg-slate-100 text-slate-700",
              };
              const completionMeta =
                COMPLETION_META[order.completionStatus || "pending"] ||
                COMPLETION_META.pending;

              return (
                <article
                  key={order._id}
                  className="ui-card p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(28,25,23,0.08)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#FAF7F2] px-2.5 py-1 text-xs font-semibold text-stone-700">
                        {CATEGORY_LABELS[order.category] || order.category}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${completionMeta.className}`}
                      >
                        {completionMeta.label}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>

                  <h2 className="mt-3 text-lg font-semibold text-stone-900">{order.title}</h2>
                  <p className="mt-1 text-sm text-stone-600">{order.itemName}</p>

                  <div className="mt-4 grid gap-2 rounded-2xl bg-[#FAF7F2] p-3 text-sm text-stone-700">
                    <p>
                      <strong>Buyer:</strong> {order.buyerId?.fullName || "Buyer"}
                    </p>
                    <p>
                      <strong>County:</strong> {order.deliveryLocation?.county || "-"}
                    </p>
                    {(order.deliveryLocation?.constituency || order.deliveryLocation?.ward) && (
                      <p>
                        <strong>Area:</strong>{" "}
                        {[order.deliveryLocation?.ward, order.deliveryLocation?.constituency]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    <p>
                      <strong>Accepted quote:</strong>{" "}
                      {formatCurrency(acceptedBid?.quoteAmount)}
                    </p>
                    <p>
                      <strong>Delivery date:</strong>{" "}
                      {formatDate(acceptedBid?.deliveryDate)}
                    </p>
                    {order.sellerAcceptedAt && (
                      <p>
                        <strong>Seller accepted:</strong> {formatDate(order.sellerAcceptedAt)}
                      </p>
                    )}
                    {order.buyerMarkedCompleteAt && (
                      <p>
                        <strong>Buyer confirmed:</strong> {formatDate(order.buyerMarkedCompleteAt)}
                      </p>
                    )}
                  </div>

                  {invoice && (
                    <div className="mt-4 rounded-xl border border-forest-100 bg-forest-50 p-3 text-sm text-forest-900">
                      <p>
                        <strong>Invoice:</strong> {invoice.invoiceNumber}
                      </p>
                      <p>
                        <strong>Buyer total:</strong> {formatCurrency(invoice.totalBuyerAmount)}
                      </p>
                      <p>
                        <strong>Platform fee:</strong> {formatCurrency(invoice.platformFeeAmount)}
                      </p>
                      <p>
                        <strong>Status:</strong> {invoice.status}
                      </p>
                      <p>
                        <strong>Email:</strong>{" "}
                        {invoice.emailSentAt
                          ? `Sent ${formatDate(invoice.emailSentAt)}`
                          : "Pending"}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      to={`/bulk/orders/${order._id}`}
                      className="ui-btn-ghost px-3 py-1.5 text-xs"
                    >
                      View details
                    </Link>
                    {needsSellerAcceptance && (
                      <button
                        type="button"
                        onClick={() => handleAcceptOrder(order._id)}
                        className="ui-btn-primary px-3 py-1.5 text-xs"
                      >
                        Accept + issue invoice
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
};

export default BulkSellerOrders;
