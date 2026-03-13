import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listAdminBulkOrders } from "../../services/bulkOrdersService";

type AdminBulkOrder = {
  _id: string;
  title: string;
  itemName: string;
  category: "produce" | "livestock" | "inputs" | "service";
  status: "open" | "awarded" | "closed" | "cancelled";
  quantity: number;
  unit: string;
  bidCount: number;
  deliveryScope: string;
  deliveryLocation?: { county?: string };
  budget?: { min?: number; max?: number };
  buyerId?: { fullName?: string; email?: string; phone?: string };
  createdAt?: string;
  updatedAt?: string;
};

const BulkOrdersAdmin: React.FC = () => {
  const [orders, setOrders] = useState<AdminBulkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"" | "open" | "awarded" | "closed" | "cancelled">("");
  const [category, setCategory] = useState<"" | "produce" | "livestock" | "inputs" | "service">(
    ""
  );
  const [search, setSearch] = useState("");

  const summary = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.total += 1;
        if (order.status === "open") acc.open += 1;
        if (order.status === "awarded") acc.awarded += 1;
        if (order.status === "closed") acc.closed += 1;
        return acc;
      },
      { total: 0, open: 0, awarded: 0, closed: 0 }
    );
  }, [orders]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await listAdminBulkOrders({
        status,
        category,
        search: search.trim() || undefined,
        limit: 100,
      });
      setOrders(Array.isArray(response?.data) ? response.data : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load bulk orders.");
    } finally {
      setLoading(false);
    }
  }, [category, search, status]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <main className="ui-page-shell p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="ui-hero-panel p-6">
          <p className="ui-section-kicker">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">Bulk orders</h1>
          <p className="mt-1 text-sm text-stone-600">
            Track institutional demand, bids, and award status.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="ui-card-soft px-4 py-3">
              <p className="text-xs uppercase tracking-widest text-stone-500">Total</p>
              <p className="text-2xl font-semibold text-stone-900">{summary.total}</p>
            </div>
            <div className="ui-card-soft px-4 py-3">
              <p className="text-xs uppercase tracking-widest text-stone-500">Open</p>
              <p className="text-2xl font-semibold text-stone-900">{summary.open}</p>
            </div>
            <div className="ui-card-soft px-4 py-3">
              <p className="text-xs uppercase tracking-widest text-stone-500">Awarded</p>
              <p className="text-2xl font-semibold text-stone-900">{summary.awarded}</p>
            </div>
            <div className="ui-card-soft px-4 py-3">
              <p className="text-xs uppercase tracking-widest text-stone-500">Closed</p>
              <p className="text-2xl font-semibold text-stone-900">{summary.closed}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as "" | "open" | "awarded" | "closed" | "cancelled"
                )
              }
              className="ui-input"
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="awarded">Awarded</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value as "" | "produce" | "livestock" | "inputs" | "service"
                )
              }
              className="ui-input"
            >
              <option value="">All categories</option>
              <option value="produce">Produce</option>
              <option value="livestock">Livestock</option>
              <option value="inputs">Inputs</option>
              <option value="service">Service</option>
            </select>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, item, county..."
              className="ui-input md:col-span-2"
            />
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <section className="ui-card overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-stone-500">Loading bulk orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-6 text-sm text-stone-500">No bulk orders found.</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {orders.map((order) => (
                <article key={order._id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#FAF7F2] px-2.5 py-1 text-xs font-semibold text-stone-700">
                          {order.category}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            order.status === "open"
                              ? "bg-[#FDF5F3] text-[#A0452E]"
                              : order.status === "awarded"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <h2 className="mt-2 text-lg font-semibold text-stone-900">{order.title}</h2>
                      <p className="text-sm text-stone-600">
                        {order.itemName} - {order.quantity} {order.unit}
                      </p>
                    </div>
                    <div className="text-sm text-stone-600">
                      <p>{order.buyerId?.fullName || "Buyer"}</p>
                      <p>{order.buyerId?.email || "No email"}</p>
                      <p>{order.deliveryLocation?.county || "No county"}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-stone-600">
                    <span className="rounded-full border border-stone-200 bg-[#FAF7F2] px-2.5 py-1">
                      Bids: {order.bidCount || 0}
                    </span>
                    <span className="rounded-full border border-stone-200 bg-[#FAF7F2] px-2.5 py-1">
                      Delivery: {order.deliveryScope}
                    </span>
                    <span className="rounded-full border border-stone-200 bg-[#FAF7F2] px-2.5 py-1">
                      Budget: {order.budget?.min ? `KES ${order.budget.min.toLocaleString()}` : "-"}{" "}
                      {order.budget?.max ? `to KES ${order.budget.max.toLocaleString()}` : ""}
                    </span>
                  </div>
                  <div className="mt-4">
                    <Link
                      to={`/bulk/orders/${order._id}`}
                      className="ui-btn-ghost px-4 py-2 text-sm"
                    >
                      Open order
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default BulkOrdersAdmin;
