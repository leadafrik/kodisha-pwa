import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { API_ENDPOINTS, adminApiRequest } from "../config/api";
import { CheckCircle, XCircle, AlertCircle, Eye, MapPin } from "lucide-react";

interface PendingListing {
  _id: string;
  title: string;
  description: string;
  category: string;
  price?: number;
  location?: {
    county: string;
    constituency: string;
    ward: string;
  };
  owner?: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  images?: string[];
  createdAt: string;
  publishStatus: string;
  isDemo?: boolean;
}

const AdminListingsApproval: React.FC = () => {
  const { user } = useAuth();
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<PendingListing | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    if (!user || user.type !== "admin") {
      return;
    }
    fetchPendingListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter]);

  const fetchPendingListings = async () => {
    try {
      setLoading(true);
      const endpoint = 
        filter === "pending" 
          ? API_ENDPOINTS.admin.listings.getPending
          : filter === "approved"
          ? API_ENDPOINTS.admin.listings.getApproved
          : API_ENDPOINTS.admin.listings.getAll;

      const data = await adminApiRequest(endpoint);
      setPendingListings(data.listings || data.data || []);
    } catch (error: any) {
      console.error("Failed to fetch listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (listingId: string) => {
    try {
      setActionLoading(true);
      const endpoint = API_ENDPOINTS.admin.listings.verify(listingId);
      await adminApiRequest(endpoint, {
        method: "PUT",
        body: JSON.stringify({
          status: "approved",
          notes: approvalNotes,
        }),
      });
      setApprovalNotes("");
      setSelectedListing(null);
      await fetchPendingListings();
    } catch (error: any) {
      console.error("Approval failed:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (listingId: string) => {
    try {
      setActionLoading(true);
      const endpoint = API_ENDPOINTS.admin.listings.verify(listingId);
      await adminApiRequest(endpoint, {
        method: "PUT",
        body: JSON.stringify({
          status: "rejected",
          notes: approvalNotes || "Listing does not meet platform standards",
        }),
      });
      setApprovalNotes("");
      setSelectedListing(null);
      await fetchPendingListings();
    } catch (error: any) {
      console.error("Rejection failed:", error);
    } finally {
      setActionLoading(false);
    }
  };

  if (!user || user.type !== "admin") {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-800 mb-2">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access this page. Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Listing Approval Center</h1>
          <p className="text-gray-600">Review and approve user-submitted listings</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
          <div className="flex flex-wrap gap-3">
            {(["pending", "approved", "rejected", "all"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filter === tab
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="inline-flex items-center gap-2">
              <div className="animate-spin h-5 w-5 text-green-600"></div>
              <span className="text-gray-600">Loading listings...</span>
            </div>
          </div>
        ) : pendingListings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-600">No {filter} listings at this time.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingListings.map((listing) => (
              <div
                key={listing._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
              >
                {/* Image */}
                <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300 relative flex items-center justify-center">
                  {listing.images?.[0] ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <span className="text-sm">No image</span>
                    </div>
                  )}
                  {listing.isDemo && (
                    <div className="absolute top-2 left-2 bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                      📋 Sample
                    </div>
                  )}
                  {listing.publishStatus === "pending_verification" && (
                    <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">
                      ⏳ Pending
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{listing.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{listing.description}</p>

                  {/* Category & Price */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
                      {listing.category}
                    </span>
                    {listing.price && (
                      <span className="font-bold text-green-600">KSh {listing.price.toLocaleString()}</span>
                    )}
                  </div>

                  {/* Location */}
                  {listing.location && (
                    <div className="flex items-start gap-2 text-xs text-gray-600 mb-3">
                      <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                      <span>
                        {listing.location.ward}, {listing.location.constituency}, {listing.location.county}
                      </span>
                    </div>
                  )}

                  {/* Seller Info */}
                  {listing.owner && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-3 text-sm">
                      <p className="font-semibold text-gray-900">{listing.owner.fullName}</p>
                      <p className="text-gray-600">{listing.owner.email}</p>
                      <p className="text-gray-600">{listing.owner.phone}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <button
                    onClick={() => setSelectedListing(listing)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                  >
                    <Eye size={16} />
                    Review & Approve/Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedListing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedListing.title}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Listed {new Date(selectedListing.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedListing(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Images */}
                {selectedListing.images && selectedListing.images.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-gray-900">Images</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedListing.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt="Listing"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-semibold text-gray-900">{selectedListing.category}</p>
                  </div>
                  {selectedListing.price && (
                    <div>
                      <p className="text-sm text-gray-600">Price</p>
                      <p className="font-semibold text-green-600">KSh {selectedListing.price.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedListing.location && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">County</p>
                        <p className="font-semibold text-gray-900">{selectedListing.location.county}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Constituency</p>
                        <p className="font-semibold text-gray-900">{selectedListing.location.constituency}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedListing.description}</p>
                </div>

                {/* Seller Info */}
                {selectedListing.owner && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-900 mb-3">Seller Information</h3>
                    <div className="space-y-2">
                      <p className="text-sm"><span className="text-gray-600">Name:</span> <span className="font-semibold">{selectedListing.owner.fullName}</span></p>
                      <p className="text-sm"><span className="text-gray-600">Email:</span> <span className="font-semibold">{selectedListing.owner.email}</span></p>
                      <p className="text-sm"><span className="text-gray-600">Phone:</span> <span className="font-semibold">{selectedListing.owner.phone}</span></p>
                    </div>
                  </div>
                )}

                {/* Notes Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Approval/Rejection Notes
                  </label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Add notes about this listing (optional)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3">
                <button
                  onClick={() => setSelectedListing(null)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-900 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedListing._id)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:bg-gray-400 transition"
                >
                  <XCircle size={18} />
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(selectedListing._id)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:bg-gray-400 transition"
                >
                  <CheckCircle size={18} />
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminListingsApproval;
