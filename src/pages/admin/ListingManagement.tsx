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

const ListingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"pending" | "active">("pending");
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

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
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{item.title || "Listing"}</h3>
                      {item.listingType && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize">
                          {item.listingType.replace("_", " ")}
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
    </div>
  );
};

export default ListingManagement;
