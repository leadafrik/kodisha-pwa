import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getMyBulkAccessStatus } from "../services/bulkApplicationsService";
import { BulkOrder, BulkOrderCategory, listBulkOrders } from "../services/bulkOrdersService";
import { kenyaCounties } from "../data/kenyaCounties";

const CATEGORY_OPTIONS: Array<{ value: BulkOrderCategory | ""; label: string }> = [
  { value: "", label: "All categories" },
  { value: "produce", label: "Produce" },
  { value: "livestock", label: "Livestock" },
  { value: "inputs", label: "Inputs" },
  { value: "service", label: "Service" },
];

const formatBudget = (order: BulkOrder) => {
  const min = order.budget?.min;
  const max = order.budget?.max;
  if (typeof min === "number" && typeof max === "number") {
    return `KES ${min.toLocaleString()} - ${max.toLocaleString()}`;
  }
  if (typeof min === "number") return `From KES ${min.toLocaleString()}`;
  if (typeof max === "number") return `Up to KES ${max.toLocaleString()}`;
  return "Budget not set";
};

const BulkOrdersBoard: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<BulkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<BulkOrderCategory | "">("");
  const [county, setCounty] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [canPost, setCanPost] = useState(false);
  const [canRespond, setCanRespond] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);

  const countyOptions = useMemo(() => kenyaCounties.map((county) => county.name), []);

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
        setCanPost(Boolean(status?.canPostB2BDemand || status?.isAdmin));
        setCanRespond(Boolean(status?.canRespondToB2BDemand || status?.isAdmin));
      })
      .catch((err: any) => {
        if (!active) return;
        setError(err?.message || "Unable to verify bulk access.");
      })
      .finally(() => {
        if (active) setAccessLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError("");
      const response = await listBulkOrders({
        mine: mineOnly,
        category,
        county: county || undefined,
        limit: 30,
      });
      setOrders(Array.isArray(response?.data) ? response.data : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load bulk orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [category, county, mineOnly, user]);

  useEffect(() => {
    if (!user) return;
    loadOrders();
  }, [loadOrders, user]);

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Bulk demand board</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in first to access bulk orders.</p>
          <Link
            to="/login?mode=signup&next=/bulk/orders"
            className="mt-5 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Sign in to continue
          </Link>
        </div>
      </main>
    );
  }

  if (!accessLoading && !canPost && !canRespond) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-amber-900">Bulk access required</h1>
          <p className="mt-2 text-sm text-amber-800">
            Apply as a bulk buyer or bulk seller first, then this board unlocks after admin approval.
          </p>
          <Link
            to="/bulk"
            className="mt-5 inline-flex rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Open bulk application
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Agrisoko B2B
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900">Bulk demand board</h1>
              <p className="mt-1 text-sm text-slate-600">
                Institutional orders, supplier bids, and buyer decisions in one workflow.
              </p>
            </div>
            <div className="flex gap-2">
              {canPost && (
                <Link
                  to="/bulk/orders/new"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Post bulk order
                </Link>
              )}
              {canRespond && (
                <Link
                  to="/bulk/seller/orders"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Seller portal
                </Link>
              )}
              <Link
                to="/bulk"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Bulk access status
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as BulkOrderCategory | "")}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={county}
              onChange={(event) => setCounty(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">All counties</option>
              {countyOptions.map((countyName) => (
                <option key={countyName} value={countyName}>
                  {countyName}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={mineOnly}
                onChange={(event) => setMineOnly(event.target.checked)}
              />
              My orders only
            </label>
            <button
              type="button"
              onClick={loadOrders}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading bulk orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            No bulk orders match this filter yet.
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {orders.map((order) => (
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
                <h2 className="mt-3 text-lg font-semibold text-slate-900">{order.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{order.itemName}</p>

                <div className="mt-4 grid gap-2 text-sm text-slate-700">
                  <p>
                    <strong>Quantity:</strong> {order.quantity} {order.unit}
                  </p>
                  <p>
                    <strong>Budget:</strong> {formatBudget(order)}
                  </p>
                  <p>
                    <strong>Delivery:</strong> {order.deliveryLocation?.county} ({order.deliveryScope})
                  </p>
                  <p>
                    <strong>Bids:</strong> {order.bidCount || 0}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/bulk/orders/${order._id}`}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    View details
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
};

export default BulkOrdersBoard;
