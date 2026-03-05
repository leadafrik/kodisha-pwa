import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  approveAdminBulkApplication,
  listAdminBulkApplications,
  rejectAdminBulkApplication,
} from "../../services/bulkApplicationsService";

type AdminBulkApplication = {
  _id: string;
  role: "buyer" | "seller";
  status: "pending" | "approved" | "rejected";
  contactName: string;
  organizationName: string;
  institutionType: string;
  phone: string;
  email: string;
  products: string[];
  yearsInAgriculture?: number;
  deliveryCoverage: string;
  procurementFrequency?: string;
  monthlyVolume?: string;
  estimatedBudgetPerOrder?: string;
  notes?: string;
  reviewNotes?: string;
  updatedAt?: string;
  createdAt?: string;
  address?: {
    county?: string;
    constituency?: string;
    ward?: string;
    streetAddress?: string;
  };
  userId?: {
    _id: string;
    fullName?: string;
    email?: string;
    phone?: string;
    county?: string;
    role?: string;
  };
  reviewedBy?: {
    fullName?: string;
    email?: string;
  };
};

const BulkApplications: React.FC = () => {
  const [items, setItems] = useState<AdminBulkApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "approved" | "rejected">(
    "pending"
  );
  const [roleFilter, setRoleFilter] = useState<"" | "buyer" | "seller">("");
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await listAdminBulkApplications({
        status: statusFilter,
        role: roleFilter,
        search: search.trim(),
        page: 1,
        limit: 100,
      });
      setItems(Array.isArray(response?.data) ? response.data : []);
      setSummary({
        pending: response?.summary?.pending || 0,
        approved: response?.summary?.approved || 0,
        rejected: response?.summary?.rejected || 0,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to load bulk applications.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, roleFilter, search]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleApprove = async (applicationId: string) => {
    const notes = window.prompt("Approval notes (optional):") || undefined;
    try {
      await approveAdminBulkApplication(applicationId, notes);
      await loadApplications();
    } catch (err: any) {
      setError(err?.message || "Failed to approve application.");
    }
  };

  const handleReject = async (applicationId: string) => {
    const notes =
      window.prompt("Rejection reason (recommended):") || "Application requires more details.";
    try {
      await rejectAdminBulkApplication(applicationId, notes);
      await loadApplications();
    } catch (err: any) {
      setError(err?.message || "Failed to reject application.");
    }
  };

  const visibleItems = useMemo(() => items, [items]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Bulk applications</h1>
          <p className="mt-2 text-sm text-slate-600">
            Review and approve bulk buyer and seller applications separately from C2C flows.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-widest text-slate-500">Pending</p>
              <p className="text-2xl font-semibold text-slate-900">{summary.pending}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-widest text-slate-500">Approved</p>
              <p className="text-2xl font-semibold text-slate-900">{summary.approved}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-widest text-slate-500">Rejected</p>
              <p className="text-2xl font-semibold text-slate-900">{summary.rejected}</p>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "" | "pending" | "approved" | "rejected")
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as "" | "buyer" | "seller")}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">All roles</option>
              <option value="buyer">Bulk buyer</option>
              <option value="seller">Bulk seller</option>
            </select>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search org, person, county..."
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
            <div className="p-6 text-sm text-slate-500">Loading applications...</div>
          ) : visibleItems.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No applications found for this filter.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {visibleItems.map((item) => (
                <article key={item._id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {item.role === "buyer" ? "Bulk buyer" : "Bulk seller"}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.status === "approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : item.status === "rejected"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">
                        {item.organizationName}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {item.contactName} - {item.institutionType}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.address?.county || "County not set"}
                        {item.address?.streetAddress ? `, ${item.address.streetAddress}` : ""}
                      </p>
                    </div>

                    <div className="text-sm text-slate-600">
                      <p>{item.phone}</p>
                      <p>{item.email}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Updated:{" "}
                        {item.updatedAt
                          ? new Date(item.updatedAt).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                      <p className="font-semibold uppercase tracking-widest text-slate-500">
                        Products
                      </p>
                      <p className="mt-1 text-slate-700">
                        {item.products?.length ? item.products.join(", ") : "None"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                      <p className="font-semibold uppercase tracking-widest text-slate-500">
                        Coverage / frequency
                      </p>
                      <p className="mt-1 text-slate-700">
                        {item.deliveryCoverage || "N/A"} / {item.procurementFrequency || "N/A"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                      <p className="font-semibold uppercase tracking-widest text-slate-500">
                        Scale
                      </p>
                      <p className="mt-1 text-slate-700">
                        {item.monthlyVolume || "No monthly volume"}{" "}
                        {item.estimatedBudgetPerOrder ? `| ${item.estimatedBudgetPerOrder}` : ""}
                      </p>
                      {item.role === "seller" && (
                        <p className="mt-1 text-slate-500">
                          Years in agriculture: {item.yearsInAgriculture ?? "N/A"}
                        </p>
                      )}
                    </div>
                  </div>

                  {item.notes && (
                    <p className="mt-3 text-sm text-slate-600">
                      <span className="font-semibold text-slate-800">Application notes:</span>{" "}
                      {item.notes}
                    </p>
                  )}
                  {item.reviewNotes && (
                    <p className="mt-1 text-sm text-slate-600">
                      <span className="font-semibold text-slate-800">Review notes:</span>{" "}
                      {item.reviewNotes}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleApprove(item._id)}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(item._id)}
                      className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                    >
                      Reject
                    </button>
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

export default BulkApplications;
