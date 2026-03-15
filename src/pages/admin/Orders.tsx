import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  listAdminMarketplaceOrders,
  ORDER_PAYMENT_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  SELLER_FULFILLMENT_STATUS_LABELS,
  updateAdminMarketplaceOrderPayment,
  updateAdminMarketplaceOrderStatus,
} from "../../services/ordersService";
import { MarketplaceOrder } from "../../types/orders";

const formatCurrency = (value: number) => `KES ${value.toLocaleString()}`;

const getStatusTone = (status: string) => {
  if (status === "delivered" || status === "verified" || status === "confirmed") {
    return "bg-forest-50 text-forest-700 border-forest-100";
  }
  if (status === "rejected" || status === "payment_rejected" || status === "cancelled") {
    return "bg-red-50 text-red-700 border-red-100";
  }
  if (status === "refunded") {
    return "bg-sky-50 text-sky-700 border-sky-100";
  }
  return "bg-[#FDF5F3] text-[#A0452E] border-[#F3C9BE]";
};

const paymentStatusOptions = ["", "submitted", "verified", "rejected", "refunded"];
const orderStatusOptions = ["", "payment_review", "confirmed", "processing", "delivered", "payment_rejected", "cancelled", "refunded"];

const AdminOrders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [workingOrderId, setWorkingOrderId] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    paymentReviewCount: 0,
    confirmedCount: 0,
    deliveredCount: 0,
  });

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listAdminMarketplaceOrders({
        search: search.trim() || undefined,
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
      });
      setOrders(Array.isArray(response.data) ? response.data : []);
      setStats(
        response.stats || {
          total: 0,
          paymentReviewCount: 0,
          confirmedCount: 0,
          deliveredCount: 0,
        }
      );
    } catch (loadError: any) {
      setError(loadError?.message || "Unable to load marketplace orders.");
    } finally {
      setLoading(false);
    }
  }, [paymentStatus, search, status]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handlePaymentAction = async (orderId: string, action: "verify" | "reject" | "refund") => {
    setWorkingOrderId(orderId);
    setError("");
    try {
      const note = window.prompt("Admin note (optional):") || undefined;
      await updateAdminMarketplaceOrderPayment(orderId, action, note);
      await loadOrders();
    } catch (actionError: any) {
      setError(actionError?.message || "Unable to update payment status.");
    } finally {
      setWorkingOrderId("");
    }
  };

  const handleStatusAction = async (
    orderId: string,
    nextStatus: "processing" | "delivered" | "cancelled"
  ) => {
    setWorkingOrderId(orderId);
    setError("");
    try {
      const note = window.prompt("Admin note (optional):") || undefined;
      await updateAdminMarketplaceOrderStatus(orderId, nextStatus, note);
      await loadOrders();
    } catch (actionError: any) {
      setError(actionError?.message || "Unable to update order status.");
    } finally {
      setWorkingOrderId("");
    }
  };

  const highlightedOrder = useMemo(
    () => orders.find((item) => item.orderStatus === "payment_review") || orders[0],
    [orders]
  );

  const isAdmin =
    user?.role === "admin" || user?.role === "super_admin" || user?.role === "moderator";

  if (!isAdmin) {
    return (
      <div className="ui-page-shell">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <div className="ui-card p-8 text-center">
            <p className="ui-section-kicker">Access restricted</p>
            <h1 className="mt-2 text-3xl font-bold text-stone-900">Admin access only</h1>
            <p className="mt-3 text-sm text-stone-600">
              Marketplace order verification is restricted to admin roles.
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
              <p className="ui-section-kicker">Admin checkout review</p>
              <h1 className="text-3xl font-bold text-stone-900">Marketplace orders and manual payment verification</h1>
              <p className="mt-2 max-w-3xl text-sm text-stone-600">
                Review payer phone numbers, timestamps, till details, and delivery commitments before moving an order into fulfillment.
              </p>
            </div>
            <button type="button" onClick={() => void loadOrders()} className="ui-btn-secondary px-4 py-2.5">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh queue
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="ui-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Total</p>
            <p className="mt-2 text-2xl font-bold text-stone-900">{stats.total}</p>
          </div>
          <div className="ui-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Payment review</p>
            <p className="mt-2 text-2xl font-bold text-[#A0452E]">{stats.paymentReviewCount}</p>
          </div>
          <div className="ui-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Confirmed</p>
            <p className="mt-2 text-2xl font-bold text-stone-900">{stats.confirmedCount}</p>
          </div>
          <div className="ui-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Delivered</p>
            <p className="mt-2 text-2xl font-bold text-stone-900">{stats.deliveredCount}</p>
          </div>
        </div>

        <div className="ui-card mt-6 p-5">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
            <label>
              <span className="ui-label">Search</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="ui-input"
                placeholder="Order number, buyer, email, or payer phone"
              />
            </label>
            <label>
              <span className="ui-label">Order status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="ui-input">
                {orderStatusOptions.map((option) => (
                  <option key={option || "all-statuses"} value={option}>
                    {option ? ORDER_STATUS_LABELS[option as keyof typeof ORDER_STATUS_LABELS] : "All order statuses"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="ui-label">Payment status</span>
              <select
                value={paymentStatus}
                onChange={(event) => setPaymentStatus(event.target.value)}
                className="ui-input"
              >
                {paymentStatusOptions.map((option) => (
                  <option key={option || "all-payment-statuses"} value={option}>
                    {option ? ORDER_PAYMENT_STATUS_LABELS[option as keyof typeof ORDER_PAYMENT_STATUS_LABELS] : "All payment statuses"}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button type="button" onClick={() => void loadOrders()} className="ui-btn-primary w-full px-4 py-2.5">
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

        {highlightedOrder && (
          <div className="ui-accent-panel mt-6 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A0452E]">Current focus</p>
            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-lg font-semibold text-stone-900">{highlightedOrder.orderNumber}</p>
                <p className="mt-1 text-sm text-stone-700">
                  {highlightedOrder.buyerSnapshot.fullName} | payer {highlightedOrder.payment.payerPhone} | submitted {new Date(highlightedOrder.payment.submittedAt).toLocaleString()}
                </p>
              </div>
              <Link to={`/orders/${highlightedOrder._id}`} className="ui-btn-primary px-4 py-2.5">
                Open order
              </Link>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="ui-card p-6 text-sm text-stone-500">Loading marketplace orders...</div>
          ) : orders.length === 0 ? (
            <div className="ui-card p-6 text-sm text-stone-500">No orders match the current filters.</div>
          ) : (
            orders.map((order) => {
              const busy = workingOrderId === order._id;
              return (
                <div key={order._id} className="ui-card p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-stone-900">{order.orderNumber}</p>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(order.orderStatus)}`}>
                          {ORDER_STATUS_LABELS[order.orderStatus]}
                        </span>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(order.paymentStatus)}`}>
                          {ORDER_PAYMENT_STATUS_LABELS[order.paymentStatus]}
                        </span>
                      </div>
                      <div className="grid gap-2 text-sm text-stone-600 md:grid-cols-2 xl:grid-cols-3">
                        <p><span className="font-semibold text-stone-900">Invoice:</span> {order.invoice?.invoiceNumber || "Pending"}</p>
                        <p><span className="font-semibold text-stone-900">Buyer:</span> {order.buyerSnapshot.fullName}</p>
                        <p><span className="font-semibold text-stone-900">Contact:</span> {order.contactPhone}</p>
                        <p><span className="font-semibold text-stone-900">Payer phone:</span> {order.payment.payerPhone}</p>
                        <p><span className="font-semibold text-stone-900">Submitted:</span> {new Date(order.payment.submittedAt).toLocaleString()}</p>
                        <p><span className="font-semibold text-stone-900">Till:</span> {order.payment.tillNumber}</p>
                        <p><span className="font-semibold text-stone-900">Delivery target:</span> {new Date(order.delivery.estimatedDeliveryDate).toLocaleDateString()}</p>
                        <p><span className="font-semibold text-stone-900">Items subtotal:</span> {formatCurrency(order.subtotal || 0)}</p>
                        <p><span className="font-semibold text-stone-900">Fees:</span> {formatCurrency((order.deliveryFee || 0) + (order.platformFee || 0))}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-semibold text-stone-500">
                        {order.items.map((item) => (
                          <span key={`${order._id}-${item.listingId}`} className="rounded-full bg-stone-100 px-3 py-1">
                            {item.title} x {item.quantity}
                          </span>
                        ))}
                      </div>
                      {Array.isArray(order.sellerFulfillment) && order.sellerFulfillment.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-xs font-semibold">
                          {order.sellerFulfillment.map((entry) => (
                            <span
                              key={`${order._id}-${entry.sellerId}`}
                              className={`rounded-full border px-3 py-1 ${getStatusTone(entry.status)}`}
                            >
                              {entry.sellerName}: {SELLER_FULFILLMENT_STATUS_LABELS[entry.status]}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="w-full max-w-xl space-y-3 xl:w-[420px]">
                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                        <span className="text-sm text-stone-600">Order total</span>
                        <span className="text-lg font-semibold text-[#A0452E]">{formatCurrency(order.total)}</span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button type="button" disabled={busy} onClick={() => void handlePaymentAction(order._id, "verify")} className="ui-btn-primary px-4 py-2.5">
                          Verify payment
                        </button>
                        <button type="button" disabled={busy} onClick={() => void handlePaymentAction(order._id, "reject")} className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60">
                          Reject payment
                        </button>
                        <button type="button" disabled={busy} onClick={() => void handleStatusAction(order._id, "processing")} className="ui-btn-secondary px-4 py-2.5">
                          Mark processing
                        </button>
                        <button type="button" disabled={busy} onClick={() => void handleStatusAction(order._id, "delivered")} className="rounded-xl border border-forest-100 bg-forest-50 px-4 py-2.5 text-sm font-semibold text-forest-700 transition hover:bg-forest-100 disabled:opacity-60">
                          Mark delivered
                        </button>
                        <button type="button" disabled={busy} onClick={() => void handlePaymentAction(order._id, "refund")} className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60">
                          Refund
                        </button>
                        <button type="button" disabled={busy} onClick={() => void handleStatusAction(order._id, "cancelled")} className="ui-btn-ghost px-4 py-2.5">
                          Cancel
                        </button>
                      </div>
                      <Link to={`/orders/${order._id}`} className="ui-btn-ghost w-full px-4 py-2.5">
                        Open full order detail
                      </Link>
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

export default AdminOrders;
