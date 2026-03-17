import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminApiRequest } from "../../config/api";

type ListingType = "land" | "equipment" | "professional_services" | "agrovet" | "product";

interface AdminListing {
  _id: string;
  listingType?: ListingType;
  title?: string;
  description?: string;
  status?: string;
  isVerified?: boolean;
  createdAt?: string;
  price?: number;
  category?: string;
  contact?: string;
  location?: {
    county?: string;
    constituency?: string;
    ward?: string;
  };
  owner?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

interface EditForm {
  title: string;
  description: string;
  price: string;
  category: string;
}

const PRODUCT_CATEGORIES = ["produce", "livestock", "inputs", "service"] as const;

const CATEGORY_LABELS: Record<string, string> = {
  produce: "Produce",
  livestock: "Livestock",
  inputs: "Inputs",
  service: "Services",
};

const CATEGORY_COLORS: Record<string, string> = {
  produce: "bg-orange-50 text-orange-700 border-orange-200",
  livestock: "bg-rose-50 text-rose-700 border-rose-200",
  inputs: "bg-sky-50 text-sky-700 border-sky-200",
  service: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const ListingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"pending" | "active">("pending");
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [editTarget, setEditTarget] = useState<AdminListing | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ title: "", description: "", price: "", category: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const loadListings = async (tab: "pending" | "active") => {
    try {
      setLoading(true);
      setError("");
      const endpoint =
        tab === "pending" ? "/admin/listings/pending" : "/admin/listings/approved";
      const response = await adminApiRequest(endpoint);
      const data = response?.data || response?.listings || [];
      setListings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load listings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings(activeTab);
  }, [activeTab]);

  const filteredListings = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return listings;
    return listings.filter((item) => {
      const title = item.title?.toLowerCase() || "";
      const contact = item.contact?.toLowerCase() || "";
      const ownerName = item.owner?.name?.toLowerCase() || "";
      const ownerEmail = item.owner?.email?.toLowerCase() || "";
      return (
        title.includes(needle) ||
        contact.includes(needle) ||
        ownerName.includes(needle) ||
        ownerEmail.includes(needle)
      );
    });
  }, [listings, query]);

  const handleVerify = async (listingId: string, status: "approved" | "rejected") => {
    const notes =
      status === "approved"
        ? "Approved by admin"
        : window.prompt("Reason for rejection?") || "Rejected by admin";
    try {
      setActionLoading(listingId);
      await adminApiRequest(`/admin/listings/${listingId}/verify`, {
        method: "PUT",
        body: JSON.stringify({ status, notes }),
      });
      await loadListings(activeTab);
    } catch (err: any) {
      setError(err?.message || "Failed to update listing.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    try {
      setActionLoading(listingId);
      await adminApiRequest(`/admin/listings/${listingId}`, { method: "DELETE" });
      setListings((prev) => prev.filter((item) => item._id !== listingId));
    } catch (err: any) {
      setError(err?.message || "Failed to delete listing.");
    } finally {
      setActionLoading(null);
    }
  };

  const openEdit = (item: AdminListing) => {
    setEditTarget(item);
    setEditForm({
      title: item.title || "",
      description: item.description || "",
      price: item.price !== undefined ? String(item.price) : "",
      category: item.category || "",
    });
    setEditError("");
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    setEditSaving(true);
    setEditError("");
    try {
      const body: Record<string, any> = {};
      if (editForm.title.trim()) body.title = editForm.title.trim();
      if (editForm.description.trim()) body.description = editForm.description.trim();
      if (editForm.price !== "") body.price = Number(editForm.price);
      if (editForm.category) body.category = editForm.category;

      await adminApiRequest(`/admin/listings/${editTarget._id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setListings((prev) =>
        prev.map((item) =>
          item._id === editTarget._id
            ? {
                ...item,
                title: body.title ?? item.title,
                description: body.description ?? item.description,
                price: body.price ?? item.price,
                category: body.category ?? item.category,
              }
            : item
        )
      );
      setEditTarget(null);
    } catch (err: any) {
      setEditError(err?.message || "Failed to save changes.");
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Listing Management</p>
            <h1 className="text-4xl font-bold mt-2">Manage Listings</h1>
            <p className="text-slate-600 mt-2">
              Review new listings, approve or reject, and remove violations.
            </p>
          </div>
          <Link
            to="/admin"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {(["pending", "active"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab === "pending" ? "Pending approval" : "Active listings"}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-white border border-slate-200 p-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, seller, email, or contact..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 text-sm text-slate-500">Loading listings...</div>
        ) : filteredListings.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No listings found.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredListings.map((item) => (
              <div
                key={item._id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold">{item.title || "Listing"}</h3>
                      {item.listingType && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize">
                          {item.listingType.replace("_", " ")}
                        </span>
                      )}
                      {item.category && (
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${CATEGORY_COLORS[item.category] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                          {CATEGORY_LABELS[item.category] || item.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                      {item.description || "No description provided."}
                    </p>
                    <div className="mt-3 text-sm text-slate-600 space-y-1">
                      {item.owner?.name && <div>Seller: {item.owner.name}</div>}
                      {item.owner?.email && <div>Email: {item.owner.email}</div>}
                      {item.contact && <div>Contact: {item.contact}</div>}
                      {item.location?.county && (
                        <div>
                          Location: {[item.location.county, item.location.constituency]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      )}
                      {item.price && (
                        <div>Price: KES {item.price.toLocaleString()}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[180px]">
                    {activeTab === "pending" && (
                      <>
                        <button
                          onClick={() => handleVerify(item._id, "approved")}
                          disabled={actionLoading === item._id}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleVerify(item._id, "rejected")}
                          disabled={actionLoading === item._id}
                          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {item.listingType === "product" && (
                      <button
                        onClick={() => openEdit(item)}
                        disabled={actionLoading === item._id}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item._id)}
                      disabled={actionLoading === item._id}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit listing modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Edit listing</h2>
            <p className="mt-1 text-sm text-slate-500">Only product listings can be edited. Changes take effect immediately.</p>

            {editError && (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {editError}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">— select category —</option>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c === "produce" ? "Produce" : c === "livestock" ? "Livestock" : c === "inputs" ? "Inputs" : "Services"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Price (KES)</label>
                <input
                  type="number"
                  min={0}
                  value={editForm.price}
                  onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setEditTarget(null)}
                disabled={editSaving}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {editSaving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingManagement;
