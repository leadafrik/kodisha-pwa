import React, { useCallback, useEffect, useState } from "react";
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
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Bulk orders</h1>
          <p className="mt-1 text-sm text-slate-600">
            Track institutional demand, bids, and award status.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as "" | "open" | "awarded" | "closed" | "cancelled"
                )
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
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
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
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
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2"
            />
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading bulk orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No bulk orders found.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.map((order) => (
                <article key={order._id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {order.category}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
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
                      <h2 className="mt-2 text-lg font-semibold text-slate-900">{order.title}</h2>
                      <p className="text-sm text-slate-600">
                        {order.itemName} - {order.quantity} {order.unit}
                      </p>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>{order.buyerId?.fullName || "Buyer"}</p>
                      <p>{order.buyerId?.email || "No email"}</p>
                      <p>{order.deliveryLocation?.county || "No county"}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                      Bids: {order.bidCount || 0}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                      Delivery: {order.deliveryScope}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                      Budget: {order.budget?.min ? `KES ${order.budget.min.toLocaleString()}` : "-"}{" "}
                      {order.budget?.max ? `to KES ${order.budget.max.toLocaleString()}` : ""}
                    </span>
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

