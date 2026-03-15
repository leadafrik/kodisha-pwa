import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RefreshCw, ShoppingBag } from "lucide-react";
import {
  listMyMarketplaceOrders,
  ORDER_PAYMENT_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  SELLER_FULFILLMENT_STATUS_LABELS,
} from "../services/ordersService";
import { MarketplaceOrder } from "../types/orders";

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

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listMyMarketplaceOrders();
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (loadError: any) {
      setError(loadError?.message || "Unable to load your orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  return (
    <div className="ui-page-shell">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="ui-hero-panel p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="ui-section-kicker">Orders</p>
              <h1 className="text-3xl font-bold text-stone-900">Track your checkouts and delivery progress</h1>
              <p className="mt-2 max-w-2xl text-sm text-stone-600">
                Every order records the payer phone, payment submission time, delivery target, and the current admin review status.
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/browse" className="ui-btn-ghost px-4 py-2.5">
                Browse listings
              </Link>
              <button type="button" onClick={() => void loadOrders()} className="ui-btn-secondary px-4 py-2.5">
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
          <div className="ui-card mt-6 p-6 text-sm text-stone-500">Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="ui-card mt-6 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-500">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-stone-900">No checkout orders yet</h2>
            <p className="mt-2 text-sm text-stone-600">
              Orders from cart checkout, accepted demand offers, and bulk delivery payments appear here with manual verification and delivery tracking.
            </p>
            <Link to="/browse" className="ui-btn-primary mt-5 px-5 py-2.5">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="ui-card p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-stone-900">{order.orderNumber}</p>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(order.orderStatus)}`}>
                        {ORDER_STATUS_LABELS[order.orderStatus]}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(order.paymentStatus)}`}>
                        {ORDER_PAYMENT_STATUS_LABELS[order.paymentStatus]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-stone-600">
                      Invoice {order.invoice?.invoiceNumber || "Pending"} | Submitted {new Date(order.payment.submittedAt).toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-stone-600">
                      Delivery target {new Date(order.delivery.estimatedDeliveryDate).toLocaleDateString()} | {order.items.length} item{order.items.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="text-sm text-stone-500">Total</p>
                    <p className="text-2xl font-bold text-[#A0452E]">{formatCurrency(order.total)}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {order.items.slice(0, 3).map((item) => (
                    <div key={`${order._id}-${item.listingId}`} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                      <p className="font-semibold text-stone-900">{item.title}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {item.quantity} {item.unit || "units"} | {item.sellerName}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#A0452E]">{formatCurrency(item.lineTotal)}</p>
                    </div>
                  ))}
                </div>

                {Array.isArray(order.sellerFulfillment) && order.sellerFulfillment.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {order.sellerFulfillment.map((seller) => (
                      <span
                        key={`${order._id}-${seller.sellerId}`}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(seller.status)}`}
                      >
                        {seller.sellerName}: {SELLER_FULFILLMENT_STATUS_LABELS[seller.status]}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link to={`/orders/${order._id}`} className="ui-btn-primary px-4 py-2.5">
                    Open order <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link to="/browse" className="ui-btn-ghost px-4 py-2.5">
                    Add more items
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
