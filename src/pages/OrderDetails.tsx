import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  getMarketplaceOrderById,
  MARKETPLACE_ESTIMATED_DELIVERY_DAYS,
  MARKETPLACE_MPESA_MERCHANT_NAME,
  ORDER_PAYMENT_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  SELLER_FULFILLMENT_STATUS_LABELS,
  updateAdminMarketplaceOrderPayment,
  updateAdminMarketplaceOrderStatus,
} from "../services/ordersService";
import { MarketplaceOrder } from "../types/orders";

const formatCurrency = (value: number) => `KES ${value.toLocaleString()}`;
const getOrderSourceLabel = (sourceType?: string) => {
  if (sourceType === "buyer_request_offer") return "Buy request offer";
  if (sourceType === "bulk_offer") return "Bulk delivery offer";
  return "Cart checkout";
};

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

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<MarketplaceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.role === "admin" || user?.role === "super_admin" || user?.role === "moderator";

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError("");
    try {
      const response = await getMarketplaceOrderById(orderId);
      setOrder(response.data);
      setAdminNote(response.data.adminNote || "");
    } catch (loadError: any) {
      setError(loadError?.message || "Unable to load the order.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const handlePaymentAction = async (action: "verify" | "reject" | "refund") => {
    if (!orderId) return;
    setSaving(true);
    setError("");
    try {
      await updateAdminMarketplaceOrderPayment(orderId, action, adminNote || undefined);
      await loadOrder();
    } catch (actionError: any) {
      setError(actionError?.message || "Unable to update payment status.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusAction = async (nextStatus: "processing" | "delivered" | "cancelled") => {
    if (!orderId) return;
    setSaving(true);
    setError("");
    try {
      await updateAdminMarketplaceOrderStatus(orderId, nextStatus, adminNote || undefined);
      await loadOrder();
    } catch (actionError: any) {
      setError(actionError?.message || "Unable to update order status.");
    } finally {
      setSaving(false);
    }
  };

  const groupedSellers = useMemo(() => {
    if (!order) return [] as Array<{ sellerName: string; total: number; itemCount: number }>;
    const buckets = new Map<string, { sellerName: string; total: number; itemCount: number }>();
    order.items.forEach((item) => {
      const key = item.sellerId || item.sellerName;
      const existing = buckets.get(key) || {
        sellerName: item.sellerName,
        total: 0,
        itemCount: 0,
      };
      existing.total += item.lineTotal;
      existing.itemCount += 1;
      buckets.set(key, existing);
    });
    return Array.from(buckets.values());
  }, [order]);

  return (
    <div className="ui-page-shell">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="ui-hero-panel p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="ui-section-kicker">Order details</p>
              <h1 className="text-3xl font-bold text-stone-900">{order?.orderNumber || "Marketplace order"}</h1>
              <p className="mt-2 max-w-2xl text-sm text-stone-600">
                Your order is in payment review. Once your M-PESA payment is matched to this order, it will be released for fulfilment.
              </p>
            </div>
            <div className="flex gap-2">
              <Link to={isAdmin ? "/admin/orders" : "/orders"} className="ui-btn-ghost px-4 py-2.5">
                Back to {isAdmin ? "admin orders" : "my orders"}
              </Link>
              <button type="button" onClick={() => void loadOrder()} className="ui-btn-secondary px-4 py-2.5">
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="ui-card mt-6 p-6 text-sm text-stone-500">Loading order...</div>
        ) : !order ? (
          <div className="ui-card mt-6 p-6 text-sm text-stone-500">Order not found.</div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="ui-card p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(order.orderStatus)}`}>
                    {ORDER_STATUS_LABELS[order.orderStatus]}
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(order.paymentStatus)}`}>
                    {ORDER_PAYMENT_STATUS_LABELS[order.paymentStatus]}
                  </span>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Invoice</p>
                    <p className="mt-1 text-sm font-semibold text-stone-900">{order.invoice?.invoiceNumber || "Pending"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Source</p>
                    <p className="mt-1 text-sm font-semibold text-stone-900">
                      {getOrderSourceLabel(order.source?.type)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Total</p>
                    <p className="mt-1 text-2xl font-bold text-[#A0452E]">{formatCurrency(order.total)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Submitted</p>
                    <p className="mt-1 text-sm font-semibold text-stone-900">
                      {new Date(order.payment.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Estimated delivery</p>
                    <p className="mt-1 text-sm font-semibold text-stone-900">
                      {new Date(order.delivery.estimatedDeliveryDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-stone-600">
                  An invoice PDF has been sent to your email address.
                </p>
                <div className="mt-4 grid gap-2 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
                  <div className="flex items-center justify-between">
                    <span>Items subtotal</span>
                    <span className="font-semibold text-stone-900">{formatCurrency(order.subtotal || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Delivery fee</span>
                    <span className="font-semibold text-stone-900">{formatCurrency(order.deliveryFee || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Agrisoko fee</span>
                    <span className="font-semibold text-stone-900">{formatCurrency(order.platformFee || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="ui-card p-5">
                <p className="ui-section-kicker">Items</p>
                <h2 className="mt-2 text-xl font-semibold text-stone-900">What was ordered</h2>
                <div className="mt-4 space-y-4">
                  {order.items.map((item) => (
                    <div key={`${order._id}-${item.listingId}`} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-lg font-semibold text-stone-900">{item.title}</p>
                          <p className="mt-1 text-sm text-stone-600">
                            {item.sellerName} {item.county ? `| ${item.county}` : ""}
                          </p>
                          <p className="mt-1 text-xs text-stone-500">
                            {item.quantity} {item.unit || "units"} at {formatCurrency(item.price)}
                          </p>
                        </div>
                        <p className="text-lg font-semibold text-[#A0452E]">{formatCurrency(item.lineTotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ui-card p-5">
                <p className="ui-section-kicker">Delivery</p>
                <h2 className="mt-2 text-xl font-semibold text-stone-900">Delivery and guarantee</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
                    <p><span className="font-semibold text-stone-900">County:</span> {order.delivery.county}</p>
                    {order.delivery.constituency && (
                      <p className="mt-1"><span className="font-semibold text-stone-900">Constituency:</span> {order.delivery.constituency}</p>
                    )}
                    {order.delivery.ward && (
                      <p className="mt-1"><span className="font-semibold text-stone-900">Ward:</span> {order.delivery.ward}</p>
                    )}
                    {order.delivery.approximateLocation && (
                      <p className="mt-1"><span className="font-semibold text-stone-900">Approximate location:</span> {order.delivery.approximateLocation}</p>
                    )}
                    {order.delivery.notes && (
                      <p className="mt-2"><span className="font-semibold text-stone-900">Notes:</span> {order.delivery.notes}</p>
                    )}
                  </div>
                  <div className="ui-success-panel p-4 text-sm text-forest-700">
                    <p className="font-semibold">Money-back guarantee</p>
                    <p className="mt-2">
                      If payment is verified and the order is not delivered, Agrisoko can review the case and refund manually.
                    </p>
                    <p className="mt-2 text-xs">
                      Delivery target: within {order.delivery.estimatedDeliveryDays || MARKETPLACE_ESTIMATED_DELIVERY_DAYS} days after payment review clears.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="ui-card p-5">
                <p className="ui-section-kicker">Payment review</p>
                <h2 className="mt-2 text-xl font-semibold text-stone-900">What admin sees</h2>
                <div className="mt-4 space-y-3 text-sm text-stone-700">
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    <p><span className="font-semibold text-stone-900">Payer phone:</span> {order.payment.payerPhone}</p>
                    <p className="mt-1"><span className="font-semibold text-stone-900">Phone source:</span> {order.payment.payerPhoneSource === "account" ? "Account phone" : "Different M-Pesa number"}</p>
                    {order.payment.buyerPhoneOnRecord && (
                      <p className="mt-1"><span className="font-semibold text-stone-900">Phone on account:</span> {order.payment.buyerPhoneOnRecord}</p>
                    )}
                    <p className="mt-1"><span className="font-semibold text-stone-900">Submitted at:</span> {new Date(order.payment.submittedAt).toLocaleString()}</p>
                    <p className="mt-1"><span className="font-semibold text-stone-900">Contact phone:</span> {order.contactPhone}</p>
                  </div>
                  <div className="ui-accent-panel p-4">
                    <p className="font-semibold text-[#8B3525]">Till reference used</p>
                    <p className="mt-2">Till number: <span className="font-semibold">{order.payment.tillNumber}</span></p>
                    <p className="mt-1">Merchant name: <span className="font-semibold">{MARKETPLACE_MPESA_MERCHANT_NAME}</span></p>
                  </div>
                </div>
              </div>

              <div className="ui-card-soft p-5 text-sm text-stone-700">
                <p className="font-semibold text-stone-900">Fulfillment summary</p>
                <div className="mt-3 space-y-2">
                  {groupedSellers.map((seller) => (
                    <div key={seller.sellerName} className="flex items-center justify-between gap-3">
                      <span>{seller.sellerName}</span>
                      <span className="font-semibold text-stone-900">
                        {seller.itemCount} item{seller.itemCount === 1 ? "" : "s"} | {formatCurrency(seller.total)}
                      </span>
                    </div>
                  ))}
                </div>
                {order.customerNote && (
                  <div className="mt-4 rounded-2xl border border-stone-200 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Buyer note</p>
                    <p className="mt-2 text-sm text-stone-700">{order.customerNote}</p>
                  </div>
                )}
              </div>

              {Array.isArray(order.sellerFulfillment) && order.sellerFulfillment.length > 0 && (
                <div className="ui-card p-5">
                  <p className="ui-section-kicker">Seller progress</p>
                  <h2 className="mt-2 text-xl font-semibold text-stone-900">Delivery status by seller</h2>
                  <div className="mt-4 space-y-3">
                    {order.sellerFulfillment.map((entry) => (
                      <div key={`${order._id}-${entry.sellerId}`} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-semibold text-stone-900">{entry.sellerName}</p>
                            <p className="mt-1 text-xs text-stone-500">
                              Updated {new Date(entry.updatedAt).toLocaleString()}
                            </p>
                          </div>
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(entry.status)}`}>
                            {SELLER_FULFILLMENT_STATUS_LABELS[entry.status]}
                          </span>
                        </div>
                        {entry.note && <p className="mt-3 text-sm text-stone-700">{entry.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isAdmin && (
                <div className="ui-card p-5">
                  <p className="ui-section-kicker">Admin controls</p>
                  <h2 className="mt-2 text-xl font-semibold text-stone-900">Review payment and move the order forward</h2>
                  <textarea
                    value={adminNote}
                    onChange={(event) => setAdminNote(event.target.value)}
                    className="ui-input mt-4 min-h-[110px]"
                    placeholder="Internal note about payment match, delivery coordination, refund reason, or buyer communication."
                  />
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <button type="button" disabled={saving} onClick={() => void handlePaymentAction("verify")} className="ui-btn-primary px-4 py-2.5">
                      Verify payment
                    </button>
                    <button type="button" disabled={saving} onClick={() => void handlePaymentAction("reject")} className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60">
                      Reject payment
                    </button>
                    <button type="button" disabled={saving} onClick={() => void handleStatusAction("processing")} className="ui-btn-secondary px-4 py-2.5">
                      Mark processing
                    </button>
                    <button type="button" disabled={saving} onClick={() => void handleStatusAction("delivered")} className="rounded-xl border border-forest-100 bg-forest-50 px-4 py-2.5 text-sm font-semibold text-forest-700 transition hover:bg-forest-100 disabled:opacity-60">
                      Mark delivered
                    </button>
                    <button type="button" disabled={saving} onClick={() => void handleStatusAction("cancelled")} className="ui-btn-ghost px-4 py-2.5">
                      Cancel order
                    </button>
                    <button type="button" disabled={saving} onClick={() => void handlePaymentAction("refund")} className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60">
                      Refund
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
