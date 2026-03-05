import React, { useCallback, useEffect, useState } from "react";
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
  } | null;
};

const formatCurrency = (value?: number) =>
  typeof value === "number" ? `KES ${value.toLocaleString()}` : "-";

const BulkSellerOrders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<SellerAwardedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [canRespond, setCanRespond] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);

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

  const handleAcceptOrder = async (orderId: string) => {
    const note = window.prompt("Optional note for order acceptance:");
    try {
      setError("");
      setNotice("");
      await acceptAwardedBulkOrder(orderId, note || undefined);
      setNotice("Order accepted and invoice issued.");
      await loadOrders();
    } catch (err: any) {
      setError(err?.message || "Failed to accept order.");
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Bulk seller orders</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in first to continue.</p>
          <Link
            to="/login?mode=signup&next=/bulk/seller/orders"
            className="mt-5 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  if (!accessLoading && !canRespond) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
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
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Seller portal
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900">Awarded bulk orders</h1>
              <p className="mt-1 text-sm text-slate-600">
                Accept awarded orders and issue invoices before delivery.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/bulk/orders"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Open demand board
              </Link>
              <button
                type="button"
                onClick={loadOrders}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>
          </div>
        </section>

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
            Loading seller orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            No awarded orders yet.
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {orders.map((order) => {
              const invoice = order.invoice || null;
              const acceptedBid = order.acceptedBid || null;
              const needsSellerAcceptance = Boolean(
                order.status === "awarded" &&
                  acceptedBid?.status === "accepted" &&
                  !order.sellerAcceptedAt
              );

              return (
                <article
                  key={order._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {order.category}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        order.status === "awarded"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <h2 className="mt-3 text-lg font-semibold text-slate-900">{order.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{order.itemName}</p>

                  <div className="mt-4 space-y-1 text-sm text-slate-700">
                    <p>
                      <strong>Buyer:</strong> {order.buyerId?.fullName || "Buyer"}
                    </p>
                    <p>
                      <strong>County:</strong> {order.deliveryLocation?.county}
                    </p>
                    <p>
                      <strong>Accepted quote:</strong>{" "}
                      {formatCurrency(acceptedBid?.quoteAmount)}
                    </p>
                    {acceptedBid?.deliveryDate && (
                      <p>
                        <strong>Delivery date:</strong>{" "}
                        {new Date(acceptedBid.deliveryDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {invoice && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                      <p><strong>Invoice:</strong> {invoice.invoiceNumber}</p>
                      <p>
                        <strong>Total buyer amount:</strong> {formatCurrency(invoice.totalBuyerAmount)}
                      </p>
                      <p><strong>Status:</strong> {invoice.status}</p>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      to={`/bulk/orders/${order._id}`}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      View details
                    </Link>
                    {needsSellerAcceptance && (
                      <button
                        type="button"
                        onClick={() => handleAcceptOrder(order._id)}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Accept order + issue invoice
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

