import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ClipboardList, RefreshCw, Truck } from "lucide-react";
import {
  listSellerMarketplaceOrders,
  ORDER_PAYMENT_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  SELLER_FULFILLMENT_STATUS_LABELS,
  updateSellerMarketplaceOrderFulfillment,
} from "../services/ordersService";
import { SellerMarketplaceOrder } from "../types/orders";

const formatCurrency = (value: number) => `KES ${value.toLocaleString()}`;

const getStatusTone = (status: string) => {
  if (["delivered", "verified", "confirmed", "ready_to_ship"].includes(status)) {
    return "bg-forest-50 text-forest-700 border-forest-100";
  }
  if (["rejected", "payment_rejected", "cancelled"].includes(status)) {
    return "bg-red-50 text-red-700 border-red-100";
  }
  if (status === "refunded") {
    return "bg-sky-50 text-sky-700 border-sky-100";
  }
  return "bg-[#FDF5F3] text-[#A0452E] border-[#F3C9BE]";
};

const SellerOrders: React.FC = () => {
  const [orders, setOrders] = useState<SellerMarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingOrderId, setWorkingOrderId] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listSellerMarketplaceOrders();
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (loadError: any) {
      setError(loadError?.message || "Unable to load seller orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const stats = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.total += 1;
        if (order.sellerFulfillment?.status === "ready_to_ship") acc.ready += 1;
        if (order.sellerFulfillment?.status === "delivery_in_progress") acc.inProgress += 1;
        if (order.sellerFulfillment?.status === "delivered") acc.delivered += 1;
        return acc;
      },
      { total: 0, ready: 0, inProgress: 0, delivered: 0 }
    );
  }, [orders]);

  const handleFulfillment = async (
    orderId: string,
    nextStatus: "delivery_in_progress" | "delivered"
  ) => {
    setWorkingOrderId(orderId);
    setError("");
    try {
      const note = window.prompt("Delivery note for this update (optional):") || undefined;
      await updateSellerMarketplaceOrderFulfillment(orderId, nextStatus, note);
      await loadOrders();
    } catch (actionError: any) {
      setError(actionError?.message || "Unable to update seller fulfillment.");
    } finally {
      setWorkingOrderId("");
    }
  };

  return (
    <div className="ui-page-shell">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="ui-hero-panel p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="ui-section-kicker">Seller fulfillment</p>
              <h1 className="text-3xl font-bold text-stone-900">Manage delivery after payment clears</h1>
              <p className="mt-2 max-w-3xl text-sm text-stone-600">
                When admin verifies an order against the Agrisoko till, it becomes ready to ship. Update delivery progress here so buyers and admin can track fulfillment cleanly.
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/profile" className="ui-btn-ghost px-4 py-2.5">
                Back to account
              </Link>
              <button type="button" onClick={() => void loadOrders()} className="ui-btn-secondary px-4 py-2.5">
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="ui-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Orders</p>
            <p className="mt-2 text-2xl font-bold text-stone-900">{stats.total}</p>
          </div>
          <div className="ui-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Ready to ship</p>
            <p className="mt-2 text-2xl font-bold text-[#A0452E]">{stats.ready}</p>
          </div>
          <div className="ui-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">In progress</p>
            <p className="mt-2 text-2xl font-bold text-stone-900">{stats.inProgress}</p>
          </div>
          <div className="ui-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Delivered</p>
            <p className="mt-2 text-2xl font-bold text-forest-700">{stats.delivered}</p>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="ui-card mt-6 p-6 text-sm text-stone-500">Loading seller orders...</div>
        ) : orders.length === 0 ? (
          <div className="ui-card mt-6 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-500">
              <ClipboardList className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-stone-900">No seller orders yet</h2>
            <p className="mt-2 text-sm text-stone-600">
              Paid marketplace orders assigned to your listings will appear here once a buyer checks out.
            </p>
            <Link to="/browse" className="ui-btn-primary mt-5 px-5 py-2.5">
              Browse marketplace
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => {
              const sellerStatus = order.sellerFulfillment?.status || "awaiting_payment_confirmation";
              const busy = workingOrderId === order._id;
              const canStartDelivery = order.paymentStatus === "verified" && sellerStatus === "ready_to_ship";
              const canCompleteDelivery =
                order.paymentStatus === "verified" &&
                ["ready_to_ship", "delivery_in_progress"].includes(sellerStatus);

              return (
                <div key={order._id} className="ui-card p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-stone-900">{order.orderNumber}</p>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(order.orderStatus)}`}>
                          {ORDER_STATUS_LABELS[order.orderStatus]}
                        </span>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(order.paymentStatus)}`}>
                          {ORDER_PAYMENT_STATUS_LABELS[order.paymentStatus]}
                        </span>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(sellerStatus)}`}>
                          {SELLER_FULFILLMENT_STATUS_LABELS[sellerStatus]}
                        </span>
                      </div>

                      <div className="grid gap-2 text-sm text-stone-600 md:grid-cols-2 xl:grid-cols-3">
                        <p><span className="font-semibold text-stone-900">Invoice:</span> {order.invoice.invoiceNumber}</p>
                        <p><span className="font-semibold text-stone-900">Buyer:</span> {order.buyerSnapshot.fullName}</p>
                        <p><span className="font-semibold text-stone-900">Contact:</span> {order.contactPhone}</p>
                        <p><span className="font-semibold text-stone-900">County:</span> {order.delivery.county}</p>
                        <p><span className="font-semibold text-stone-900">Delivery target:</span> {new Date(order.delivery.estimatedDeliveryDate).toLocaleDateString()}</p>
                        <p><span className="font-semibold text-stone-900">Your subtotal:</span> {formatCurrency(order.sellerSubtotal || 0)}</p>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {order.items.map((item) => (
                          <div key={`${order._id}-${item.listingId}`} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                            <p className="font-semibold text-stone-900">{item.title}</p>
                            <p className="mt-1 text-xs text-stone-500">
                              {item.quantity} {item.unit || "units"} | {item.county || "Kenya"}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[#A0452E]">{formatCurrency(item.lineTotal)}</p>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
                        <p className="font-semibold text-stone-900">Delivery notes</p>
                        <p className="mt-2">
                          {[order.delivery.approximateLocation, order.delivery.ward, order.delivery.constituency, order.delivery.county]
                            .filter(Boolean)
                            .join(", ") || "Delivery area not specified."}
                        </p>
                        {order.delivery.notes && <p className="mt-2">{order.delivery.notes}</p>}
                        {order.sellerFulfillment?.note && (
                          <p className="mt-2 text-xs text-stone-500">Last update note: {order.sellerFulfillment.note}</p>
                        )}
                      </div>
                    </div>

                    <div className="w-full max-w-sm space-y-4 xl:w-[360px]">
                      <div className="ui-accent-panel p-4 text-sm text-stone-700">
                        <p className="font-semibold text-[#8B3525]">Release conditions</p>
                        <p className="mt-2">
                          Payment must be verified before you move this order into delivery. Admin matches the buyer payer phone and timestamp against the till records.
                        </p>
                      </div>

                      <div className="ui-card-soft p-4 text-sm text-stone-700">
                        <p className="font-semibold text-stone-900">Seller actions</p>
                        <div className="mt-3 grid gap-2">
                          <button
                            type="button"
                            disabled={!canStartDelivery || busy}
                            onClick={() => void handleFulfillment(order._id, "delivery_in_progress")}
                            className="ui-btn-secondary px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Truck className="mr-2 h-4 w-4" /> Delivery in progress
                          </button>
                          <button
                            type="button"
                            disabled={!canCompleteDelivery || busy}
                            onClick={() => void handleFulfillment(order._id, "delivered")}
                            className="rounded-xl border border-forest-100 bg-forest-50 px-4 py-2.5 text-sm font-semibold text-forest-700 transition hover:bg-forest-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Mark delivered
                          </button>
                        </div>
                        <p className="mt-3 text-xs text-stone-500">
                          If the buyer has not paid yet, this stays on payment review. Once verified, start delivery and then mark delivered when the goods reach the buyer.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerOrders;
