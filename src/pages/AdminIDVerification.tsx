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
    fullName?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  idDocumentUrl: string;
  selfieUrl: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

const AdminIDVerification: React.FC = () => {
  const { user } = useAuth();
  const [verifications, setVerifications] = useState<IDVerification[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<IDVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVerification, setSelectedVerification] = useState<IDVerification | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewingStatus, setReviewingStatus] = useState<"approved" | "rejected" | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>("");

  // Load verifications
  useEffect(() => {
    loadVerifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getUserName = (verification: IDVerification) =>
    verification.userId?.fullName ||
    verification.userId?.name ||
    "Unknown user";

  const loadVerifications = async () => {
    try {
      setLoading(true);
      setError("");

      // Use the ID verification queue
      const endpoint = `/verification/admin/id/pending`;
      console.log(`[AdminIDVerification] Fetching from endpoint: ${endpoint}`);
      console.log(`[AdminIDVerification] Auth token present:`, !!localStorage.getItem("kodisha_token"));

      const response = await adminApiRequest(endpoint, {
        method: "GET",
      });

      console.log(`[AdminIDVerification] Response:`, response);

      if (response && response.success) {
        const data = Array.isArray(response.verifications) ? response.verifications : [];

        console.log(`[AdminIDVerification] Data loaded successfully, count:`, data.length);
        setVerifications(data);
        setFilteredVerifications(data);
      } else if (response && response.message) {
        console.log(`[AdminIDVerification] Response had a message:`, response.message);
        setError(response.message);
      } else {
        console.log(`[AdminIDVerification] Unexpected response format:`, response);
        setError("Unable to load verifications. Please check your connection and try again.");
      }
    } catch (err: any) {
      console.error("Error loading verifications:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        response: err.response,
      });
      setError(
        "Unable to load verifications. Please ensure you have the proper permissions and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter by search term
  useEffect(() => {
    const filtered = verifications.filter(
      (v) =>
        getUserName(v).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.userId?.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.userId?.phone || "").includes(searchTerm)
    );
    setFilteredVerifications(filtered);
  }, [searchTerm, verifications]);

  // Check admin authorization - AFTER all hooks and BEFORE rendering
  // Show loading state if user data is still being loaded from localStorage
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto pt-8 px-4">
        <div className="flex justify-center items-center py-12">
          <Clock className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

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

  const handleReview = async (verificationId: string, status: "approved" | "rejected") => {
    try {
      setReviewingId(verificationId);
      setReviewingStatus(status);

      // Use the correct endpoint based on status
      const endpoint = `/verification/admin/id/${verificationId}/review`;

      const response = await adminApiRequest(endpoint, {
        method: "PUT",
        body: JSON.stringify({
          status,
          notes: reviewNotes || undefined,
        }),
      });

      if (response.success) {
        // Remove from pending list
        setVerifications((prev) =>
          prev.filter((v) => v._id !== verificationId)
        );
        setSelectedVerification(null);

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
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold">
            <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-semibold">
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
            Rejected
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
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Verification Load Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
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
            No pending verifications
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
                      {getUserName(verification)}
                    </h3>
                    {getStatusBadge(verification.status)}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Email: {verification.userId?.email || "Not provided"}</p>
                    <p>Phone: {verification.userId?.phone || "Not provided"}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Submitted: {verification.submittedAt ? new Date(verification.submittedAt).toLocaleDateString() : "Recently"}
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
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">ID Verification</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Review application from {selectedVerification.fullName}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedVerification(null);
                  setReviewNotes("");
                }}
                className="text-gray-400 hover:text-gray-600 transition p-2"
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-4">Applicant Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Full Name</p>
                    <p className="text-gray-900 font-medium">{getUserName(selectedVerification)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</p>
                    {getStatusBadge(selectedVerification.status)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email Address</p>
                    <p className="text-gray-900 font-medium">{selectedVerification.userId?.email || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone Number</p>
                    <p className="text-gray-900 font-medium">{selectedVerification.userId?.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Submitted Date</p>
                    <p className="text-gray-900 font-medium">
                      {selectedVerification.submittedAt 
                        ? new Date(selectedVerification.submittedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'Recently submitted'}
                    </p>
                  </div>
                  {selectedVerification.reviewedAt && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Verified Date</p>
                      <p className="text-gray-900 font-medium">
                        {new Date(selectedVerification.reviewedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents Section */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">Government ID Document</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-4">
                    {selectedVerification.idDocumentUrl ? (
                      <img
                        src={selectedVerification.idDocumentUrl}
                        alt="ID Document"
                        className="w-full max-h-80 object-contain"
                      />
                    ) : (
                      <div className="h-48 flex items-center justify-center">
                        <p className="text-gray-500">No ID document front provided</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-3">Selfie with ID</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-4">
                    {selectedVerification.selfieUrl ? (
                      <img
                        src={selectedVerification.selfieUrl}
                        alt="Selfie"
                        className="w-full max-h-80 object-contain"
                      />
                    ) : (
                      <div className="h-48 flex items-center justify-center">
                        <p className="text-gray-500">No selfie provided</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Review Notes and Action Buttons */}
              {selectedVerification.status === "pending" && (
                <>
                  <div className="border-t border-gray-200 pt-6">
                    <label className="block font-bold text-gray-900 mb-3">Review Notes (Optional)</label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Document reasons for approval or rejection. This helps maintain consistency in verification standards..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-sm text-gray-700"
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedVerification(null);
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReview(selectedVerification._id, "rejected")}
                      disabled={reviewingId === selectedVerification._id}
                      className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
                    >
                      {reviewingId === selectedVerification._id && reviewingStatus === "rejected" ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <XCircle size={18} />
                          Reject Application
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReview(selectedVerification._id, "approved")}
                      disabled={reviewingId === selectedVerification._id}
                      className="flex-1 px-4 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
                    >
                      {reviewingId === selectedVerification._id && reviewingStatus === "approved" ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          Approve Application
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* Reviewed Status */}
              {selectedVerification.status !== "pending" && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Review Status</p>
                      {getStatusBadge(selectedVerification.status)}
                    </div>
                    {selectedVerification.notes && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Admin Notes</p>
                        <p className="text-gray-700 text-sm bg-white p-3 rounded border border-gray-200">{selectedVerification.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIDVerification;
