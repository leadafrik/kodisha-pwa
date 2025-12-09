import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { adminApiRequest } from "../config/api";
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

interface IDVerification {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  idDocumentUrl: string;
  selfieUrl: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  notes?: string;
}

const AdminIDVerification: React.FC = () => {
  const { user } = useAuth();
  const [verifications, setVerifications] = useState<IDVerification[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<IDVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">(
    "pending"
  );
  const [selectedVerification, setSelectedVerification] = useState<IDVerification | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewingStatus, setReviewingStatus] = useState<"approved" | "rejected" | null>(null);

  // Check admin authorization
  if (user?.type !== "admin" && user?.role !== "admin") {
    return (
      <div className="max-w-4xl mx-auto pt-8 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-800 font-semibold">Not authorized to access this page</p>
        </div>
      </div>
    );
  }

  // Load verifications
  useEffect(() => {
    loadVerifications();
  }, [filterStatus]);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      setError("");

      const endpoint =
        filterStatus === "pending" ? "/admin/verification/id/pending" : "/verification/id/status";

      const response = await adminApiRequest(endpoint, {
        method: "GET",
      });

      if (response.success) {
        const data = Array.isArray(response.verifications)
          ? response.verifications
          : [response.verification].filter(Boolean);

        const filtered =
          filterStatus === "all"
            ? data
            : data.filter((v: IDVerification) => v.status === filterStatus);

        setVerifications(filtered);
        setFilteredVerifications(filtered);
      } else {
        setError(response.message || "Failed to load verifications");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load verifications");
    } finally {
      setLoading(false);
    }
  };

  // Filter by search term
  useEffect(() => {
    const filtered = verifications.filter(
      (v) =>
        v.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.userId.phone.includes(searchTerm)
    );
    setFilteredVerifications(filtered);
  }, [searchTerm, verifications]);

  const handleReview = async (verificationId: string, status: "approved" | "rejected") => {
    try {
      setReviewingId(verificationId);
      setReviewingStatus(status);

      const response = await adminApiRequest(`/admin/verification/id/${verificationId}/review`, {
        method: "PUT",
        body: JSON.stringify({
          status,
          notes: reviewNotes,
        }),
      });

      if (response.success) {
        // Remove from pending list or update status
        setVerifications((prev) =>
          prev.map((v) => (v._id === verificationId ? { ...v, status } : v))
        );
        setSelectedVerification(null);
        setReviewNotes("");

        // Reload to get fresh data
        await loadVerifications();
      } else {
        setError(response.message || "Failed to review verification");
      }
    } catch (err: any) {
      setError(err.message || "Failed to review verification");
    } finally {
      setReviewingId(null);
      setReviewingStatus(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-semibold">
            <Clock size={14} /> Pending Review
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
            <CheckCircle size={14} /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-semibold">
            <XCircle size={14} /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto pt-8 px-4 pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">ID Verification Review</h1>
        <p className="text-gray-600">Review and approve user identity documents</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(["pending", "approved", "rejected", "all"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              filterStatus === status
                ? "border-green-600 text-green-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin h-12 w-12 border-4 border-green-600 border-t-transparent rounded-full"></div>
          <p className="text-gray-600 mt-4">Loading verifications...</p>
        </div>
      ) : filteredVerifications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            {filterStatus === "pending" ? "No pending verifications" : "No verifications found"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredVerifications.map((verification) => (
            <div
              key={verification._id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition cursor-pointer"
              onClick={() => setSelectedVerification(verification)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {verification.userId.name}
                    </h3>
                    {getStatusBadge(verification.status)}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Email: {verification.userId.email}</p>
                    <p>Phone: {verification.userId.phone}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Submitted: {new Date(verification.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <ChevronDown className="text-gray-400 mt-1" size={24} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">ID Verification Review</h2>
              <button
                onClick={() => {
                  setSelectedVerification(null);
                  setReviewNotes("");
                }}
                className="text-2xl font-bold hover:text-green-200"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">User Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{selectedVerification.userId.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{selectedVerification.userId.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold">{selectedVerification.userId.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    {getStatusBadge(selectedVerification.status)}
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">ID Document</h3>
                {selectedVerification.idDocumentUrl ? (
                  <img
                    src={selectedVerification.idDocumentUrl}
                    alt="ID Document"
                    className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
                  />
                ) : (
                  <p className="text-gray-500">No ID document provided</p>
                )}
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">Selfie with ID</h3>
                {selectedVerification.selfieUrl ? (
                  <img
                    src={selectedVerification.selfieUrl}
                    alt="Selfie"
                    className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
                  />
                ) : (
                  <p className="text-gray-500">No selfie provided</p>
                )}
              </div>

              {/* Review Notes */}
              {selectedVerification.status === "pending" && (
                <>
                  <div>
                    <label className="block font-bold text-gray-900 mb-2">Review Notes</label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add notes about this verification (optional)..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                      rows={4}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedVerification(null);
                        setReviewNotes("");
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-900 hover:bg-gray-50 transition"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleReview(selectedVerification._id, "rejected")}
                      disabled={reviewingId === selectedVerification._id}
                      className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
                    >
                      {reviewingId === selectedVerification._id && reviewingStatus === "rejected" ? (
                        <>
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <XCircle size={20} /> Reject
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReview(selectedVerification._id, "approved")}
                      disabled={reviewingId === selectedVerification._id}
                      className="flex-1 px-4 py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
                    >
                      {reviewingId === selectedVerification._id && reviewingStatus === "approved" ? (
                        <>
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={20} /> Approve
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIDVerification;
